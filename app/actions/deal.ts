'use server';
import { revalidatePath } from 'next/cache';
import { currentUser } from '@/lib/auth';
import { q, one, audit, track } from '@/lib/db';
import { loadDeal, assistant as runAssistant, ndaDone } from '@/lib/deals';
import { DEAL_STAGES, CLOSING_ITEMS, LENDERS } from '@/lib/constants';

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
  const s = Math.max(2, Math.min(DEAL_STAGES.length - 1, Math.floor(stage)));
  if (s >= 3 && !ndaDone(deal) && s > 3) return { ok: false, error: 'Both parties must sign the NDA first.' };
  await q(`UPDATE deals SET stage = $2, updated_at = now() WHERE id = $1`, [dealId, s]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `Stage moved to ${DEAL_STAGES[s]}`, kind: 'Stage' });
  if (s === 12) await track('transition_started', u.id);
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
  await q(`UPDATE offers SET status = 'Countered' WHERE deal_id = $1 AND status LIKE 'Awaiting%'`, [dealId]);
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
  const awaitingMe = (o.status === 'Awaiting owner' && side === 'owner') || (o.status === 'Awaiting acquirer' && side === 'buyer') || (o.status === 'Clarification requested' && ((o.from_side === 'Acquirer' && side === 'owner') || (o.from_side === 'Owner' && side === 'buyer')));
  if (!awaitingMe) return { ok: false };
  await q(`UPDATE offers SET status = $2 WHERE id = $1`, [offerId, action]);
  if (action === 'Accepted') await q(`UPDATE deals SET stage = GREATEST(stage, 9), updated_at = now() WHERE id = $1`, [dealId]);
  else await q(`UPDATE deals SET stage = GREATEST(stage, 8), updated_at = now() WHERE id = $1`, [dealId]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `${label(side)}: offer ${action.toLowerCase()}`, kind: 'Offer' });
  done(dealId);
  return { ok: true };
}

export async function requestReferral(dealId: string, idx: number) {
  const { u, deal, side } = await ctx(dealId);
  if (!LENDERS[idx]) return { ok: false };
  const refs = { ...(deal.referrals || {}), [idx]: new Date().toISOString() };
  await q(`UPDATE deals SET referrals = $2::jsonb WHERE id = $1`, [dealId, JSON.stringify(refs)]);
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `${label(side)} requested a financing referral: ${LENDERS[idx][0]}`, kind: 'Financing' });
  done(dealId);
  return { ok: true };
}

export async function toggleChecklist(dealId: string, kind: 'closing' | 'transition', key: string) {
  const { u, deal, side } = await ctx(dealId);
  if (side === 'advisor' && kind === 'transition') return { ok: false };
  const cur = { ...(deal[kind] || {}) };
  cur[key] = cur[key] ? null : new Date().toISOString();
  await q(`UPDATE deals SET ${kind} = $2::jsonb, updated_at = now() WHERE id = $1`, [dealId, JSON.stringify(cur)]);
  if (kind === 'closing') {
    const nDone = CLOSING_ITEMS.filter((_, i) => cur[String(i)]).length;
    if (nDone === CLOSING_ITEMS.length && !deal.closed_at) {
      await q(`UPDATE deals SET stage = 12, closed_at = now() WHERE id = $1`, [dealId]);
      await q(`UPDATE businesses SET lifecycle = 'Transition' WHERE id = $1`, [deal.business_id]);
      await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: 'All closing conditions recorded as complete · transition started', kind: 'Closing' });
      await track('deal_closed', u.id);
    }
  }
  const label2 = kind === 'closing' ? CLOSING_ITEMS[Number(key)]?.[0] : key;
  await audit({ actorId: u.id, businessId: deal.business_id, dealId, action: `${cur[key] ? 'Completed' : 'Reopened'}: ${label2}`, kind: kind === 'closing' ? 'Closing' : 'Transition' });
  done(dealId);
  return { ok: true };
}

export async function askAssistant(dealId: string, key: string) {
  const { deal, side } = await ctx(dealId);
  return await runAssistant(deal, side, key);
}
