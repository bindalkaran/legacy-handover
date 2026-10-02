'use client';
import { useState, useTransition } from 'react';
import { sendCode, verifyCode } from '@/app/actions/auth';

type Role = 'owner' | 'buyer' | 'advisor';

export default function OtpForm({ role, next, submitLabel = 'Verify & continue', onDone }: { role: Role; next?: string; submitLabel?: string; onDone?: (redirect: string) => void }) {
  const [step, setStep] = useState<0 | 1>(0);
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [ident, setIdent] = useState('');
  const [normalised, setNormalised] = useState('');
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<string | undefined>();
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();

  const send = () => start(async () => {
    setErr('');
    const r = await sendCode(mode === 'phone' ? '+91' + ident : ident);
    if (!r.ok) return setErr(r.error);
    setNormalised(r.identifier); setPreview(r.previewCode); setStep(1);
  });
  const verify = () => start(async () => {
    setErr('');
    if (!/^\d{6}$/.test(code)) return setErr('Enter the 6-digit code.');
    const r = await verifyCode(normalised, code, role, next);
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
      <button className="btn btn-lg" onClick={send} disabled={pending}>{pending ? 'Sending…' : 'Send one-time code'}</button>
      <div className="row" style={{ gap: 12, color: 'var(--dis)', fontSize: 12, flexWrap: 'nowrap' }}><span style={{ flex: 1, height: 1, background: 'var(--rule-l)' }} />or<span style={{ flex: 1, height: 1, background: 'var(--rule-l)' }} /></div>
      <button className="btn btn-ghost" onClick={() => { setMode(mode === 'phone' ? 'email' : 'phone'); setIdent(''); setErr(''); }}>{mode === 'phone' ? 'Continue with email' : 'Use mobile number instead'}</button>
      {err && <span className="err">{err}</span>}
    </div>
  );
  return (
    <div className="col gap14">
      <span className="t2" style={{ fontSize: 14 }}>Code sent to {normalised} · <button className="linkbtn" onClick={() => { setStep(0); setCode(''); }}>change</button></span>
      {preview && <div className="notice">Preview delivery: SMS/email sending isn&rsquo;t configured yet, so your code is <b className="tab">{preview}</b>. Configure an OTP provider before launch.</div>}
      <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={(e) => e.key === 'Enter' && verify()} placeholder="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="input tab" style={{ fontSize: 28, letterSpacing: '.4em', textAlign: 'center', padding: 16 }} />
      <button className="btn btn-lg" onClick={verify} disabled={pending}>{pending ? 'Verifying…' : submitLabel}</button>
      <span className="small muted">Didn&rsquo;t get it? <button className="linkbtn" onClick={send} disabled={pending}>Send again</button></span>
      {err && <span className="err">{err}</span>}
    </div>
  );
}
