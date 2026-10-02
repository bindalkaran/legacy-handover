'use server';
import { redirect } from 'next/navigation';
import { issueOtp, verifyOtp, destroySession, currentUser, type Role } from '@/lib/auth';
import { claimDraft } from '@/lib/owner';

export async function sendCode(identifier: string) {
  return await issueOtp(identifier);
}

const HOME: Record<Role, string> = { owner: '/dashboard', buyer: '/acquirer', advisor: '/advisor' };

export async function verifyCode(identifier: string, code: string, role: Role, next?: string) {
  if (!['owner', 'buyer', 'advisor'].includes(role)) role = 'owner';
  const r = await verifyOtp(identifier, code, role);
  if (!r.ok) return r;
  if (role === 'owner') await claimDraft(r.user.id);
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : HOME[role];
  return { ok: true as const, redirect: safeNext };
}

export async function signOut() {
  await destroySession();
  redirect('/');
}

export async function whoami() {
  const u = await currentUser();
  return u ? { id: u.id, role: u.role, name: u.name } : null;
}
