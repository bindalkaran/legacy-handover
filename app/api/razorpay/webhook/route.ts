import { handleRazorpayWebhook } from '@/lib/payments';

export async function POST(req: Request) {
  const raw = await req.text();
  const r = await handleRazorpayWebhook(raw, req.headers.get('x-razorpay-signature') || '');
  return new Response(r.ok ? 'ok' : 'rejected', { status: r.status });
}
