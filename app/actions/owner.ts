'use server';
import { revalidatePath } from 'next/cache';
import { currentUser } from '@/lib/auth';
import { q, one, audit, track } from '@/lib/db';
import { token } from '@/lib/auth';
import { LEVELS } from '@/lib/constants';

async function ownerBiz() {
  const u = await currentUser();
  if (!u) throw new Error('Not signed in');
  const b = await one(`SELECT * FROM businesses WHERE owner_id = $1 ORDER BY created_at LIMIT 1`, [u.id]);
  if (!b) throw new Error('No business yet');
  return { u, b };
}

/** Owner or an active advisor with task scope may toggle tasks. */
export async function toggleTask(taskId: string) {
  const u = await currentUser();
  if (!u) return { ok: false };
  const t = await one(`SELECT t.*, b.owner_id FROM tasks t JOIN businesses b ON b.id = t.business_id WHERE t.id = $1`, [taskId]);
  if (!t) return { ok: false };
  const allowed = t.owner_id === u.id || !!(await one(`SELECT 1 FROM advisor_links WHERE business_id = $1 AND advisor_user_id = $2 AND status = 'active' AND scope ? 'tasks'`, [t.business_id, u.id]));
  if (!allowed) return { ok: false };
  const done = t.status !== 'done';
  await q(`UPDATE tasks SET status = $2, completed_at = CASE WHEN $2 = 'done' THEN now() ELSE NULL END WHERE id = $1`, [taskId, done ? 'done' : 'open']);
  await audit({ actorId: u.id, businessId: t.business_id, action: `${done ? 'Completed' : 'Reopened'} task: ${t.title}`, kind: 'Task' });
  if (done) await track('task_completed', u.id);
  revalidatePath('/dashboard'); revalidatePath('/advisor');
  return { ok: true };
}

export async function setLevel(level: number) {
  const { u, b } = await ownerBiz();
  const lv = Math.max(0, Math.min(4, Math.floor(level)));
  await q(`UPDATE businesses SET confidentiality_level = $2, updated_at = now() WHERE id = $1`, [b.id, lv]);
  if (lv === 0) await q(`UPDATE listings SET status = 'withdrawn', updated_at = now() WHERE business_id = $1 AND status IN ('published','pending')`, [b.id]);
  await audit({ actorId: u.id, businessId: b.id, action: `Visibility changed to Level ${lv} · ${LEVELS[lv][0]}`, kind: 'Permission' });
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function inviteAdvisor(contact: string) {
  const { u, b } = await ownerBiz();
  const c = contact.trim().toLowerCase();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
  const digits = c.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  if (!isEmail && !/^[6-9]\d{9}$/.test(digits)) return { ok: false, error: 'Enter an email or a 10-digit mobile number.' };
  const norm = isEmail ? c : '+91' + digits;
  const existingUser = await one(`SELECT id FROM users WHERE ${isEmail ? 'email' : 'phone'} = $1`, [norm]);
  const dup = await one(`SELECT id FROM advisor_links WHERE business_id = $1 AND (lower(invited_contact) = $2 OR advisor_user_id = $3) AND status <> 'revoked'`, [b.id, norm, existingUser?.id ?? null]);
  if (dup) return { ok: true, note: 'Already invited.' };
  await q(`INSERT INTO advisor_links (business_id, advisor_user_id, invited_contact, direction, status, token) VALUES ($1,$2,$3,'owner_invited',$4,$5)`,
    [b.id, existingUser?.id ?? null, norm, existingUser ? 'active' : 'pending', token()]);
  await audit({ actorId: u.id, businessId: b.id, action: `Invited advisor ${norm} (scores, tasks, documents view)`, kind: 'Permission' });
  revalidatePath('/dashboard');
  return { ok: true, note: existingUser ? 'They already have an account and can see your scores and tasks now.' : 'They’ll get access when they sign in as an advisor with this ' + (isEmail ? 'email.' : 'number.') };
}

export async function revokeAdvisor(linkId: string) {
  const { u, b } = await ownerBiz();
  await q(`UPDATE advisor_links SET status = 'revoked' WHERE id = $1 AND business_id = $2`, [linkId, b.id]);
  await audit({ actorId: u.id, businessId: b.id, action: 'Revoked advisor access', kind: 'Permission' });
  revalidatePath('/dashboard');
  return { ok: true };
}

const EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'jpg', 'jpeg', 'png', 'zip'];
const DOC_CATEGORIES = ['Corporate', 'Financial', 'Operations', 'Legal', 'Assets'];

export async function uploadDocument(fd: FormData) {
  const { u, b } = await ownerBiz();
  const file = fd.get('file');
  const category = String(fd.get('category') || '');
  const level = Math.max(2, Math.min(4, Number(fd.get('level') || 3)));
  if (!(file instanceof File) || !file.size) return { ok: false, error: 'Choose a file to upload.' };
  if (!DOC_CATEGORIES.includes(category)) return { ok: false, error: 'Pick a category.' };
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!EXT.includes(ext)) return { ok: false, error: 'Supported: PDF, DOC/DOCX, XLS/XLSX, CSV, JPG, PNG, ZIP.' };
  if (file.size > 4 * 1024 * 1024) return { ok: false, error: 'Files up to 4 MB for now. Split larger documents or compress scans.' };
  const name = file.name.replace(/\.[^.]+$/, '').slice(0, 140);
  const prev = await one(`SELECT max(version) AS v FROM documents WHERE business_id = $1 AND name = $2 AND category = $3`, [b.id, name, category]);
  const data = Buffer.from(await file.arrayBuffer()).toString('base64');
  await q(`INSERT INTO documents (business_id, category, name, ext, mime, size, version, level, data_b64, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [b.id, category, name, ext.toUpperCase(), file.type || 'application/octet-stream', file.size, (prev?.v ?? 0) + 1, level, data, u.id]);
  await audit({ actorId: u.id, businessId: b.id, action: `Uploaded ${category} › ${name} v${(prev?.v ?? 0) + 1}`, kind: 'Upload' });
  await track('document_uploaded', u.id);
  revalidatePath('/dashboard'); revalidatePath('/deals');
  return { ok: true };
}

export async function deleteDocument(id: string) {
  const { u, b } = await ownerBiz();
  const d = await one(`DELETE FROM documents WHERE id = $1 AND business_id = $2 RETURNING name`, [id, b.id]);
  if (d) await audit({ actorId: u.id, businessId: b.id, action: `Deleted document ${d.name}`, kind: 'Upload' });
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function cyclePermission(id: string) {
  const u = await currentUser();
  if (!u) return { ok: false };
  const d = await one(`SELECT d.*, b.owner_id FROM documents d JOIN businesses b ON b.id = d.business_id WHERE d.id = $1`, [id]);
  if (!d || d.owner_id !== u.id) return { ok: false };
  const order = ['View only', 'View + download', 'Hidden'];
  const next = order[(order.indexOf(d.permission) + 1) % 3];
  await q(`UPDATE documents SET permission = $2 WHERE id = $1`, [id, next]);
  await audit({ actorId: u.id, businessId: d.business_id, action: `Permission on ${d.name} set to ${next}`, kind: 'Permission' });
  revalidatePath('/deals', 'layout');
  return { ok: true };
}

export async function updateBusiness(fd: FormData) {
  const { u, b } = await ownerBiz();
  const v = (k: string) => String(fd.get(k) || '').trim().slice(0, 160) || null;
  await q(`UPDATE businesses SET name = $2, legal_name = $3, city = $4, state = $5, gstin = $6, updated_at = now() WHERE id = $1`, [b.id, v('name'), v('legal_name'), v('city'), v('state'), v('gstin')]);
  await audit({ actorId: u.id, businessId: b.id, action: 'Business details updated', kind: 'Profile' });
  revalidatePath('/dashboard'); revalidatePath('/settings'); revalidatePath('/passport');
  return { ok: true };
}

export async function saveListing(fd: FormData, submit: boolean) {
  const { u, b } = await ownerBiz();
  const v = (k: string, n = 300) => String(fd.get(k) || '').trim().slice(0, n);
  const fields = { industry: v('industry', 60) || b.industry || 'Other', title: v('title', 90), description: v('description', 400), location: v('location', 60), years: v('years', 20), deal_note: v('deal_note', 120), intl: fd.get('open_international') === 'on' };
  if (!fields.title || !fields.description) return { ok: false, error: 'Add an anonymised title and a short description.' };
  if (/\b(pvt|ltd|limited|llp)\b/i.test(fields.title) || (b.name && fields.title.toLowerCase().includes(String(b.name).toLowerCase()))) return { ok: false, error: 'Keep the title anonymous: describe the business, don’t name it.' };
  if (submit && b.confidentiality_level < 1) return { ok: false, error: 'Move your visibility to Level 1 (Anonymous) in Privacy & sharing before submitting.' };
  const score = await one(`SELECT transferability FROM scores WHERE business_id = $1 ORDER BY created_at DESC LIMIT 1`, [b.id]);
  const tb = score ? (score.transferability >= 75 ? 'Strong' : score.transferability >= 55 ? 'Developing' : 'Early') : 'Not assessed';
  const status = submit ? 'pending' : 'draft';
  await q(`INSERT INTO listings (business_id, industry, title, description, revenue_band, location, years, transferability_band, deal_note, verification, open_international, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (business_id) DO UPDATE SET industry = EXCLUDED.industry, title = EXCLUDED.title, description = EXCLUDED.description, revenue_band = EXCLUDED.revenue_band, location = EXCLUDED.location, years = EXCLUDED.years, transferability_band = EXCLUDED.transferability_band, deal_note = EXCLUDED.deal_note, open_international = EXCLUDED.open_international,
      status = CASE WHEN listings.status = 'published' AND NOT $13 THEN 'published' ELSE EXCLUDED.status END, updated_at = now()`,
    [b.id, fields.industry, fields.title, fields.description, b.revenue_band, fields.location, fields.years, tb, fields.deal_note, b.verification, fields.intl, status, submit]);
  await audit({ actorId: u.id, businessId: b.id, action: submit ? 'Anonymous profile submitted for review' : 'Anonymous profile saved', kind: 'Profile' });
  if (submit) await track('business_profile_started', u.id);
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function withdrawListing() {
  const { u, b } = await ownerBiz();
  await q(`UPDATE listings SET status = 'withdrawn', updated_at = now() WHERE business_id = $1`, [b.id]);
  await audit({ actorId: u.id, businessId: b.id, action: 'Anonymous profile withdrawn', kind: 'Profile' });
  revalidatePath('/dashboard'); revalidatePath('/acquire');
  return { ok: true };
}

export async function decideRequest(requestId: string, approve: boolean) {
  const { u, b } = await ownerBiz();
  const r = await one(`SELECT ar.*, l.business_id FROM access_requests ar JOIN listings l ON l.id = ar.listing_id WHERE ar.id = $1`, [requestId]);
  if (!r || r.business_id !== b.id || r.status !== 'Owner reviewing') return { ok: false };
  await q(`UPDATE access_requests SET status = $2, decided_at = now() WHERE id = $1`, [requestId, approve ? 'Approved' : 'Declined']);
  let dealId: string | null = null;
  if (approve) {
    const c = await one(`SELECT count(*)::int AS c FROM deals`);
    const ref = `LH-${new Date().getFullYear()}-${String((c?.c ?? 0) + 1).padStart(4, '0')}`;
    const d = await one(`INSERT INTO deals (ref, business_id, listing_id, buyer_id, stage) VALUES ($1,$2,$3,$4,2) RETURNING id`, [ref, b.id, r.listing_id, r.buyer_id]);
    dealId = d!.id;
    if (b.confidentiality_level < 2) await q(`UPDATE businesses SET confidentiality_level = 2 WHERE id = $1`, [b.id]);
    await audit({ actorId: u.id, businessId: b.id, dealId, action: 'Workspace opened after owner approval', kind: 'System' });
    await track('access_approved', u.id); await track('deal_created', u.id);
  }
  await audit({ actorId: u.id, businessId: b.id, action: `${approve ? 'Approved' : 'Declined'} an access request`, kind: 'Permission' });
  revalidatePath('/dashboard');
  return { ok: true, dealId };
}
