'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { startReportPayment, confirmReportPayment } from '@/app/actions/billing';

declare global { interface Window { Razorpay?: any } }

function loadRzp(): Promise<boolean> {
  return new Promise((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => res(true); s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

export default function UnlockBlock({ testMode }: { testMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState('UPI');
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();

  const pay = () => start(async () => {
    setErr('');
    const r = await startReportPayment(method);
    if (!r.ok) return setErr(r.error);
    if (r.mode === 'test' || r.mode === 'already') { window.location.reload(); return; }
    if (!(await loadRzp())) return setErr('Payment window could not load. Check your connection and try again.');
    const rzp = new window.Razorpay({
      key: r.keyId, amount: r.amount, currency: 'INR', order_id: r.orderId, name: 'Legacy Handover', description: 'Detailed Succession Report',
      prefill: { name: r.name, contact: r.contact, email: r.email }, theme: { color: '#1F3B33' },
      handler: async (resp: any) => {
        const v = await confirmReportPayment(resp.razorpay_order_id, resp.razorpay_payment_id, resp.razorpay_signature);
        if (v.ok) window.location.reload(); else setErr('We could not verify the payment. If money was debited, it will be reconciled or refunded automatically.');
      }
    });
    rzp.on('payment.failed', () => setErr('Payment failed. Nothing was charged.'));
    rzp.open();
  });

  return (
    <section className="grid g-auto-380 noprint" style={{ border: '1px solid var(--ink)', background: 'var(--card)', gap: 0 }}>
      <div className="col gap16" style={{ padding: 36 }}>
        <span className="eyebrow">Your free results end here</span>
        <h2 className="serif" style={{ fontWeight: 300, fontSize: 34, letterSpacing: '-.025em', lineHeight: 1.08, margin: 0 }}>Unlock the detailed report</h2>
        <p className="t2" style={{ margin: 0, fontSize: 15.5 }}>Everything above is yours to keep. The detailed report adds what owners use to actually decide:</p>
        <div className="col gap10" style={{ fontSize: 15 }}>
          {['All ten succession paths, with fit and the reasons', 'Indicative enterprise value and the four factors moving it', 'A 24–36 month timeline for your situation', 'Your prioritised readiness plan, shareable with your CA'].map((t) => <span key={t} className="row" style={{ gap: 10, flexWrap: 'nowrap' }}><span style={{ color: 'var(--gold)' }}>—</span>{t}</span>)}
        </div>
      </div>
      <div className="col gap16" style={{ padding: 36, background: 'var(--paper)', borderLeft: '1px solid var(--ink)', justifyContent: 'center' }}>
        <div className="row" style={{ alignItems: 'baseline', gap: 12 }}><span className="big" style={{ fontSize: 48 }}>₹2,999</span><span className="muted" style={{ fontSize: 13.5 }}>one-time, incl. GST</span></div>
        <span className="t2" style={{ fontSize: 14 }}>Full refund within 7 days if it isn&rsquo;t useful. No subscription.</span>
        {!open ? <button className="btn btn-green btn-lg" onClick={() => setOpen(true)}>Unlock detailed report →</button> : (
          <div className="col gap12" style={{ border: '1px solid var(--ink)', background: 'var(--card)', padding: 18 }}>
            <span className="small muted">{testMode ? 'Test mode: payments are not configured yet, so no charge will be made.' : 'Pay securely via Razorpay'}</span>
            <div className="row gap6">{['UPI', 'Card', 'Net banking'].map((m) => <button key={m} className={'chip ink' + (method === m ? ' on' : '')} style={{ minHeight: 38, padding: '8px 14px', fontSize: 13.5 }} onClick={() => setMethod(m)}>{m}</button>)}</div>
            <button className="btn btn-lg" onClick={pay} disabled={pending}>{pending ? 'Opening…' : testMode ? 'Unlock (test mode, no charge)' : 'Pay ₹2,999'}</button>
            {err && <span className="err">{err}</span>}
          </div>
        )}
        <Link href="/dashboard" className="link-u t2" style={{ fontSize: 14, alignSelf: 'flex-start' }}>Continue on the free plan, basic tasks only →</Link>
      </div>
    </section>
  );
}
