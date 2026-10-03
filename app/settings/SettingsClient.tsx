'use client';
import { useState, useTransition } from 'react';
import { saveNotif, saveRegion, saveProfile, deleteAccount, sendDeleteCode } from '@/app/actions/settings';
import { sendFirebaseCode, firebaseError } from '@/lib/firebase-client';

const NT: [string, string, number[], boolean][] = [['Task reminders', 'Weekly digest of readiness tasks', [1, 1, 0], false], ['New acquirer interest', 'When a qualified acquirer requests access', [1, 1, 1], false], ['Advisor activity', 'Notes, uploads and task updates from advisors', [1, 1, 0], false], ['Deal & NDA updates', 'Offers, signatures, data-room access', [1, 1, 1], true], ['Security alerts', 'New sign-ins, permission changes', [1, 1, 1], true], ['Opportunity alerts', 'Matching businesses (acquirers)', [1, 0, 0], false], ['Guides & product news', 'Monthly, never more', [0, 0, 0], false]];

export function NotifMatrix({ prefs }: { prefs: Record<string, boolean> }) {
  const [n, setN] = useState(prefs);
  const [, start] = useTransition();
  return (
    <>
      <div className="table">
        <div className="trow head" style={{ gridTemplateColumns: 'minmax(200px,1fr) repeat(3,80px)', minWidth: 460 }}><span>Notification</span><span style={{ textAlign: 'center' }}>In-app</span><span style={{ textAlign: 'center' }}>Email</span><span style={{ textAlign: 'center' }}>WhatsApp</span></div>
        {NT.map((x, i) => (
          <div key={x[0]} className="trow" style={{ gridTemplateColumns: 'minmax(200px,1fr) repeat(3,80px)', minWidth: 460 }}>
            <div className="col gap4"><span style={{ fontSize: 14.5 }}>{x[0]}</span><span className="xs muted">{x[1]}</span></div>
            {x[2].map((def, j) => {
              const k = i + '-' + j, on = x[3] ? true : n[k] ?? !!def;
              return <button key={j} aria-label={`${x[0]} ${['in-app', 'email', 'WhatsApp'][j]}`} aria-pressed={on} disabled={x[3]} onClick={() => { const nn = { ...n, [k]: !on }; setN(nn); start(async () => { await saveNotif(nn); }); }} style={{ justifySelf: 'center', width: 40, height: 22, borderRadius: 11, border: '1px solid var(--ink)', background: on ? 'var(--green)' : 'var(--tint)', position: 'relative', padding: 0, opacity: x[3] ? 0.6 : 1, cursor: x[3] ? 'not-allowed' : 'pointer' }}><span style={{ position: 'absolute', top: 2, left: on ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: on ? 'var(--paper)' : 'var(--ink)' }} /></button>;
            })}
          </div>
        ))}
      </div>
      <span className="xs muted">Critical deal and security notifications stay on. Email and WhatsApp delivery activate once a messaging provider is connected; your preferences are saved now.</span>
    </>
  );
}

const LANGS: [string, string][] = [['en', 'English'], ['hi', 'हिन्दी'], ['gu', 'ગુજરાતી'], ['mr', 'मराठी'], ['ta', 'தமிழ்'], ['te', 'తెలుగు']];
const C: [string, string, string, string, string, string][] = [['IN', 'India', '₹ INR', '12,34,567.00 (lakh/crore)', 'DD/MM/YYYY', 'Indian Companies Act, GST and stamp-duty workflows'], ['AE', 'UAE', 'AED', '1,234,567.00', 'DD/MM/YYYY', 'Cross-border workflow for NRI acquirers; FEMA guidance applies'], ['GB', 'United Kingdom', '£ GBP', '1,234,567.00', 'DD/MM/YYYY', 'International acquirers: Indian targets via the FDI route'], ['US', 'United States', '$ USD', '1,234,567.00', 'MM/DD/YYYY', 'International acquirers: Indian targets via the FDI route'], ['SG', 'Singapore', 'S$ SGD', '1,234,567.00', 'DD/MM/YYYY', 'International acquirers: Indian targets via the FDI route']];

export function Region({ language, country }: { language: string; country: string }) {
  const [l, setL] = useState(language); const [c, setC] = useState(country);
  const [, start] = useTransition();
  const cc = C.find((x) => x[0] === c) || C[0];
  const pick = (nl: string, nc: string) => { setL(nl); setC(nc); start(async () => { await saveRegion(nl, nc); }); };
  return (
    <div className="card col gap20" style={{ padding: 24 }}>
      <div className="col gap10"><span style={{ fontWeight: 600 }}>Language</span><div className="row gap6">{LANGS.map(([k, t]) => <button key={k} className={'chip ink' + (l === k ? ' on' : '')} onClick={() => pick(k, c)}>{t}</button>)}</div>{l !== 'en' && <span className="xs muted">Saved. Regional-language screens are being translated; you&rsquo;ll see them here as each one is reviewed.</span>}</div>
      <div className="col gap10"><span style={{ fontWeight: 600 }}>Country & regulatory workflow</span><div className="row gap6">{C.map((x) => <button key={x[0]} className={'chip ink' + (c === x[0] ? ' on' : '')} onClick={() => pick(l, x[0])}>{x[1]}</button>)}</div><span className="small muted">{cc[5]}</span></div>
      <div className="grid g-auto-160 rule-tl" style={{ gap: 12, paddingTop: 16, fontSize: 14 }}>{[['Currency', cc[2]], ['Number format', cc[3]], ['Date format', cc[4]]].map(([k, v]) => <div key={k} className="col gap4"><span className="xs muted">{k}</span><span>{v}</span></div>)}</div>
    </div>
  );
}

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
