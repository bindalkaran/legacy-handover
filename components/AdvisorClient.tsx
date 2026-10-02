'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { inviteClient, sendNote, assignToMe, updateAdvisorProfile } from '@/app/actions/advisor';

export function InviteClient() {
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(''); const [c, setC] = useState('');
  const [link, setLink] = useState(''); const [err, setErr] = useState('');
  const [p, start] = useTransition();
  const router = useRouter();
  return (
    <div className="col gap12">
      <button className="btn" onClick={() => setOpen(!open)}>+ Invite a client</button>
      {open && (
        <div className="card col gap14">
          <span className="serif" style={{ fontSize: 20 }}>Invite a client to assess their succession readiness</span>
          <span className="t2" style={{ fontSize: 14 }}>They get a private link. Neutral wording: nothing about selling, family or retirement is assumed.</span>
          <p className="t2" style={{ margin: 0, fontSize: 14, background: 'var(--paper)', padding: 14 }}>&ldquo;Namaste. As part of our planning work together, I&rsquo;d like you to complete a short, private assessment of how your business would run without you. It takes about 7 minutes and nothing is shared beyond us.&rdquo;</p>
          <div className="row gap10">
            <input value={n} onChange={(e) => setN(e.target.value)} placeholder="Client name" className="input" style={{ flex: 1, minWidth: 160, width: 'auto' }} />
            <input value={c} onChange={(e) => setC(e.target.value)} placeholder="Mobile or email" className="input" style={{ flex: 1, minWidth: 160, width: 'auto' }} />
            <button className="btn" disabled={p} onClick={() => start(async () => { const r = await inviteClient(n, c); if (!r.ok) setErr(r.error); else { setErr(''); setLink(window.location.origin + r.link); router.refresh(); } })}>Create invite link</button>
          </div>
          {err && <span className="err">{err}</span>}
          {link && <div className="col gap6"><span className="small" style={{ color: 'var(--green)' }}>Invite created ✓ Send this private link with the message above (WhatsApp or email):</span><div className="row gap8"><input readOnly value={link} className="input" style={{ flex: 1, width: 'auto', fontSize: 13 }} onFocus={(e) => e.currentTarget.select()} /><button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard?.writeText(link)}>Copy</button></div></div>}
        </div>
      )}
    </div>
  );
}

export function NoteBox({ businessId }: { businessId: string }) {
  const [v, setV] = useState(''); const [sent, setSent] = useState(false);
  const [p, start] = useTransition();
  return (
    <div className="col gap10">
      <textarea value={v} onChange={(e) => { setV(e.target.value); setSent(false); }} placeholder="e.g. Please share FY23–FY25 audited statements before our review." className="textarea" style={{ background: 'var(--paper)' }} />
      <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} disabled={p || !v.trim()} onClick={() => start(async () => { const r = await sendNote(businessId, v); if (r.ok) { setSent(true); setV(''); } })}>{sent ? 'Sent ✓' : 'Send note'}</button>
    </div>
  );
}

export function TakeTask({ id }: { id: string }) {
  const [p, start] = useTransition();
  const router = useRouter();
  return <button className="linkbtn xs" disabled={p} onClick={() => start(async () => { await assignToMe(id); router.refresh(); })}>Take this on</button>;
}

export function AdvisorProfile({ name, firm, city }: { name: string; firm: string; city: string }) {
  const [p, start] = useTransition();
  const [ok, setOk] = useState(false);
  const router = useRouter();
  return (
    <form className="card grid g-auto-220" style={{ gap: 12 }} action={(fd) => start(async () => { await updateAdvisorProfile(String(fd.get('name')), String(fd.get('firm')), String(fd.get('city'))); setOk(true); router.refresh(); })}>
      <label className="label">Your name<input name="name" defaultValue={name} className="input" /></label>
      <label className="label">Firm<input name="firm" defaultValue={firm} className="input" /></label>
      <label className="label">City<input name="city" defaultValue={city} className="input" /></label>
      <div className="row gap10" style={{ gridColumn: '1/-1' }}><button className="btn btn-sm" disabled={p}>Save</button>{ok && <span className="small" style={{ color: 'var(--green)' }}>Saved ✓</span>}</div>
    </form>
  );
}
