'use server';
import { revalidatePath } from 'next/cache';
import { currentUser, token } from '@/lib/auth';
import { q, one, audit } from '@/lib/db';

async function adv() {
  const u = await currentUser();
  if (!u) throw new Error('Sign in required');
  return u;
}
async function hasClient(userId: string, businessId: string) {
  return !!(await one(`SELECT 1 FROM advisor_links WHERE advisor_user_id = $1 AND business_id = $2 AND status = 'active'`, [userId, businessId]));
}

export async function inviteClient(name: string, contact: string) {
  const u = await adv();
  const n = name.trim().slice(0, 120), c = contact.trim().toLowerCase().slice(0, 120);
  if (!n || !c) return { ok: false as const, error: 'Add the client’s name and mobile or email.' };
  const t = token(12);
  await q(`INSERT INTO advisor_links (advisor_user_id, invited_contact, client_name, direction, status, token) VALUES ($1,$2,$3,'advisor_invited','pending',$4)`, [u.id, c, n, t]);
  revalidatePath('/advisor');
  return { ok: true as const, link: '/assessment?invite=' + t };
}

export async function sendNote(businessId: string, body: string) {
  const u = await adv();
  if (!(await hasClient(u.id, businessId))) return { ok: false };
  const b = body.trim().slice(0, 2000);
  if (!b) return { ok: false };
  await q(`INSERT INTO notes (business_id, author_id, body) VALUES ($1,$2,$3)`, [businessId, u.id, b]);
  await audit({ actorId: u.id, businessId, action: `Note from ${u.name || 'your advisor'}${u.firm ? ' (' + u.firm + ')' : ''}: ${b.slice(0, 140)}`, kind: 'Advisor' });
  revalidatePath('/advisor'); revalidatePath('/dashboard');
  return { ok: true };
}

export async function assignToMe(taskId: string) {
  const u = await adv();
  const t = await one(`SELECT business_id, title FROM tasks WHERE id = $1`, [taskId]);
  if (!t || !(await hasClient(u.id, t.business_id))) return { ok: false };
  await q(`UPDATE tasks SET assignee_user_id = $2, assignee = $3 WHERE id = $1`, [taskId, u.id, (u.name || 'Advisor') + (u.firm ? ' · ' + u.firm : '')]);
  await audit({ actorId: u.id, businessId: t.business_id, action: `Advisor took on task: ${t.title}`, kind: 'Advisor' });
  revalidatePath('/advisor');
  return { ok: true };
}

export async function updateAdvisorProfile(name: string, firm: string, city: string) {
  const u = await adv();
  await q(`UPDATE users SET name = $2, firm = $3, city = $4, updated_at = now() WHERE id = $1`, [u.id, name.trim().slice(0, 80) || null, firm.trim().slice(0, 120) || null, city.trim().slice(0, 60) || null]);
  revalidatePath('/advisor');
  return { ok: true };
}
