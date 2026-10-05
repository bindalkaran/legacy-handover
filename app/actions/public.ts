'use server';
import { q, track } from '@/lib/db';
import { alertOperator } from '@/lib/notify';

export async function requestCallback(_: unknown, fd: FormData) {
  const name = String(fd.get('name') || '').trim().slice(0, 120);
  const phone = String(fd.get('phone') || '').replace(/[^\d+ ]/g, '').trim().slice(0, 20);
  if (!name || phone.replace(/\D/g, '').length < 10) return { ok: false, error: 'Please add your name and a 10-digit mobile number.' };
  await q(`INSERT INTO callbacks (name, phone) VALUES ($1, $2)`, [name, phone]);
  await track('callback_requested');
  await alertOperator('New callback request', [`Name: ${name}`, `Phone: ${phone}`]);
  return { ok: true };
}

export async function applyProfessional(_: unknown, fd: FormData) {
  const v = (k: string) => String(fd.get(k) || '').trim().slice(0, 200);
  if (!v('name') || !v('contact')) return { ok: false, error: 'Name and a contact (mobile or email) are required.' };
  await q(`INSERT INTO professional_applications (name, firm, pro_type, city, contact) VALUES ($1,$2,$3,$4,$5)`, [v('name'), v('firm'), v('pro_type'), v('city'), v('contact')]);
  await track('professional_applied');
  await alertOperator('New professional application', [`Name: ${v('name')}`, `Firm: ${v('firm')}`, `Type: ${v('pro_type')}`, `City: ${v('city')}`, `Contact: ${v('contact')}`]);
  return { ok: true };
}
