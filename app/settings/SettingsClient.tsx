'use client';
import { useState, useTransition } from 'react';
import { saveProfile, deleteAccount, sendDeleteCode } from '@/app/actions/settings';
import { sendFirebaseCode, firebaseError } from '@/lib/firebase-client';

export function ProfileForm({ u }: { u: any }) {
  const [ok, setOk] = useState(false);
  const [p, start] = useTransition();
  return (
    <form className="card col gap16" style={{ padding: 24 }} action={(fd) => start(async () => { await saveProfile(fd); setOk(true); })}>
      <div className="grid g-auto-220" style={{ gap: 16 }}>
        <label className="label">Full name<input name="name" defaultValue={u.name || ''} className="input" style={{ background: 'var(--paper)' }} /></label>
        <label className="label">Mobile<input value={u.phone || '—'} readOnly className="input" style={{ background: 'var(--tint)' }} /></label>
        <label className="label">Email<input value={u.email || '—'} readOnly className="input" style={{ background: 'var(--tint)' }} /></label>
      </div>
      <label className="row small" style={{ gap: 8 }}><input type="checkbox" name="matching" defaultChecked={u.matching_consent} /> Use my profile to suggest matches (never shared without approval)</label>
      <label className="row small" style={{ gap: 8 }}><input type="checkbox" name="marketing" defaultChecked={u.marketing_consent} /> Send me guides and product news (monthly at most)</label>
      <span className="xs muted">Access requests, deal activity and advisor changes appear in your dashboard. The service is currently available in English.</span>
      <div className="row gap12"><button className="btn" disabled={p}>Save changes</button>{ok && <span className="small" style={{ color: 'var(--green)' }}>Saved ✓</span>}</div>
    </form>
  );
}

export function DeleteAccount() {
  const [open, setOpen] = useState(false); const [v, setV] = useState(''); const [err, setErr] = useState('');
  const [sent, setSent] = useState<null | { to: string; preview?: string; confirm?: (code: string) => Promise<string> }>(null);
  const [p, start] = useTransition();
  const send = () => start(async () => {
    setErr('');
    const r = await sendDeleteCode();
    if (!r.ok) return setErr(r.error);
    if ('firebase' in r && r.firebase) {
      try { setSent({ to: r.to, confirm: await sendFirebaseCode(r.to, 'delete-account') }); } catch (e) { setErr(firebaseError(e)); }
      return;
    }
    setSent({ to: r.to, preview: 'previewCode' in r ? r.previewCode : undefined });
  });
  const confirmDelete = () => start(async () => {
    setErr('');
    let token: string | undefined;
    if (sent?.confirm) { try { token = await sent.confirm(v); } catch (e) { return setErr(firebaseError(e)); } }
    const r = await deleteAccount(v, token);
    if (r.ok) window.location.href = '/'; else setErr(r.error || '');
  });
  return (
    <div className="col gap12" style={{ border: '1px solid var(--warn)', padding: '18px 20px' }}>
      <div className="row between"><div className="col gap4"><span style={{ fontSize: 15, color: 'var(--warn)' }}>Delete account and all data</span><span className="small muted">Removes assessments, scores, tasks, documents and passport. Records of active deals are retained as required.</span></div>
        <button id="delete-account" className="btn btn-danger btn-sm" onClick={() => { setOpen(!open); if (!open && !sent) send(); }}>Delete account</button></div>
      {open && sent && (
        <div className="col gap8">
          <span className="small t2">We sent a one-time code to {sent.to}. Enter it to confirm. This can&rsquo;t be undone.</span>
          {sent.preview && <div className="notice">Preview delivery: your code is <b className="tab">{sent.preview}</b>.</div>}
          <div className="row gap8"><input value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" inputMode="numeric" className="input tab" style={{ width: 'auto', flex: 1 }} /><button className="btn btn-danger" disabled={p || v.length !== 6} onClick={confirmDelete}>Permanently delete</button></div>
        </div>
      )}
      {err && <span className="err">{err}</span>}
    </div>
  );
}
