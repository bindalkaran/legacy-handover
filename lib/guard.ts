import 'server-only';
import { redirect } from 'next/navigation';
import { currentUser, type User } from './auth';
import { one } from './db';

export async function requireUser(next: string): Promise<User> {
  const u = await currentUser();
  if (!u) redirect('/sign-in?next=' + encodeURIComponent(next));
  return u;
}

export async function requireOwnerBusiness(userId: string) {
  return await one(`SELECT * FROM businesses WHERE owner_id = $1 ORDER BY created_at LIMIT 1`, [userId]);
}

export function fmtDate(d: string | Date | null | undefined, withTime = false) {
  if (!d) return '—';
  const x = new Date(d);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' };
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' });
  return x.toLocaleString('en-IN', opts);
}

export function ago(d: string | Date) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' h ago';
  const days = Math.floor(s / 86400);
  return days === 1 ? 'yesterday' : days + ' days ago';
}

export { LEVELS, DOC_CATEGORIES } from './constants';
