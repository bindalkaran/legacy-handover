import 'server-only';
import { q, one } from './db';
import { advisorBusinessIds } from './owner';
import type { User } from './auth';
import { DOC_TARGETS, CLOSING_KEYS } from './constants';

export type Side = 'owner' | 'buyer' | 'advisor';
/** 'admin' is a read-only platform view (admin passphrase session). It never reaches server actions. */
export type ViewSide = Side | 'admin';

async function fetchDeal(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return await one(`SELECT d.*, b.owner_id, b.name AS biz_name, b.city AS biz_city, b.state AS biz_state, b.industry AS biz_industry, l.title AS listing_title, l.location AS listing_location
    FROM deals d JOIN businesses b ON b.id = d.business_id LEFT JOIN listings l ON l.id = d.listing_id WHERE d.id = $1`, [id]);
}

/** Read-only load for the admin console. Callers must check isAdmin() first. */
export async function loadDealForAdmin(id: string) {
  const deal = await fetchDeal(id);
  return deal ? { deal, side: 'admin' as const } : null;
}

export async function loadDeal(id: string, user: User) {
  const deal = await fetchDeal(id);
  if (!deal) return null;
  let side: Side | null = null;
  if (deal.owner_id === user.id) side = 'owner';
  else if (deal.buyer_id === user.id) side = 'buyer';
  else if ((await advisorBusinessIds(user.id)).includes(deal.business_id)) side = 'advisor';
  if (!side) return null;
  return { deal, side };
}

export function ndaDone(d: any) { return !!(d.nda_owner_at && d.nda_buyer_at); }
export function closingComplete(d: any) { const cl = d.closing || {}; return CLOSING_KEYS.every((k) => cl[k]); }

/** Role-aware next step line used in the workspace and on dashboards. */
export function nextStep(d: any, side: string, nda: boolean) {
  if (side === 'admin') return 'Read-only view. Actions are taken by the owner and acquirer.';
  if (!nda) return (side === 'owner' && !d.nda_owner_at) || (side === 'buyer' && !d.nda_buyer_at) ? 'Review and sign the mutual NDA.' : 'Waiting for the other party to sign the NDA.';
  if (d.closed_at) return 'Work through the 90-day transition checklist together.';
  if (d.stage < 6) return side === 'buyer' ? 'Review the Level 3 data room and send your questions.' : 'Upload Level 3 documents and answer open questions.';
  if (d.stage < 7) return side === 'buyer' ? 'Complete diligence and prepare an indicative offer.' : 'Answer diligence questions; consider Level 4 access.';
  if (d.stage < 9) return 'Negotiate the offer until both sides accept.';
  return 'Work through the closing conditions with your advisors.';
}

export async function dealHealth(d: any) {
  const qs = await q(`SELECT created_at, answered_at FROM deal_questions WHERE deal_id = $1`, [d.id]);
  const answered = qs.filter((x) => x.answered_at);
  const avgH = answered.length ? answered.reduce((a, x) => a + (new Date(x.answered_at).getTime() - new Date(x.created_at).getTime()), 0) / answered.length / 3.6e6 : null;
  const openOld = qs.filter((x) => !x.answered_at && Date.now() - new Date(x.created_at).getTime() > 5 * 864e5).length;
  const docs = await q(`SELECT category, count(DISTINCT name)::int AS n, sum(views)::int AS v FROM documents WHERE business_id = $1 GROUP BY category`, [d.business_id]);
  const missing = Object.entries(DOC_TARGETS).reduce((a, [c, t]) => a + Math.max(0, t - (docs.find((x) => x.category === c)?.n ?? 0)), 0);
  const totalDocs = docs.reduce((a, x) => a + x.n, 0);
  const viewed = docs.reduce((a, x) => a + (x.v || 0), 0);
  const offers = await one(`SELECT count(*)::int AS c FROM offers WHERE deal_id = $1`, [d.id]);
  const last = await one(`SELECT max(created_at) AS t FROM audit_logs WHERE deal_id = $1`, [d.id]);
  const idleDays = last?.t ? (Date.now() - new Date(last.t).getTime()) / 864e5 : (Date.now() - new Date(d.created_at).getTime()) / 864e5;
  const fin = Object.values(d.referrals || {}).some(Boolean);
  const factors: [string, string, boolean][] = [
    ['Response time', avgH == null ? 'No questions answered yet' : avgH < 48 ? 'Within 2 days' : `${Math.round(avgH / 24)} days on average`, avgH == null || avgH < 96],
    ['Missing documents', missing ? `${missing} outstanding` : 'Data room complete', missing <= 3],
    ['Financing', fin ? 'Referral requested' : d.stage >= 7 ? 'Not yet identified' : 'Not needed yet', fin || d.stage < 7],
    ['Due diligence', totalDocs ? `${Math.min(100, Math.round((viewed / Math.max(totalDocs, 1)) * 100))}% of documents reviewed` : 'No documents yet', totalDocs > 0],
    ['Legal', ndaDone(d) ? 'NDA signed' : 'NDA pending', ndaDone(d)],
    ['Offer changes', offers?.c ? `${offers.c} offer${offers.c > 1 ? 's' : ''} logged` : 'None yet', true]
  ];
  if (d.closed_at) return { status: 'Closed', why: 'Closing complete, transition in progress', factors };
  let status = 'Healthy', why = 'All responses on time';
  if (idleDays > 21) { status = 'Stalled'; why = `No activity ${Math.round(idleDays)} days`; }
  else if (d.stage >= 7 && !fin) { status = 'At risk'; why = 'Financing not yet identified'; }
  else if (openOld || factors.filter((f) => !f[2]).length >= 2) { status = 'Needs attention'; why = openOld ? `${openOld} question${openOld > 1 ? 's' : ''} waiting over 5 days` : factors.filter((f) => !f[2]).map((f) => f[0]).join(', '); }
  return { status, why, factors };
}

export const HEALTH_PILL: Record<string, string> = { Healthy: 'p-green', 'Needs attention': 'p-gold', 'At risk': 'p-warn', Stalled: 'p-grey', Closed: 'p-solid' };

/** Deterministic deal assistant: answers computed from records the viewer can access. */
export type AssistantAnswer = { a: string; cites: string[]; ai: boolean };

export async function assistant(d: any, side: Side, key: string): Promise<AssistantAnswer> {
  const r = await assistantRules(d, side, key);
  // Every answer below is computed from structured records. Mark ai: true only if a model produced the text.
  return { ...r, ai: false };
}

async function assistantRules(d: any, side: Side, key: string): Promise<{ a: string; cites: string[] }> {
  const maxLevel = side === 'buyer' ? d.buyer_max_level : 4;
  const docs = await q(`SELECT category, name, version, level FROM documents WHERE business_id = $1 AND level <= $2 ${side === 'buyer' ? "AND permission <> 'Hidden'" : ''} ORDER BY category, name`, [d.business_id, maxLevel]);
  const cites = (xs: any[]) => xs.slice(0, 3).map((x) => `${x.category} › ${x.name} v${x.version}`);
  if (key === 'missing') {
    const have = new Set(docs.map((x) => x.category));
    const counts = Object.fromEntries(Object.keys(DOC_TARGETS).map((c) => [c, docs.filter((x) => x.category === c).length]));
    const gaps = Object.entries(DOC_TARGETS).filter(([c, t]) => counts[c] < t).map(([c, t]) => `${c} (${counts[c]} of ~${t} typical)`);
    return { a: gaps.length ? `Categories below what is usually requested at this stage: ${gaps.join('; ')}. ${have.size ? '' : 'No documents are visible to you yet.'}` : 'Every data room category has the typical set of documents.', cites: ['Data room index'] };
  }
  if (key === 'summary') {
    const s = await one(`SELECT transferability, readiness, independence, labels, revenue_mid, profit FROM scores WHERE business_id = $1 ORDER BY created_at DESC LIMIT 1`, [d.business_id]);
    if (!s) return { a: 'No assessment data is available for this business yet.', cites: [] };
    return { a: `Owner-supplied profile: ${s.labels?.industry}, revenue ${s.labels?.revenue}, ${s.labels?.employees} employees, operating ${s.labels?.years} years. Platform scores: Transferability ${s.transferability}, Succession Readiness ${s.readiness}, Business Independence ${s.independence}. ${docs.length} documents are visible to you; verify figures against audited statements.`, cites: ['Assessment (owner-supplied)', ...cites(docs.filter((x) => x.category === 'Financial'))] };
  }
  if (key === 'questions') {
    return { a: 'Commonly useful at this stage: How dependent are key customer and supplier relationships on the current owner? What is the renewal position on premises and key contracts? How have receivables and working capital moved over three years? Which licences or consents need transfer on a change of ownership? What role will the owner play during transition?', cites: ['Checklist · not generated from documents'] };
  }
  if (key === 'open') {
    const open = await q(`SELECT question FROM deal_questions WHERE deal_id = $1 AND answer IS NULL ORDER BY created_at`, [d.id]);
    return { a: open.length ? `${open.length} open question${open.length > 1 ? 's' : ''}: ` + open.map((x, i) => `(${i + 1}) ${x.question}`).join(' ') : 'There are no open questions between the parties.', cites: ['Questions & answers'] };
  }
  if (key === 'risks') {
    const counts = Object.fromEntries(Object.keys(DOC_TARGETS).map((c) => [c, docs.filter((x) => x.category === c).length]));
    const gaps = Object.entries(DOC_TARGETS).filter(([c, t]) => counts[c] < t).map(([c, t]) => `${c} (${counts[c]} of ~${t})`);
    const h = await dealHealth(d);
    const weak = h.factors.filter((f) => !f[2]).map((f) => `${f[0]}: ${f[1]}`);
    const open = await one(`SELECT count(*)::int AS c, count(*) FILTER (WHERE created_at < now() - interval '5 days')::int AS old FROM deal_questions WHERE deal_id = $1 AND answer IS NULL`, [d.id]);
    const parts: string[] = [];
    if (gaps.length) parts.push(`Document gaps in categories visible to you: ${gaps.join('; ')}.`);
    if (weak.length) parts.push(`Deal health factors needing attention: ${weak.join('; ')}.`);
    if (open?.c) parts.push(`${open.c} question${open.c > 1 ? 's are' : ' is'} still unanswered${open.old ? `, ${open.old} of them for more than 5 days` : ''}.`);
    if (!ndaDone(d)) parts.push('The mutual NDA is not yet signed by both parties.');
    return { a: parts.length ? `Areas to look at first. ${parts.join(' ')} This list is built from the document index, deal health and open questions, not from reading document contents.` : 'No index-level risk areas found: the data room has the typical set of documents, health factors are on track and no questions are open. This does not replace diligence on the documents themselves.', cites: ['Data room index', 'Deal health', 'Questions & answers'] };
  }
  return { a: 'Document reading and comparison need an AI provider to be connected. Until then the assistant answers only from structured records (documents index, questions, assessment).', cites: [] };
}
