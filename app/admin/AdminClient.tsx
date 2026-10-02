'use client';
import { useActionState, useState, useTransition } from 'react';
import { login, advanceOwner, setVerification, decideListing, setBuyerStage, addContact, moveContact, suppressContact, decideDraft, saveWeights, toggleSamples, setCallback, listProfessional, rejectApplication } from '@/app/actions/admin';

export function LoginForm({ enabled }: { enabled: boolean }) {
  const [state, action, p] = useActionState(login, null as any);
  if (!enabled) return <div className="notice notice-warn">The admin console is disabled until an <b>ADMIN_PASSWORD</b> environment variable is set on the deployment.</div>;
  return (
    <form action={action} className="col gap12" style={{ maxWidth: 360 }}>
      <input type="password" name="password" required placeholder="Admin passphrase" className="input" autoComplete="current-password" />
      <button className="btn" disabled={p}>Sign in</button>
      {state?.error && <span className="err">{state.error}</span>}
    </form>
  );
}

function Btn({ onClick, children, cls = 'btn btn-green btn-sm', confirmMsg }: { onClick: () => Promise<any>; children: React.ReactNode; cls?: string; confirmMsg?: string }) {
  const [p, start] = useTransition();
  return <button className={cls} disabled={p} onClick={() => { if (confirmMsg && !confirm(confirmMsg)) return; start(async () => { await onClick(); }); }}>{children}</button>;
}

export const AdvanceOwner = ({ id, label }: { id: string; label: string }) => <Btn onClick={() => advanceOwner(id)}>{label}</Btn>;
export const ListingDecision = ({ id }: { id: string }) => <div className="row gap6"><Btn onClick={() => decideListing(id, true)}>Approve &amp; publish</Btn><Btn cls="btn btn-ghost btn-sm" onClick={() => decideListing(id, false)}>Return</Btn></div>;
export const BuyerStage = ({ id, stage }: { id: string; stage: number }) => (
  <select className="select" style={{ width: 'auto', padding: '6px 8px', fontSize: 13 }} defaultValue={stage} onChange={(e) => setBuyerStage(id, Number(e.target.value))}>
    {['', 'Profile complete', 'Identity verified', 'Financially verified', 'Qualified'].map((t, i) => i > 0 && <option key={i} value={i}>{t}</option>)}
  </select>
);
export const Verification = ({ id, v }: { id: string; v: string }) => (
  <select className="select" style={{ width: 'auto', padding: '6px 8px', fontSize: 13 }} defaultValue={v} onChange={(e) => setVerification(id, e.target.value)}>
    {['Self-reported', 'Partially verified', 'Business verified', 'Financially verified', 'Transaction ready'].map((t) => <option key={t}>{t}</option>)}
  </select>
);
export const MoveContact = ({ id }: { id: string }) => <span className="row gap6"><Btn cls="linkbtn xs" onClick={() => moveContact(id, -1)}>←</Btn><Btn cls="linkbtn xs" onClick={() => moveContact(id, 1)}>→</Btn><Btn cls="linkbtn xs" confirmMsg="Add to suppression list? No further outreach." onClick={() => suppressContact(id)}>Suppress</Btn></span>;

export function ContactForm() {
  const [p, start] = useTransition();
  return (
    <form className="row gap8" action={(fd) => start(async () => { await addContact(fd); })}>
      <input name="name" required placeholder="Name" className="input" style={{ width: 'auto', flex: 1, minWidth: 140 }} />
      <input name="company" placeholder="Company" className="input" style={{ width: 'auto', flex: 1, minWidth: 140 }} />
      <input name="city" placeholder="City" className="input" style={{ width: 'auto', flex: 1, minWidth: 100 }} />
      <input name="source" placeholder="Source (CA referral, association…)" className="input" style={{ width: 'auto', flex: 1, minWidth: 160 }} />
      <button className="btn" disabled={p}>Add prospect</button>
    </form>
  );
}

export function DraftCard({ d }: { d: any }) {
  const [body, setBody] = useState(d.body);
  const [edit, setEdit] = useState(false);
  return (
    <div className="card col gap12" style={{ maxWidth: 720 }}>
      <div className="row between"><span style={{ fontWeight: 600 }}>Outreach draft · {d.name}{d.company ? ', ' + d.company : ''}</span><span className="xs" style={{ color: 'var(--gold)' }}>Template {d.template_version} · neutral language · {d.status}</span></div>
      {edit ? <textarea value={body} onChange={(e) => setBody(e.target.value)} className="textarea" /> : <p className="t2" style={{ margin: 0, fontSize: 14.5, background: 'var(--paper)', padding: 14 }}>{body}</p>}
      {d.status === 'awaiting approval' && <div className="row gap8"><Btn onClick={() => decideDraft(d.id, true, body)}>Approve &amp; queue</Btn><button className="btn btn-ghost btn-sm" onClick={() => setEdit(!edit)}>{edit ? 'Done editing' : 'Edit'}</button><Btn cls="btn btn-ghost btn-sm" onClick={() => decideDraft(d.id, false)}>Reject</Btn><span className="xs muted">Opt-out line and suppression check included. Sending stays manual until a channel is connected.</span></div>}
    </div>
  );
}

export function Weights({ initial, version }: { initial: Record<string, number>; version: string }) {
  const [w, setW] = useState(initial);
  const [msg, setMsg] = useState('');
  const [p, start] = useTransition();
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  return (
    <div className="card col gap14" style={{ maxWidth: 640 }}>
      <div className="row between"><span style={{ fontWeight: 600 }}>Transferability weights · {version}</span><span className="small" style={{ color: sum === 100 ? 'var(--green)' : 'var(--warn)' }}>Total {sum}%</span></div>
      {Object.keys(w).map((k) => <div key={k} className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 150px 40px', gap: 14, alignItems: 'center', fontSize: 14 }}><span>{k}</span><input type="range" min={0} max={30} value={w[k]} onChange={(e) => { setW({ ...w, [k]: Number(e.target.value) }); setMsg(''); }} style={{ accentColor: 'var(--green)' }} /><span className="tab" style={{ textAlign: 'right' }}>{w[k]}</span></div>)}
      <div className="row gap10"><button className="btn btn-sm" disabled={p || sum !== 100} onClick={() => start(async () => { const r = await saveWeights(w); setMsg(r?.ok ? `Saved as ${r.version} and activated.` : r?.error || ''); })}>Save as new version</button>{msg && <span className="small">{msg}</span>}</div>
      <span className="xs muted">Saving creates a new score version. Historical scores remain reproducible on their original version.</span>
    </div>
  );
}

export const SamplesToggle = ({ show }: { show: boolean }) => <Btn cls="btn btn-ghost btn-sm" onClick={() => toggleSamples(!show)}>{show ? 'Hide sample listings & professionals' : 'Show sample listings & professionals'}</Btn>;
export const CallbackDone = ({ id, status }: { id: string; status: string }) => <Btn cls="linkbtn xs" onClick={() => setCallback(id, status === 'done' ? 'new' : 'done')}>{status === 'done' ? 'Reopen' : 'Mark done'}</Btn>;
export const AppDecision = ({ id }: { id: string }) => <span className="row gap8"><Btn cls="linkbtn xs" onClick={() => listProfessional(id)}>Verify &amp; list</Btn><Btn cls="linkbtn xs" onClick={() => rejectApplication(id)}>Reject</Btn></span>;
