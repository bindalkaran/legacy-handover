import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const HOME = { owner: '/dashboard', buyer: '/acquirer', advisor: '/advisor' } as const;

/** Lets static public pages show the signed-in state without becoming dynamic. */
export async function GET() {
  const u = await currentUser();
  const body = u ? { signedIn: true, home: HOME[u.role] || '/dashboard', label: { owner: 'My dashboard', buyer: 'Acquirer dashboard', advisor: 'Advisor portal' }[u.role] || 'My dashboard' } : { signedIn: false };
  return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store' } });
}
