'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { requestCallback } from '@/app/actions/public';

export default function CallbackForm() {
  const [state, action, pending] = useActionState(requestCallback, null as any);
  return (
    <form action={action} className="col gap12">
      <div className="row" style={{ gap: 10 }}>
        <input name="name" required placeholder="Your name" className="input" style={{ flex: 1, minWidth: 160, width: 'auto' }} />
        <input name="phone" required placeholder="Mobile number" inputMode="tel" className="input" style={{ flex: 1, minWidth: 160, width: 'auto' }} />
        <button className="btn" disabled={pending || state?.ok}>{state?.ok ? 'Request received ✓' : pending ? 'Sending…' : 'Request a call'}</button>
      </div>
      {state?.error && <span className="err">{state.error}</span>}
      <span className="small muted">{state?.ok ? 'Thank you. We will call or WhatsApp you on this number to fix a time.' : <>We use your number only to arrange this call and never share it. See our <Link href="/privacy" className="link-u">privacy policy</Link>.</>}</span>
    </form>
  );
}
