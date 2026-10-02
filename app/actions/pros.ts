'use server';
import { currentUser, token } from '@/lib/auth';
import { q, one, audit } from '@/lib/db';

export async function invitePro(proId: string) {
  const u = await currentUser();
  if (!u) return { ok: false, error: 'Sign in first.' };
  const p = await one(`SELECT * FROM professionals WHERE id = $1 AND status = 'listed'`, [proId]);
  if (!p) return { ok: false, error: 'Not available.' };
  const b = await one(`SELECT id FROM businesses WHERE owner_id = $1 ORDER BY created_at LIMIT 1`, [u.id]);
  if (!b) return { ok: false, error: 'Complete your assessment first.' };
  if (p.is_sample || !p.contact) {
    await audit({ actorId: u.id, businessId: b.id, action: `Requested an introduction to ${p.pro_type} ${p.name} (our team will connect you)`, kind: 'Referral' });
    return { ok: true };
  }
  await q(`INSERT INTO advisor_links (business_id, invited_contact, direction, status, token) VALUES ($1,$2,'owner_invited','pending',$3)`, [b.id, String(p.contact).toLowerCase(), token()]);
  await audit({ actorId: u.id, businessId: b.id, action: `Invited ${p.pro_type} ${p.name} (scores, tasks, documents view)`, kind: 'Permission' });
  return { ok: true };
}
