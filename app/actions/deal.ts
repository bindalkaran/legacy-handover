'use server';
import { revalidatePath } from 'next/cache';
import { currentUser } from '@/lib/auth';
import { q, one, audit, track } from '@/lib/db';
import { loadDeal, assistant as runAssistant, ndaDone, closingComplete } from '@/lib/deals';
import { DEAL_STAGES, CLOSING_ITEMS, CLOSING_KEYS, TRANSITION_KEYS, LENDERS, SELLER_INSTALMENTS } from '@/lib/constants';

async function ctx(dealId: string) {
  const u = await currentUser();
  if (!u) throw new Error('Sign in required');
  const r = await loadDeal(dealId, u);
  if (!r) throw new Error('No access');
  return { u, ...r };
}
const label = (side: string) => (side === 'owner' ? 'Owner' : side === 'buyer' ? 'Acquirer' : 'Owner’s advisor');
const done = (id: string) => revalidatePath('/deals/' + id);

export async function signNda(dealId: string) {
  const { u, deal, side } = await ctx(dealId);
  if (side === 'advisor') return { ok: false };
  const col = side === 'owner' ? 'nda_owner_at' : 'nda_buyer_at';
  if (deal[col]) return { ok: true };
  const d = await one(`UPDATE deals SET ${col} = now(), updated_at = now() WHERE id = $1 RETURNING *`, [dealId]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `${label(side)} signed the mutual NDA (electronic acceptance)`, kind: 'NDA' });
  if (ndaDone(d)) {
    await q(`UPDATE deals SET stage = GREATEST(stage, 4), buyer_max_level = GREATEST(buyer_max_level, 3) WHERE id = $1`, [dealId]);
    await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: 'Mutual NDA executed · Level 3 unlocked', kind: 'NDA' });
    await track('nda_signed', u.id);
  } else await track('nda_sent', u.id);
  done(dealId);
  return { ok: true };
}

export async function grantDiligence(dealId: string) {
  const { u, deal, side } = await ctx(dealId);
  if (side !== 'owner' || !ndaDone(deal)) return { ok: false };
  await q(`UPDATE deals SET buyer_max_level = 4, stage = GREATEST(stage, 6), updated_at = now() WHERE id = $1`, [dealId]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: 'Owner granted Level 4 (due diligence) access', kind: 'Permission' });
  done(dealId);
  return { ok: true };
}

export async function setStage(dealId: string, stage: number) {
  const { u, deal, side } = await ctx(dealId);
  if (side !== 'owner') return { ok: false };
  if (!Number.isFinite(Number(stage))) return { ok: false };
  const s = Math.max(2, Math.min(DEAL_STAGES.length - 1, Math.floor(Number(stage))));
  if (s > 3 && !ndaDone(deal)) return { ok: false, error: 'Both parties must sign the NDA first.' };
  if (deal.closed_at && s < deal.stage) return { ok: false, error: 'Closing is recorded, so the stage cannot move back.' };
  if (s >= 11 && !closingComplete(deal)) return { ok: false, error: 'Complete every closing condition first.' };
  if (s >= 12 && !deal.closed_at) return { ok: false, error: 'Transition starts once closing is recorded.' };
  await q(`UPDATE deals SET stage = $2, updated_at = now() WHERE id = $1`, [dealId, s]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `Stage moved to ${DEAL_STAGES[s]}`, kind: 'Stage' });
  if (s === 12 && deal.stage !== 12) await track('transition_started', u.id);
  done(dealId);
  return { ok: true };
}

export async function askQuestion(dealId: string, text: string) {
  const { u, deal, side } = await ctx(dealId);
  const t = text.trim().slice(0, 1000);
  if (!t) return { ok: false };
  await q(`INSERT INTO deal_questions (deal_id, author_id, author_side, question) VALUES ($1,$2,$3,$4)`, [dealId, u.id, label(side), t]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `${label(side)} asked a question`, kind: 'Q&A' });
  done(dealId);
  return { ok: true };
}

export async function answerQuestion(dealId: string, qid: string, text: string) {
  const { u, deal, side } = await ctx(dealId);
  const t = text.trim().slice(0, 2000);
  const row = await one(`SELECT * FROM deal_questions WHERE id = $1 AND deal_id = $2`, [qid, dealId]);
  if (!row || !t) return { ok: false };
  const askerIsBuyer = row.author_side === 'Acquirer';
  if ((askerIsBuyer && side === 'buyer') || (!askerIsBuyer && side !== 'buyer')) return { ok: false, error: 'The other party answers this question.' };
  await q(`UPDATE deal_questions SET answer = $2, answered_at = now() WHERE id = $1`, [qid, t]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `${label(side)} answered a question`, kind: 'Q&A' });
  done(dealId);
  return { ok: true };
}

export async function submitOffer(dealId: string, f: { equity: number; debt: number; seller: number; earn: number; months: number; conditions: string }) {
  const { u, deal, side } = await ctx(dealId);
  if (side === 'advisor') return { ok: false };
  if (!ndaDone(deal)) return { ok: false, error: 'Offers open after the NDA is signed by both parties.' };
  const n = (x: unknown) => Math.max(0, Math.min(10000, Number(x) || 0));
  if (n(f.equity) + n(f.debt) + n(f.seller) + n(f.earn) <= 0) return { ok: false, error: 'Enter at least one amount.' };
  if (await one(`SELECT 1 FROM offers WHERE deal_id = $1 AND status = 'Accepted'`, [dealId])) return { ok: false, error: 'An offer has already been accepted. Changes now go through the definitive agreement.' };
  await q(`UPDATE offers SET status = 'Countered' WHERE deal_id = $1 AND (status LIKE 'Awaiting%' OR status = 'Clarification requested')`, [dealId]);
  await q(`INSERT INTO offers (deal_id, from_side, equity, debt, seller_financing, earn_out, timeline_months, conditions, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [dealId, label(side), n(f.equity), n(f.debt), n(f.seller), n(f.earn), Math.max(1, Math.min(60, Math.floor(Number(f.months) || 6))), (f.conditions || '').slice(0, 800), side === 'owner' ? 'Awaiting acquirer' : 'Awaiting owner']);
  await q(`UPDATE deals SET stage = GREATEST(stage, 7), updated_at = now() WHERE id = $1`, [dealId]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `${label(side)} submitted ${side === 'owner' ? 'a counter-offer' : 'an offer'}`, kind: 'Offer' });
  await track(side === 'owner' ? 'offer_countered' : 'offer_submitted', u.id);
  done(dealId);
  return { ok: true };
}

export async function respondOffer(dealId: string, offerId: string, action: 'Accepted' | 'Rejected' | 'Clarification requested') {
  const { u, deal, side } = await ctx(dealId);
  if (!['Accepted', 'Rejected', 'Clarification requested'].includes(action)) return { ok: false };
  const o = await one(`SELECT * FROM offers WHERE id = $1 AND deal_id = $2`, [offerId, dealId]);
  if (!o) return { ok: false };
  if (await one(`SELECT 1 FROM offers WHERE deal_id = $1 AND status = 'Accepted' AND id <> $2`, [dealId, offerId])) return { ok: false, error: 'Another offer has already been accepted.' };
  const awaitingMe = (o.status === 'Awaiting owner' && side === 'owner') || (o.status === 'Awaiting acquirer' && side === 'buyer') || (o.status === 'Clarification requested' && ((o.from_side === 'Acquirer' && side === 'owner') || (o.from_side === 'Owner' && side === 'buyer')));
  if (!awaitingMe) return { ok: false };
  await q(`UPDATE offers SET status = $2 WHERE id = $1`, [offerId, action]);
  if (action === 'Accepted') await q(`UPDATE deals SET stage = GREATEST(stage, 9), updated_at = now() WHERE id = $1`, [dealId]);
  else await q(`UPDATE deals SET stage = GREATEST(stage, 8), updated_at = now() WHERE id = $1`, [dealId]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `${label(side)}: offer ${action.toLowerCase()}`, kind: 'Offer' });
  done(dealId);
  return { ok: true };
}

/** The side that made an offer answers a clarification request. The reply is logged and the offer goes back to the other party. */
export async function replyClarification(dealId: string, offerId: string, text: string) {
  const { u, deal, side } = await ctx(dealId);
  if (side === 'advisor') return { ok: false };
  const t = (text || '').trim().slice(0, 1500);
  if (!t) return { ok: false, error: 'Write a reply first.' };
  const o = await one(`SELECT * FROM offers WHERE id = $1 AND deal_id = $2`, [offerId, dealId]);
  if (!o || o.status !== 'Clarification requested' || o.from_side !== label(side)) return { ok: false };
  const back = o.from_side === 'Acquirer' ? 'Awaiting owner' : 'Awaiting acquirer';
  await q(`UPDATE offers SET status = $2 WHERE id = $1`, [offerId, back]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `${label(side)} replied to a clarification request: ${t.slice(0, 140)}`, kind: 'Clarification', detail: { offerId, reply: t } });
  done(dealId);
  return { ok: true };
}

export async function requestReferral(dealId: string, idx: number) {
  const { u, deal, side } = await ctx(dealId);
  if (side !== 'owner' && side !== 'buyer') return { ok: false };
  if (!Number.isInteger(idx) || !LENDERS[idx]) return { ok: false };
  const refs = { ...(deal.referrals || {}), [idx]: new Date().toISOString() };
  await q(`UPDATE deals SET referrals = $2::jsonb WHERE id = $1`, [dealId, JSON.stringify(refs)]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `${label(side)} requested a financing referral: ${LENDERS[idx][0]}`, kind: 'Financing' });
  done(dealId);
  return { ok: true };
}

export async function toggleChecklist(dealId: string, kind: 'closing' | 'transition', key: string) {
  const { u, deal, side } = await ctx(dealId);
  if (side === 'advisor') return { ok: false };
  if (kind !== 'closing' && kind !== 'transition') return { ok: false };
  if (!(kind === 'closing' ? CLOSING_KEYS : TRANSITION_KEYS).includes(key)) return { ok: false };
  if (kind === 'closing' && deal.closed_at) return { ok: false, error: 'Closing is already recorded.' };
  const cur = { ...(deal[kind] || {}) };
  cur[key] = cur[key] ? null : new Date().toISOString();
  await q(`UPDATE deals SET ${kind} = $2::jsonb, updated_at = now() WHERE id = $1`, [dealId, JSON.stringify(cur)]);
  const label2 = kind === 'closing' ? CLOSING_ITEMS[Number(key)][0] : key;
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `${cur[key] ? 'Completed' : 'Reopened'}: ${label2}`, kind: kind === 'closing' ? 'Closing' : 'Transition' });
  let note: string | undefined;
  if (kind === 'closing' && closingComplete({ closing: cur })) {
    const accepted = await one(`SELECT 1 FROM offers WHERE deal_id = $1 AND status = 'Accepted'`, [dealId]);
    if (!ndaDone(deal) || !accepted) {
      note = 'All conditions are ticked, but closing is recorded only once both parties have signed the NDA and an offer is accepted.';
    } else {
      await q(`UPDATE deals SET stage = 12, closed_at = now() WHERE id = $1 AND closed_at IS NULL`, [dealId]);
      await q(`UPDATE businesses SET lifecycle = 'Transition' WHERE id = $1`, [deal.business_id]);
      await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: 'All closing conditions recorded as complete · transition started', kind: 'Closing' });
      await track('deal_closed', u.id);
      await track('transition_started', u.id);
    }
  }
  done(dealId);
  return { ok: true, note };
}

/** Owner records a seller-financing instalment as received (or undoes it). Stored in deals.closing.instalments. */
export async function toggleInstalment(dealId: string, idx: number) {
  const { u, deal, side } = await ctx(dealId);
  if (side !== 'owner') return { ok: false };
  if (!Number.isInteger(idx) || idx < 0 || idx >= SELLER_INSTALMENTS) return { ok: false };
  if (!deal.closed_at) return { ok: false, error: 'Instalments start after closing.' };
  const o = await one(`SELECT seller_financing FROM offers WHERE deal_id = $1 AND status = 'Accepted' ORDER BY created_at DESC LIMIT 1`, [dealId]);
  if (!o || Number(o.seller_financing) <= 0) return { ok: false };
  const cl = { ...(deal.closing || {}) };
  const ins = { ...(cl.instalments || {}) };
  ins[String(idx)] = ins[String(idx)] ? null : new Date().toISOString();
  cl.instalments = ins;
  await q(`UPDATE deals SET closing = $2::jsonb, updated_at = now() WHERE id = $1`, [dealId, JSON.stringify(cl)]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `Seller financing instalment ${idx + 1} of ${SELLER_INSTALMENTS} ${ins[String(idx)] ? 'recorded as received' : 'marked not received'}`, kind: 'Closing' });
  done(dealId);
  return { ok: true };
}

type Milestone = { id: string; title: string; amount: number; measure: string; progress: number };

/** Owner or acquirer adds an earn-out milestone. Total of milestone amounts cannot exceed the accepted earn-out. */
export async function addEarnout(dealId: string, f: { title: string; amount: number; measure: string }) {
  const { u, deal, side } = await ctx(dealId);
  if (side !== 'owner' && side !== 'buyer') return { ok: false };
  const o = await one(`SELECT earn_out FROM offers WHERE deal_id = $1 AND status = 'Accepted' ORDER BY created_at DESC LIMIT 1`, [dealId]);
  if (!o || Number(o.earn_out) <= 0) return { ok: false, error: 'Earn-out milestones need an accepted offer with an earn-out.' };
  const title = (f.title || '').trim().slice(0, 160), measure = (f.measure || '').trim().slice(0, 80);
  const amount = Math.round(Math.max(0, Number(f.amount) || 0) * 100) / 100;
  if (!title || amount <= 0) return { ok: false, error: 'Add a milestone and an amount.' };
  const cl = { ...(deal.closing || {}) };
  const list: Milestone[] = Array.isArray(cl.earnout) ? cl.earnout : [];
  if (list.length >= 12) return { ok: false, error: 'Up to 12 milestones.' };
  const used = list.reduce((a, m) => a + Number(m.amount || 0), 0);
  if (used + amount > Number(o.earn_out) + 1e-9) return { ok: false, error: `Milestones cannot exceed the earn-out of ₹${Number(o.earn_out).toFixed(2)} Cr (₹${(Number(o.earn_out) - used).toFixed(2)} Cr left).` };
  cl.earnout = [...list, { id: crypto.randomUUID(), title, amount, measure, progress: 0 }];
  await q(`UPDATE deals SET closing = $2::jsonb, updated_at = now() WHERE id = $1`, [dealId, JSON.stringify(cl)]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `${label(side)} added an earn-out milestone: ${title} (₹${amount.toFixed(2)} Cr)`, kind: 'Closing' });
  done(dealId);
  return { ok: true };
}

export async function setEarnoutProgress(dealId: string, id: string, progress: number) {
  const { u, deal, side } = await ctx(dealId);
  if (side !== 'owner' && side !== 'buyer') return { ok: false };
  const cl = { ...(deal.closing || {}) };
  const list: Milestone[] = Array.isArray(cl.earnout) ? cl.earnout : [];
  const m = list.find((x) => x.id === id);
  if (!m) return { ok: false };
  const p = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
  cl.earnout = list.map((x) => (x.id === id ? { ...x, progress: p } : x));
  await q(`UPDATE deals SET closing = $2::jsonb, updated_at = now() WHERE id = $1`, [dealId, JSON.stringify(cl)]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `${label(side)} recorded earn-out progress ${p}%: ${m.title}`, kind: 'Closing' });
  done(dealId);
  return { ok: true };
}

/** Financing details: collateral (either party) and the acquirer's self-reported credit profile (acquirer only). */
export async function saveFinancing(dealId: string, f: { collateral?: string; credit?: string }) {
  const { u, deal, side } = await ctx(dealId);
  if (side !== 'owner' && side !== 'buyer') return { ok: false };
  const cl = { ...(deal.closing || {}) };
  const fin = { ...(cl.financing || {}) };
  if (typeof f.collateral === 'string') fin.collateral = f.collateral.trim().slice(0, 200);
  if (typeof f.credit === 'string') {
    if (side !== 'buyer') return { ok: false, error: 'The acquirer records their own credit profile.' };
    fin.credit = f.credit.trim().slice(0, 200);
  }
  fin.updated_by = label(side);
  cl.financing = fin;
  await q(`UPDATE deals SET closing = $2::jsonb, updated_at = now() WHERE id = $1`, [dealId, JSON.stringify(cl)]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `${label(side)} updated financing details`, kind: 'Financing' });
  done(dealId);
  return { ok: true };
}

const ASSISTANT_KEYS = ['summary', 'missing', 'questions', 'open', 'compare', 'risks'];
export async function askAssistant(dealId: string, key: string) {
  const { deal, side } = await ctx(dealId);
  if (!ASSISTANT_KEYS.includes(key)) return { a: 'Choose one of the prompts.', cites: [], ai: false };
  return await runAssistant(deal, side, key);
}
