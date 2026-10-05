import 'server-only';
import { alertOperator } from './notify';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { q, one, audit, track } from './db';

// ₹2,999 is the full price. Bindal Infotech is not GST-registered, so no GST is charged or shown.
export const REPORT_PRICE_PAISE = 299900;

export function razorpayEnabled() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** Free "test mode" unlocks only outside production, or when explicitly switched on. A missing key in production never gives the report away. */
export function testPaymentsAllowed() {
  return !razorpayEnabled() && (process.env.PAYMENTS_TEST_MODE === '1' || process.env.VERCEL_ENV !== 'production' && process.env.NODE_ENV !== 'production');
}

export type PaymentMode = 'razorpay' | 'test' | 'unavailable';
export function paymentMode(): PaymentMode {
  return razorpayEnabled() ? 'razorpay' : testPaymentsAllowed() ? 'test' : 'unavailable';
}

const NO_GST = 0;

async function nextInvoiceNo() {
  const r = await one(`SELECT nextval('invoice_seq')::int AS n`);
  return 'LH-INV-' + String(r!.n).padStart(5, '0');
}

export async function createReportOrder(userId: string, businessId: string, method: string) {
  const invoice = await nextInvoiceNo();
  const mode = paymentMode();
  if (mode === 'unavailable') throw new Error('Payments are not configured');
  if (mode === 'test') {
    const p = await one(`INSERT INTO payments (user_id, business_id, invoice_no, item, amount_paise, gst_paise, method, provider, status) VALUES ($1,$2,$3,'Detailed Report',$4,$5,$6,'test','paid') RETURNING *`,
      [userId, businessId, invoice, REPORT_PRICE_PAISE, NO_GST, method]);
    await audit({ actorId: userId, businessId, action: 'Detailed report unlocked (test mode, no charge)', kind: 'Billing' });
    await track('report_paid', userId, { provider: 'test' });
    return { mode: 'test' as const, paymentId: p!.id };
  }
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const r = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST', headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: REPORT_PRICE_PAISE, currency: 'INR', receipt: invoice, notes: { businessId } })
  });
  if (!r.ok) throw new Error('Could not create payment order');
  const order = await r.json();
  await q(`INSERT INTO payments (user_id, business_id, invoice_no, item, amount_paise, gst_paise, method, provider, provider_order_id, status) VALUES ($1,$2,$3,'Detailed Report',$4,$5,$6,'razorpay',$7,'created')`,
    [userId, businessId, invoice, REPORT_PRICE_PAISE, NO_GST, method, order.id]);
  return { mode: 'razorpay' as const, orderId: order.id as string, keyId: process.env.RAZORPAY_KEY_ID!, amount: REPORT_PRICE_PAISE };
}

async function markPaid(orderId: string, paymentId: string, userId?: string) {
  const p = await one(`UPDATE payments SET status = 'paid', provider_payment_id = $2 WHERE provider_order_id = $1 AND status <> 'paid' ${userId ? 'AND user_id = $3' : ''} RETURNING *`, userId ? [orderId, paymentId, userId] : [orderId, paymentId]);
  if (!p) return !!(await one(`SELECT 1 FROM payments WHERE provider_order_id = $1 AND status = 'paid'`, [orderId]));
  await audit({ actorId: p.user_id, businessId: p.business_id, action: 'Detailed report purchased', kind: 'Billing', detail: { invoice: p.invoice_no } });
  await track('report_paid', p.user_id, { provider: 'razorpay' });
  await alertOperator('Payment received: Detailed Report', [`Receipt: ${p.invoice_no}`, `Amount: ₹${(p.amount_paise / 100).toFixed(2)}`, `Razorpay payment: ${paymentId}`]);
  return true;
}

/** Razorpay webhook (payment.captured / order.paid): reconciles payments when the browser closed before the checkout handler ran. */
export async function handleRazorpayWebhook(raw: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return { ok: false, status: 503 };
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(signature || '');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, status: 401 };
  const ev = JSON.parse(raw);
  const pay = ev?.payload?.payment?.entity;
  if ((ev.event === 'payment.captured' || ev.event === 'order.paid') && pay?.order_id && pay?.id) await markPaid(pay.order_id, pay.id);
  if (ev.event === 'payment.failed' && pay?.order_id) await q(`UPDATE payments SET status = 'failed' WHERE provider_order_id = $1 AND status = 'created'`, [pay.order_id]);
  if (ev.event === 'refund.processed' && pay?.order_id) await q(`UPDATE payments SET status = 'refunded' WHERE provider_order_id = $1`, [pay.order_id]);
  return { ok: true, status: 200 };
}

export async function verifyRazorpay(userId: string, orderId: string, paymentId: string, signature: string) {
  const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(orderId + '|' + paymentId).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(signature || '');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return markPaid(orderId, paymentId, userId);
}
