import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomInt, timingSafeEqual, randomBytes } from 'node:crypto';
import { q, one, dbUrl, audit, track } from './db';

export type Role = 'owner' | 'buyer' | 'advisor';
export type User = { id: string; phone: string | null; email: string | null; name: string | null; role: Role; firm: string | null; city: string | null; language: string; country: string; notif_prefs: any; marketing_consent: boolean; matching_consent: boolean; created_at: string };

const SESSION_COOKIE = 'lh_session';
const ADMIN_COOKIE = 'lh_admin';

function secretKey(): Uint8Array {
  const s = process.env.SESSION_SECRET || createHash('sha256').update('lh-session:' + dbUrl()).digest('hex');
  return new TextEncoder().encode(s);
}

export function hash(v: string) {
  return createHash('sha256').update(v + ':' + new TextDecoder().decode(secretKey())).digest('hex');
}

export function token(bytes = 18) {
  return randomBytes(bytes).toString('base64url');
}

const secure = process.env.NODE_ENV === 'production';

export async function createSession(userId: string) {
  const jwt = await new SignJWT({ sub: userId }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(secretKey());
  (await cookies()).set(SESSION_COOKIE, jwt, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 60 * 60 * 24 * 30 });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const c = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!c) return null;
  try {
    const { payload } = await jwtVerify(c, secretKey());
    if (!payload.sub) return null;
    return await one<User>(`SELECT id, phone, email, name, role, firm, city, language, country, notif_prefs, marketing_consent, matching_consent, created_at FROM users WHERE id = $1 AND deleted_at IS NULL`, [payload.sub]);
  } catch {
    return null;
  }
}

// ---------- OTP ----------

export function normaliseIdentifier(raw: string): { id: string; kind: 'phone' | 'email' } | null {
  const v = raw.trim().toLowerCase();
  if (v.includes('@')) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? { id: v, kind: 'email' } : null;
  }
  const digits = v.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? { id: '+91' + digits, kind: 'phone' } : null;
}

export function otpDeliveryMode(kind: 'phone' | 'email'): 'sms' | 'email' | 'preview' {
  if (kind === 'email' && process.env.RESEND_API_KEY && process.env.OTP_FROM_EMAIL) return 'email';
  if (kind === 'phone' && process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) return 'sms';
  return 'preview';
}

export async function issueOtp(raw: string): Promise<{ ok: true; identifier: string; mode: string; previewCode?: string } | { ok: false; error: string }> {
  const n = normaliseIdentifier(raw);
  if (!n) return { ok: false, error: 'Enter a valid 10-digit Indian mobile number or an email address.' };
  const recent = await one(`SELECT count(*)::int AS c FROM otp_codes WHERE identifier = $1 AND created_at > now() - interval '1 hour'`, [n.id]);
  if ((recent?.c ?? 0) >= 6) return { ok: false, error: 'Too many codes requested. Please wait an hour and try again.' };
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await q(`INSERT INTO otp_codes (identifier, code_hash, expires_at) VALUES ($1, $2, now() + interval '10 minutes')`, [n.id, hash(code)]);
  const mode = otpDeliveryMode(n.kind);
  try {
    if (mode === 'email') {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.OTP_FROM_EMAIL, to: n.id, subject: 'Your Legacy Handover sign-in code', text: `Your one-time code is ${code}. It expires in 10 minutes. If you did not request it, ignore this email.` })
      });
      if (!r.ok) throw new Error('email ' + r.status);
    } else if (mode === 'sms') {
      const r = await fetch('https://control.msg91.com/api/v5/otp?' + new URLSearchParams({ template_id: process.env.MSG91_TEMPLATE_ID!, mobile: n.id.replace('+', ''), otp: code }), {
        method: 'POST', headers: { authkey: process.env.MSG91_AUTH_KEY!, 'Content-Type': 'application/json' }, body: '{}'
      });
      if (!r.ok) throw new Error('sms ' + r.status);
    }
  } catch (e) {
    return { ok: false, error: 'We could not send the code just now. Please try again in a minute.' };
  }
  return { ok: true, identifier: n.id, mode, previewCode: mode === 'preview' ? code : undefined };
}

export async function verifyOtp(identifier: string, code: string, role: Role, extra?: { name?: string }): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const row = await one(`SELECT id, code_hash, attempts, expires_at FROM otp_codes WHERE identifier = $1 AND used_at IS NULL ORDER BY created_at DESC LIMIT 1`, [identifier]);
  if (!row) return { ok: false, error: 'Request a new code to continue.' };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, error: 'That code has expired. Request a new one.' };
  if (row.attempts >= 5) return { ok: false, error: 'Too many attempts. Request a new code.' };
  const a = Buffer.from(row.code_hash), b = Buffer.from(hash(code.trim()));
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await q(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [row.id]);
    return { ok: false, error: 'That code doesn’t match. Check and try again.' };
  }
  await q(`UPDATE otp_codes SET used_at = now() WHERE id = $1`, [row.id]);
  const col = identifier.includes('@') ? 'email' : 'phone';
  let user = await one<User>(`SELECT * FROM users WHERE ${col} = $1`, [identifier]);
  if (!user) {
    user = await one<User>(`INSERT INTO users (${col}, role, name) VALUES ($1, $2, $3) RETURNING *`, [identifier, role, extra?.name ?? null]);
    await track('account_created', user!.id, { role });
  } else {
    user = await one<User>(`UPDATE users SET role = $2, deleted_at = NULL, updated_at = now() WHERE id = $1 RETURNING *`, [user.id, role]);
  }
  await createSession(user!.id);
  await attachPendingInvites(user!);
  await audit({ actorId: user!.id, action: 'Signed in', kind: 'Security', detail: { via: col } });
  return { ok: true, user: user! };
}

async function attachPendingInvites(user: User) {
  const ids = [user.phone, user.email].filter(Boolean);
  if (!ids.length) return;
  // Owner invited this person as their advisor
  await q(`UPDATE advisor_links SET advisor_user_id = $1, status = 'active' WHERE advisor_user_id IS NULL AND direction = 'owner_invited' AND status = 'pending' AND lower(invited_contact) = ANY($2::text[])`, [user.id, ids.map((x) => String(x).toLowerCase())]);
}

// ---------- Admin ----------

export function adminEnabled() {
  return !!process.env.ADMIN_PASSWORD;
}

export async function adminLogin(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(hash(password)), b = Buffer.from(hash(expected));
  if (!timingSafeEqual(a, b)) return false;
  const jwt = await new SignJWT({ adm: true }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('12h').sign(secretKey());
  (await cookies()).set(ADMIN_COOKIE, jwt, { httpOnly: true, sameSite: 'strict', secure, path: '/', maxAge: 60 * 60 * 12 });
  await audit({ actorLabel: 'admin', action: 'Admin signed in', kind: 'Admin' });
  return true;
}

export async function isAdmin() {
  if (!adminEnabled()) return false;
  const c = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!c) return false;
  try { const { payload } = await jwtVerify(c, secretKey()); return payload.adm === true; } catch { return false; }
}

export async function adminLogout() {
  (await cookies()).delete(ADMIN_COOKIE);
}
