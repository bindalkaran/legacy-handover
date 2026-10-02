import 'server-only';
import { q, one } from './db';
import { advisorBusinessIds } from './owner';
import type { User } from './auth';
import { DOC_TARGETS } from './constants';

export type Side = 'owner' | 'buyer' | 'advisor';

export async function loadDeal(id: string, user: User) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const deal = await one(`SELECT d.*, b.owner_id, b.name AS biz_name, b.city AS biz_city, b.state AS biz_state, b.industry AS biz_industry, l.title AS listing_title, l.location AS listing_location
    FROM deals d JOIN businesses b ON b.id = d.business_id LEFT JOIN listings l ON l.id = d.listing_id WHERE d.id = $1`, [id]);
  if (!deal) return null;
  let side: Side | null = null;
  if (deal.owner_id === user.id) side = 'owner';
  else if (deal.buyer_id === user.id) side = 'buyer';
  else if ((await advisorBusinessIds(user.id)).includes(deal.business_id)) side = 'advisor';
  if (!side) return null;
  return { deal, side };
}

export function ndaDone(d: any) { return !!(d.nda_owner_at && d.nda_buyer_at); }

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
export async function assistant(d: any, side: Side, key: string) {
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
  return { a: 'Document reading and comparison need an AI provider to be connected. Until then the assistant answers only from structured records (documents index, questions, assessment).', cites: [] };
}
