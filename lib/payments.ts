import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { q, one, audit, track } from './db';

export const REPORT_PRICE_PAISE = 299900; // ₹2,999 incl. GST
export const GST_RATE = 0.18;

export function razorpayEnabled() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function gstFromInclusive(paise: number) {
  return Math.round(paise - paise / (1 + GST_RATE));
}

async function nextInvoiceNo() {
  const r = await one(`SELECT count(*)::int AS c FROM payments`);
  return 'LH-INV-' + String((r?.c ?? 0) + 1).padStart(4, '0');
}

export async function createReportOrder(userId: string, businessId: string, method: string) {
  const invoice = await nextInvoiceNo();
  if (!razorpayEnabled()) {
    const p = await one(`INSERT INTO payments (user_id, business_id, invoice_no, item, amount_paise, gst_paise, method, provider, status) VALUES ($1,$2,$3,'Detailed Report',$4,$5,$6,'test','paid') RETURNING *`,
      [userId, businessId, invoice, REPORT_PRICE_PAISE, gstFromInclusive(REPORT_PRICE_PAISE), method]);
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
    [userId, businessId, invoice, REPORT_PRICE_PAISE, gstFromInclusive(REPORT_PRICE_PAISE), method, order.id]);
  return { mode: 'razorpay' as const, orderId: order.id as string, keyId: process.env.RAZORPAY_KEY_ID!, amount: REPORT_PRICE_PAISE };
}

export async function verifyRazorpay(userId: string, orderId: string, paymentId: string, signature: string) {
  const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(orderId + '|' + paymentId).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(signature || '');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const p = await one(`UPDATE payments SET status = 'paid', provider_payment_id = $3 WHERE provider_order_id = $1 AND user_id = $2 RETURNING *`, [orderId, userId, paymentId]);
  if (!p) return false;
  await audit({ actorId: userId, businessId: p.business_id, action: 'Detailed report purchased', kind: 'Billing', detail: { invoice: p.invoice_no } });
  await track('report_paid', userId, { provider: 'razorpay' });
  return true;
}
