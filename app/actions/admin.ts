'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isAdmin, adminLogin, adminLogout } from '@/lib/auth';
import { q, one, audit, setConfig, config } from '@/lib/db';
import { COMPONENT_KEYS } from '@/lib/assessment';

async function guard() { if (!(await isAdmin())) throw new Error('Admin only'); }
const done = () => revalidatePath('/admin');

export async function login(_: unknown, fd: FormData) {
  const ok = await adminLogin(String(fd.get('password') || ''));
  if (!ok) return { error: 'Incorrect passphrase.' };
  redirect('/admin');
}
export async function logout() { await adminLogout(); redirect('/admin'); }

const FLOW = ['New', 'In review', 'Verified', 'Profile approved'];
export async function advanceOwner(businessId: string) {
  await guard();
  const b = await one(`SELECT review_status FROM businesses WHERE id = $1`, [businessId]);
  if (!b) return;
  const next = FLOW[Math.min(3, FLOW.indexOf(b.review_status) + 1)];
  await q(`UPDATE businesses SET review_status = $2, verification = CASE WHEN $2 IN ('Verified','Profile approved') THEN 'Business verified' ELSE verification END WHERE id = $1`, [businessId, next]);
  await audit({ actorLabel: 'admin', businessId, action: `Review status: ${next}`, kind: 'Admin' });
  done();
}

export async function setVerification(businessId: string, v: string) {
  await guard();
  if (!['Self-reported', 'Partially verified', 'Business verified', 'Financially verified', 'Transaction ready'].includes(v)) return;
  await q(`UPDATE businesses SET verification = $2 WHERE id = $1`, [businessId, v]);
  await q(`UPDATE listings SET verification = $2 WHERE business_id = $1`, [businessId, v]);
  await audit({ actorLabel: 'admin', businessId, action: `Verification set to ${v}`, kind: 'Admin' });
  done();
}

export async function decideListing(listingId: string, approve: boolean) {
  await guard();
  const l = await one(`SELECT l.*, b.confidentiality_level FROM listings l LEFT JOIN businesses b ON b.id = l.business_id WHERE l.id = $1`, [listingId]);
  if (!l) return;
  if (approve && l.business_id && l.confidentiality_level < 1) return;
  await q(`UPDATE listings SET status = $2, updated_at = now() WHERE id = $1`, [listingId, approve ? 'published' : 'draft']);
  if (approve && l.business_id) await q(`UPDATE businesses SET review_status = 'Profile approved', lifecycle = 'Matching' WHERE id = $1`, [l.business_id]);
  await audit({ actorLabel: 'admin', businessId: l.business_id, action: approve ? 'Anonymous profile approved and published' : 'Anonymous profile returned for edits', kind: 'Admin' });
  revalidatePath('/acquire'); done();
}

export async function setBuyerStage(userId: string, stage: number) {
  await guard();
  await q(`UPDATE buyer_profiles SET verification_stage = $2 WHERE user_id = $1`, [userId, Math.max(1, Math.min(4, stage))]);
  if (stage >= 2) await q(`INSERT INTO analytics_events (name, user_id) VALUES ('buyer_verified', $1)`, [userId]);
  await audit({ actorLabel: 'admin', action: `Buyer verification stage ${stage}`, kind: 'Admin', detail: { userId } });
  done();
}

export async function addContact(fd: FormData) {
  await guard();
  const v = (k: string) => String(fd.get(k) || '').trim().slice(0, 120);
  if (!v('name')) return;
  const c = await one(`INSERT INTO crm_contacts (name, company, city, source) VALUES ($1,$2,$3,$4) RETURNING id, name, city`, [v('name'), v('company'), v('city'), v('source')]);
  const first = c!.name.split(' ').slice(-1)[0];
  const body = `Namaste ${first}, we’re helping established business owners${c!.city ? ' in ' + c!.city : ''} plan what comes next, whether that means family succession, management transition or an eventual sale. Our 7-minute private assessment shows how transferable a business is today. Would it be useful to you? (Reply STOP to opt out.)`;
  await q(`INSERT INTO outreach_drafts (contact_id, body) VALUES ($1,$2)`, [c!.id, body]);
  done();
}

const STAGES = ['Prospect', 'Contacted', 'Interested', 'Assessment started', 'Assessment complete', 'Paid plan', 'Succession mandate', 'Transaction'];
export async function moveContact(id: string, dir: 1 | -1) {
  await guard();
  const c = await one(`SELECT stage FROM crm_contacts WHERE id = $1`, [id]);
  if (!c) return;
  const i = Math.max(0, Math.min(STAGES.length - 1, STAGES.indexOf(c.stage) + dir));
  await q(`UPDATE crm_contacts SET stage = $2, updated_at = now() WHERE id = $1`, [id, STAGES[i]]);
  done();
}

export async function suppressContact(id: string) {
  await guard();
  await q(`UPDATE crm_contacts SET suppressed = true WHERE id = $1`, [id]);
  await q(`UPDATE outreach_drafts SET status = 'rejected' WHERE contact_id = $1 AND status = 'awaiting approval'`, [id]);
  done();
}

export async function decideDraft(id: string, approve: boolean, body?: string) {
  await guard();
  const d = await one(`SELECT d.*, c.suppressed FROM outreach_drafts d JOIN crm_contacts c ON c.id = d.contact_id WHERE d.id = $1`, [id]);
  if (!d || d.suppressed) return;
  if (body && body.trim()) await q(`UPDATE outreach_drafts SET body = $2 WHERE id = $1`, [id, body.trim().slice(0, 1200)]);
  await q(`UPDATE outreach_drafts SET status = $2, approved_at = CASE WHEN $2 = 'approved' THEN now() ELSE NULL END WHERE id = $1`, [id, approve ? 'approved' : 'rejected']);
  if (approve) await q(`UPDATE crm_contacts SET stage = CASE WHEN stage = 'Prospect' THEN 'Contacted' ELSE stage END, updated_at = now() WHERE id = $1`, [d.contact_id]);
  await audit({ actorLabel: 'admin', action: `Outreach draft ${approve ? 'approved & queued' : 'rejected'}`, kind: 'Admin' });
  done();
}

export async function saveWeights(weights: Record<string, number>) {
  await guard();
  const w: Record<string, number> = {};
  for (const k of COMPONENT_KEYS) w[k] = Math.max(0, Math.min(40, Math.round(Number(weights[k]) || 0)));
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  if (total !== 100) return { ok: false, error: `Weights must total 100 (currently ${total}).` };
  const cur = await config<string>('active_score_version', 'score-v1.0');
  const [maj, min] = cur.replace('score-v', '').split('.').map(Number);
  let version = `score-v${maj}.${(min || 0) + 1}`;
  while (await one(`SELECT 1 FROM score_versions WHERE version = $1`, [version])) { const m = version.match(/\.(\d+)$/); version = version.replace(/\.(\d+)$/, '.' + (Number(m![1]) + 1)); }
  await q(`INSERT INTO score_versions (version, weights, created_by) VALUES ($1,$2::jsonb,'admin')`, [version, JSON.stringify(w)]);
  await setConfig('active_score_version', version);
  await audit({ actorLabel: 'admin', action: `Created ${version} and made it active`, kind: 'Admin', detail: w });
  done();
  return { ok: true, version };
}

export async function toggleSamples(show: boolean) {
  await guard();
  await setConfig('show_samples', show);
  await audit({ actorLabel: 'admin', action: `Sample listings & profiles ${show ? 'shown' : 'hidden'}`, kind: 'Admin' });
  revalidatePath('/acquire'); revalidatePath('/professionals'); done();
}

export async function setCallback(id: string, status: string) {
  await guard();
  await q(`UPDATE callbacks SET status = $2 WHERE id = $1`, [id, status === 'done' ? 'done' : 'new']);
  done();
}

export async function listProfessional(appId: string) {
  await guard();
  const a = await one(`DELETE FROM professional_applications WHERE id = $1 RETURNING *`, [appId]);
  if (!a) return;
  await q(`INSERT INTO professionals (name, firm, pro_type, city, contact, status) VALUES ($1,$2,$3,$4,$5,'listed')`, [a.name, a.firm, a.pro_type || 'CA', a.city, a.contact]);
  await audit({ actorLabel: 'admin', action: `Listed professional ${a.name}`, kind: 'Admin' });
  revalidatePath('/professionals'); done();
}

export async function rejectApplication(appId: string) {
  await guard();
  await q(`DELETE FROM professional_applications WHERE id = $1`, [appId]);
  done();
}
