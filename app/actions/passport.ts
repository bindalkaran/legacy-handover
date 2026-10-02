'use server';
import { revalidatePath } from 'next/cache';
import { currentUser, token } from '@/lib/auth';
import { q, one, audit } from '@/lib/db';
import { SECTIONS } from '@/lib/passport';

export async function createShare(sections: string[], hours: number) {
  const u = await currentUser();
  if (!u) return { ok: false as const };
  const b = await one(`SELECT id FROM businesses WHERE owner_id = $1 ORDER BY created_at LIMIT 1`, [u.id]);
  if (!b) return { ok: false as const };
  const secs = sections.filter((s) => SECTIONS.includes(s));
  if (!secs.length) return { ok: false as const, error: 'Choose at least one section.' };
  const h = [24, 168, 720].includes(hours) ? hours : 168;
  const t = token(16);
  await q(`INSERT INTO passport_shares (business_id, token, sections, expires_at) VALUES ($1,$2,$3::jsonb, now() + ($4 || ' hours')::interval)`, [b.id, t, JSON.stringify(secs), String(h)]);
  await audit({ actorId: u.id, businessId: b.id, action: `Created a read-only Passport link (${secs.join(', ')}) expiring in ${h < 48 ? '24 hours' : h < 200 ? '7 days' : '30 days'}`, kind: 'Permission' });
  revalidatePath('/passport');
  return { ok: true as const, path: '/passport/s/' + t };
}

export async function revokeShare(id: string) {
  const u = await currentUser();
  if (!u) return { ok: false };
  const r = await one(`UPDATE passport_shares ps SET revoked_at = now() FROM businesses b WHERE ps.id = $1 AND b.id = ps.business_id AND b.owner_id = $2 RETURNING ps.business_id`, [id, u.id]);
  if (r) await audit({ actorId: u.id, businessId: r.business_id, action: 'Revoked a Passport link', kind: 'Permission' });
  revalidatePath('/passport');
  return { ok: true };
}
