'use server';
import { currentUser } from '@/lib/auth';
import { one } from '@/lib/db';
import { createReportOrder, verifyRazorpay } from '@/lib/payments';
import { REPORT_FREE } from '@/lib/company';

export async function startReportPayment(method: string) {
  const user = await currentUser();
  if (!user) return { ok: false as const, error: 'Please sign in first.' };
  const biz = await one(`SELECT id FROM businesses WHERE owner_id = $1 ORDER BY created_at LIMIT 1`, [user.id]);
  if (!biz) return { ok: false as const, error: 'Complete the assessment first.' };
  if (REPORT_FREE) return { ok: true as const, mode: 'already' as const };
  const already = await one(`SELECT 1 FROM payments WHERE business_id = $1 AND item = 'Detailed Report' AND status = 'paid'`, [biz.id]);
  if (already) return { ok: true as const, mode: 'already' as const };
  try {
    const r = await createReportOrder(user.id, biz.id, ['UPI', 'Card', 'Net banking'].includes(method) ? method : 'UPI');
    return { ok: true as const, ...r, name: user.name || '', contact: user.phone || '', email: user.email || '' };
  } catch (e) {
    if (e instanceof Error && e.message === 'Payments are not configured') return { ok: false as const, error: 'Online payment is opening shortly. Request a call from the home page and we will unlock your report for you.' };
    return { ok: false as const, error: 'Payment could not be started. Nothing was charged. Please try again.' };
  }
}

export async function confirmReportPayment(orderId: string, paymentId: string, signature: string) {
  const user = await currentUser();
  if (!user) return { ok: false };
  return { ok: await verifyRazorpay(user.id, orderId, paymentId, signature) };
}
