'use server';
import { revalidatePath } from 'next/cache';
import { currentUser } from '@/lib/auth';
import { q, one, audit, track } from '@/lib/db';

const pick = (v: unknown, allowed: string[]) => (typeof v === 'string' && allowed.includes(v) ? v : null);
export async function saveBuyerProfile(f: Record<string, any>) {
  const u = await currentUser();
  if (!u) return { ok: false as const, needAuth: true };
  const industries = Array.isArray(f.industries) ? f.industries.filter((x: unknown) => typeof x === 'string').slice(0, 6) : [];
  await q(`INSERT INTO buyer_profiles (user_id, buyer_type, experience, capital, financing, industries, involvement, timeline, international)
    VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9)
    ON CONFLICT (user_id) DO UPDATE SET buyer_type = EXCLUDED.buyer_type, experience = EXCLUDED.experience, capital = EXCLUDED.capital, financing = EXCLUDED.financing, industries = EXCLUDED.industries, involvement = EXCLUDED.involvement, timeline = EXCLUDED.timeline, international = EXCLUDED.international, updated_at = now()`,
    [u.id, pick(f.type, ['Individual entrepreneur', 'Business owner', 'Professional manager', 'Management team', 'Strategic company', 'Family office / investor']), pick(f.exp, ['Under 5 yrs', '5–15 yrs', '15+ yrs']), pick(f.cap, ['Under ₹1 Cr', '₹1–3 Cr', '₹3–10 Cr', '₹10 Cr+']), pick(f.fin, ['No', 'Partly', 'Yes']), JSON.stringify(industries), pick(f.inv, ['Full-time operator', 'Board / oversight', 'Either']), pick(f.when, ['Within 6 months', '6–12 months', '12–24 months']), !!f.international]);
  await q(`UPDATE users SET role = 'buyer', roles = CASE WHEN 'buyer' = ANY(roles) THEN roles ELSE array_append(roles, 'buyer') END WHERE id = $1`, [u.id]);
  if (typeof f.name === 'string' && f.name.trim()) await q(`UPDATE users SET name = $2 WHERE id = $1 AND name IS NULL`, [u.id, f.name.trim().slice(0, 80)]);
  await track('buyer_registered', u.id);
  revalidatePath('/acquirer');
  return { ok: true as const };
}

export async function requestAccess(listingId: string, message?: string) {
  const u = await currentUser();
  if (!u) return { ok: false as const, needAuth: true };
  const prof = await one(`SELECT 1 FROM buyer_profiles WHERE user_id = $1`, [u.id]);
  if (!prof) return { ok: false as const, needProfile: true };
  const l = await one(`SELECT l.*, b.owner_id FROM listings l LEFT JOIN businesses b ON b.id = l.business_id WHERE l.id = $1 AND l.status = 'published'`, [listingId]);
  if (!l) return { ok: false as const, error: 'This opportunity is no longer available.' };
  if (l.is_sample) return { ok: false as const, error: 'This is a sample listing used to illustrate the marketplace. Requests open on live profiles.' };
  if (l.owner_id === u.id) return { ok: false as const, error: 'This is your own business.' };
  await q(`INSERT INTO access_requests (listing_id, buyer_id, message) VALUES ($1,$2,$3) ON CONFLICT (listing_id, buyer_id) DO NOTHING`, [listingId, u.id, (message || '').slice(0, 500) || null]);
  await audit({ actorId: u.id, businessId: l.business_id, action: 'A qualified acquirer requested access', kind: 'Request' });
  await track('access_requested', u.id);
  revalidatePath('/acquirer');
  return { ok: true as const, title: l.title as string };
}

export async function saveSearch(label: string, filters: Record<string, unknown>) {
  const u = await currentUser();
  if (!u) return { ok: false, needAuth: true };
  if (!(await one(`SELECT 1 FROM buyer_profiles WHERE user_id = $1`, [u.id]))) return { ok: false, needProfile: true };
  if (await one(`SELECT 1 FROM saved_searches WHERE user_id = $1 AND label = $2`, [u.id, label.slice(0, 120)])) return { ok: true };
  await q(`INSERT INTO saved_searches (user_id, label, filters) VALUES ($1,$2,$3::jsonb)`, [u.id, label.slice(0, 120), JSON.stringify(filters)]);
  revalidatePath('/acquirer');
  return { ok: true };
}

export async function setSearchFrequency(id: string, freq: string) {
  const u = await currentUser();
  if (!u || !['Instant', 'Weekly', 'Off'].includes(freq)) return { ok: false };
  await q(`UPDATE saved_searches SET frequency = $3 WHERE id = $1 AND user_id = $2`, [id, u.id, freq]);
  revalidatePath('/acquirer');
  return { ok: true };
}

export async function deleteSearch(id: string) {
  const u = await currentUser();
  if (!u) return { ok: false };
  await q(`DELETE FROM saved_searches WHERE id = $1 AND user_id = $2`, [id, u.id]);
  revalidatePath('/acquirer');
  return { ok: true };
}
