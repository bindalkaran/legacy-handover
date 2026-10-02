'use server';
import { revalidatePath } from 'next/cache';
import { currentUser, destroySession } from '@/lib/auth';
import { q, one, audit } from '@/lib/db';

export async function saveNotif(prefs: Record<string, boolean>) {
  const u = await currentUser();
  if (!u) return { ok: false };
  const clean = Object.fromEntries(Object.entries(prefs).filter(([k, v]) => /^\d-\d$/.test(k) && typeof v === 'boolean'));
  await q(`UPDATE users SET notif_prefs = $2::jsonb, updated_at = now() WHERE id = $1`, [u.id, JSON.stringify(clean)]);
  return { ok: true };
}

export async function saveRegion(language: string, country: string) {
  const u = await currentUser();
  if (!u) return { ok: false };
  const L = ['en', 'hi', 'gu', 'mr', 'ta', 'te'], C = ['IN', 'AE', 'GB', 'US', 'SG'];
  await q(`UPDATE users SET language = $2, country = $3, updated_at = now() WHERE id = $1`, [u.id, L.includes(language) ? language : 'en', C.includes(country) ? country : 'IN']);
  revalidatePath('/settings');
  return { ok: true };
}

export async function saveProfile(fd: FormData) {
  const u = await currentUser();
  if (!u) return { ok: false };
  const name = String(fd.get('name') || '').trim().slice(0, 80) || null;
  const mk = fd.get('marketing') === 'on', mt = fd.get('matching') === 'on';
  await q(`UPDATE users SET name = $2, marketing_consent = $3, matching_consent = $4, updated_at = now() WHERE id = $1`, [u.id, name, mk, mt]);
  if (mk !== u.marketing_consent || mt !== u.matching_consent) await audit({ actorId: u.id, action: `Consent updated: marketing ${mk ? 'on' : 'off'}, matching ${mt ? 'on' : 'off'}`, kind: 'Consent' });
  revalidatePath('/settings');
  return { ok: true };
}

export async function deleteAccount(confirmText: string) {
  const u = await currentUser();
  if (!u) return { ok: false, error: 'Not signed in.' };
  if (confirmText.trim().toUpperCase() !== 'DELETE') return { ok: false, error: 'Type DELETE to confirm.' };
  const active = await one(`SELECT count(*)::int AS c FROM deals d LEFT JOIN businesses b ON b.id = d.business_id WHERE (b.owner_id = $1 OR d.buyer_id = $1) AND d.closed_at IS NULL`, [u.id]);
  if ((active?.c ?? 0) > 0) return { ok: false, error: 'You have an active deal workspace. Deal records must be retained until it is closed or withdrawn; contact us to close it first.' };
  await audit({ actorId: u.id, action: 'Account deleted at owner request', kind: 'Security' });
  await q(`DELETE FROM businesses WHERE owner_id = $1 AND NOT EXISTS (SELECT 1 FROM deals d WHERE d.business_id = businesses.id)`, [u.id]);
  await q(`DELETE FROM assessments WHERE user_id = $1`, [u.id]);
  await q(`DELETE FROM buyer_profiles WHERE user_id = $1`, [u.id]);
  await q(`DELETE FROM saved_searches WHERE user_id = $1`, [u.id]);
  await q(`DELETE FROM advisor_links WHERE advisor_user_id = $1`, [u.id]);
  await q(`UPDATE users SET phone = NULL, email = NULL, name = NULL, firm = NULL, city = NULL, deleted_at = now() WHERE id = $1`, [u.id]);
  await destroySession();
  return { ok: true };
}
