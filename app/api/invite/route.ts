import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({}));
  const res = NextResponse.json({ ok: true });
  if (typeof token === 'string' && /^[\w-]{8,40}$/.test(token)) res.cookies.set('lh_invite', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30 });
  return res;
}
