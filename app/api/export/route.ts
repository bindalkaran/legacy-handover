import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { q, audit } from '@/lib/db';

export async function GET() {
  const user = await currentUser();
  if (!user) return new NextResponse('Sign in required', { status: 401 });
  const businesses = await q(`SELECT * FROM businesses WHERE owner_id = $1`, [user.id]);
  const ids = businesses.map((b) => b.id);
  const data = {
    exported_at: new Date().toISOString(),
    user,
    businesses,
    assessments: await q(`SELECT id, answers, status, assessment_version, created_at, completed_at FROM assessments WHERE user_id = $1`, [user.id]),
    scores: ids.length ? await q(`SELECT * FROM scores WHERE business_id = ANY($1::uuid[])`, [ids]) : [],
    tasks: ids.length ? await q(`SELECT * FROM tasks WHERE business_id = ANY($1::uuid[])`, [ids]) : [],
    documents: ids.length ? await q(`SELECT id, category, name, ext, size, version, level, permission, created_at FROM documents WHERE business_id = ANY($1::uuid[])`, [ids]) : [],
    access_log: ids.length ? await q(`SELECT action, kind, created_at FROM audit_logs WHERE business_id = ANY($1::uuid[]) ORDER BY created_at`, [ids]) : [],
    buyer_profile: await q(`SELECT * FROM buyer_profiles WHERE user_id = $1`, [user.id]),
    access_requests: await q(`SELECT * FROM access_requests WHERE buyer_id = $1`, [user.id]),
    payments: await q(`SELECT invoice_no, item, amount_paise, gst_paise, status, created_at FROM payments WHERE user_id = $1`, [user.id])
  };
  await audit({ actorId: user.id, businessId: ids[0] ?? null, action: 'Data export downloaded', kind: 'Security' });
  return new NextResponse(JSON.stringify(data, null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="legacy-handover-export.json"', 'Cache-Control': 'no-store' } });
}
