'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { sendCode, verifyCode, verifyFirebase } from '@/app/actions/auth';
import { firebaseConfigured, sendFirebaseCode, firebaseError } from '@/lib/firebase-client';

type Role = 'owner' | 'buyer' | 'advisor';

// Email codes need an email provider in production (NEXT_PUBLIC_EMAIL_OTP=1 once Resend is configured).
const EMAIL_OTP = process.env.NEXT_PUBLIC_EMAIL_OTP === '1' || process.env.NODE_ENV !== 'production';

export default function OtpForm({ role, next, submitLabel = 'Verify & continue', onDone, explicit = true }: { role: Role; next?: string; submitLabel?: string; onDone?: (redirect: string) => void; explicit?: boolean }) {
  const [step, setStep] = useState<0 | 1>(0);
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [ident, setIdent] = useState('');
  const [normalised, setNormalised] = useState('');
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<string | undefined>();
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();
  const fbConfirm = useRef<null | ((code: string) => Promise<string>)>(null);
  const [wait, setWait] = useState(0);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);

  const send = () => start(async () => {
    setErr('');
    if (mode === 'phone' && firebaseConfigured) {
      const digits = ident.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
      if (!/^[6-9]\d{9}$/.test(digits)) return setErr('Enter a valid 10-digit Indian mobile number.');
      try { fbConfirm.current = await sendFirebaseCode('+91' + digits, 'otp-send'); }
      catch (e) { return setErr(firebaseError(e)); }
      setNormalised('+91' + digits); setPreview(undefined); setStep(1); setWait(30);
      return;
    }
    fbConfirm.current = null;
    const r = await sendCode(mode === 'phone' ? '+91' + ident : ident);
    if (!r.ok) return setErr(r.error);
    setNormalised(r.identifier); setPreview(r.previewCode); setStep(1); setWait(30);
  });
  const verify = () => start(async () => {
    setErr('');
    if (!/^\d{6}$/.test(code)) return setErr('Enter the 6-digit code.');
    let r;
    if (fbConfirm.current) {
      let token: string;
      try { token = await fbConfirm.current(code); } catch (e) { return setErr(firebaseError(e)); }
      r = await verifyFirebase(token, role, next, explicit);
    } else r = await verifyCode(normalised, code, role, next, explicit);
    if (!r.ok) return setErr(r.error);
    if (onDone) onDone(r.redirect); else window.location.href = r.redirect;
  });

  if (step === 0) return (
    <div className="col gap14">
      {mode === 'phone' ? (
        <label className="col gap6" style={{ fontSize: 13.5, fontWeight: 500 }}>Mobile number
          <div className="row" style={{ border: '1px solid var(--ink)', background: 'var(--card)', gap: 0, flexWrap: 'nowrap' }}>
            <span className="muted" style={{ padding: '14px 12px', borderRight: '1px solid var(--rule-l)' }}>+91</span>
            <input value={ident} onChange={(e) => setIdent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="98765 43210" inputMode="numeric" autoComplete="tel-national" style={{ fontSize: 16, padding: 14, border: 0, background: 'transparent', flex: 1, minWidth: 0 }} />
          </div>
        </label>
      ) : (
        <label className="col gap6" style={{ fontSize: 13.5, fontWeight: 500 }}>Email
          <input value={ident} onChange={(e) => setIdent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="you@company.in" type="email" autoComplete="email" className="input" style={{ fontSize: 16 }} />
        </label>
      )}
      <button id="otp-send" className="btn btn-lg" onClick={send} disabled={pending}>{pending ? 'Sending…' : 'Send one-time code'}</button>
      {EMAIL_OTP && <>
        <div className="row" style={{ gap: 12, color: 'var(--dis)', fontSize: 12, flexWrap: 'nowrap' }}><span style={{ flex: 1, height: 1, background: 'var(--rule-l)' }} />or<span style={{ flex: 1, height: 1, background: 'var(--rule-l)' }} /></div>
        <button className="btn btn-ghost" onClick={() => { setMode(mode === 'phone' ? 'email' : 'phone'); setIdent(''); setErr(''); }}>{mode === 'phone' ? 'Continue with email' : 'Use mobile number instead'}</button>
      </>}
      {err && <span className="err">{err}</span>}
      <span className="xs muted" style={{ lineHeight: 1.55 }}>By continuing you agree to our <a href="/terms" target="_blank" className="link-u">Terms of use</a> and <a href="/privacy" target="_blank" className="link-u">Privacy policy</a>.</span>
    </div>
  );
  return (
    <div className="col gap14">
      <span className="t2" style={{ fontSize: 14 }}>Code sent to {normalised} · <button className="linkbtn" onClick={() => { setStep(0); setCode(''); }}>change</button></span>
      {preview && <div className="notice">Preview delivery: SMS/email sending isn&rsquo;t configured yet, so your code is <b className="tab">{preview}</b>. Configure an OTP provider before launch.</div>}
      <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={(e) => e.key === 'Enter' && verify()} placeholder="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="input tab" style={{ fontSize: 28, letterSpacing: '.4em', textAlign: 'center', padding: 16 }} />
      <button className="btn btn-lg" onClick={verify} disabled={pending}>{pending ? 'Verifying…' : submitLabel}</button>
      <span className="small muted">Didn&rsquo;t get it? {wait > 0 ? <span className="tab">Resend in {wait}s</span> : <button className="linkbtn" onClick={() => { setStep(0); setCode(''); }} disabled={pending}>Send again</button>}</span>
      {err && <span className="err">{err}</span>}
    </div>
  );
}
