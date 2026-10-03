'use server';
import { redirect } from 'next/navigation';
import { issueOtp, verifyOtp, signInVerified, destroySession, currentUser, type Role } from '@/lib/auth';
import { verifyFirebasePhone } from '@/lib/firebase';
import { claimDraft } from '@/lib/owner';

export async function sendCode(identifier: string) {
  return await issueOtp(identifier);
}

const HOME: Record<Role, string> = { owner: '/dashboard', buyer: '/acquirer', advisor: '/advisor' };

export async function verifyCode(identifier: string, code: string, role: Role, next?: string, explicit = true) {
  if (!['owner', 'buyer', 'advisor'].includes(role)) role = 'owner';
  const r = await verifyOtp(identifier, code, role, explicit);
  if (!r.ok) return r;
  return landing(r.user, next);
}

/** Phone sign-in through Firebase: the ID token proves the number. */
export async function verifyFirebase(idToken: string, role: Role, next?: string, explicit = true) {
  if (!['owner', 'buyer', 'advisor'].includes(role)) role = 'owner';
  const phone = await verifyFirebasePhone(idToken);
  if (!phone) return { ok: false as const, error: 'We could not verify that code. Please request a new one.' };
  return landing(await signInVerified(phone, role, explicit), next);
}

async function landing(user: { id: string; role: Role }, next?: string) {
  const active = user.role;
  if (active === 'owner') await claimDraft(user.id);
  const safeNext = next && /^\/(?![\/\\])/.test(next) && !next.includes('\\') ? next : HOME[active];
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
