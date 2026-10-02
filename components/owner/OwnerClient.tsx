'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleTask, setLevel, inviteAdvisor, revokeAdvisor, uploadDocument, deleteDocument, saveListing, withdrawListing, decideRequest, updateBusiness } from '@/app/actions/owner';
import { LEVELS, DOC_CATEGORIES } from '@/lib/constants';

export type TaskRow = { id: string; title: string; category: string; priority: string; effort: string; impact: number; why: string; criteria: string; assignee: string; due: string; done: boolean };

const PRI: Record<string, string> = { High: 'p-warn', Medium: 'p-gold', Low: 'p-grey' };

export function TaskList({ tasks, categories, showFilter = true, readonly }: { tasks: TaskRow[]; categories?: string[]; showFilter?: boolean; readonly?: boolean }) {
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [, start] = useTransition();
  const router = useRouter();
  const cats = ['All', ...(categories || Array.from(new Set(tasks.map((t) => t.category))))];
  const list = tasks.filter((t) => cat === 'All' || t.category === cat);
  const isDone = (t: TaskRow) => optimistic[t.id] ?? t.done;
  const nDone = tasks.filter(isDone).length;
  return (
    <div className="col gap14">
      {showFilter && (
        <div className="row between" style={{ gap: 16 }}>
          <div className="row gap6">{cats.map((c) => <button key={c} onClick={() => setCat(c)} className="btn-sm" style={{ border: '1px solid var(--ink)', padding: '8px 14px', fontSize: 13, background: cat === c ? 'var(--ink)' : 'var(--card)', color: cat === c ? 'var(--paper)' : 'var(--t2)' }}>{c}</button>)}</div>
          <span className="t2" style={{ fontSize: 13.5 }}>{nDone} of {tasks.length} complete · sorted by impact</span>
        </div>
      )}
      <div style={{ background: 'var(--card)', border: '1px solid var(--ink)' }}>
        {list.length === 0 && <div className="muted" style={{ padding: 18 }}>No tasks here yet.</div>}
        {list.map((t) => {
          const d = isDone(t);
          return (
            <div key={t.id} style={{ borderBottom: '1px solid var(--tint)' }}>
              <div className="grid" style={{ gridTemplateColumns: '28px minmax(0,1fr) auto', gap: 14, alignItems: 'center', padding: '16px 18px' }}>
                <button aria-label={d ? 'Mark as not done' : 'Mark as done'} disabled={readonly} onClick={() => { setOptimistic({ ...optimistic, [t.id]: !d }); start(async () => { await toggleTask(t.id); router.refresh(); }); }} style={{ width: 24, height: 24, border: '1.5px solid var(--green)', background: d ? 'var(--green)' : 'transparent', color: 'var(--paper)', fontSize: 13, padding: 0 }}>{d ? '✓' : ''}</button>
                <button onClick={() => setOpen(open === t.id ? null : t.id)} className="col gap4" style={{ background: 'none', border: 0, textAlign: 'left', padding: 0, minWidth: 0 }}>
                  <span style={{ fontSize: 15, color: d ? 'var(--dis)' : 'var(--ink)', textDecoration: d ? 'line-through' : 'none' }}>{t.title}</span>
                  <span className="xs muted">{t.category} · {t.effort} · Due {t.due}</span>
                </button>
                <div className="row gap8" style={{ flexWrap: 'nowrap' }}><span className={'pill ' + PRI[t.priority]}>{t.priority}</span><span className="xs" style={{ color: 'var(--green)', minWidth: 52, textAlign: 'right' }}>+{t.impact} pts</span></div>
              </div>
              {open === t.id && (
                <div className="grid" style={{ padding: '0 18px 18px 60px', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, fontSize: 13.5 }}>
                  {[['Why it matters', t.why], ['Done when', t.criteria], ['Assigned to', t.assignee]].map(([k, v]) => <div key={k} className="col gap4"><span style={{ color: 'var(--gold)', fontWeight: 500 }}>{k}</span><span className="t2">{v}</span></div>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MarkComplete({ id }: { id: string }) {
  const [p, start] = useTransition();
  const router = useRouter();
  return <button className="btn btn-paper" style={{ alignSelf: 'flex-start' }} disabled={p} onClick={() => start(async () => { await toggleTask(id); router.refresh(); })}>{p ? 'Saving…' : 'Mark complete'}</button>;
}

export function InviteAdvisor() {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [p, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <button className="btn btn-ghost" style={{ background: 'var(--card)' }} onClick={() => setOpen(!open)}>+ Invite advisor</button>
      {open && (
        <div className="row" style={{ flexBasis: '100%', background: 'var(--card)', border: '1px solid var(--green)', padding: 20, gap: 12 }}>
          <span style={{ fontSize: 14.5, flex: 1, minWidth: 220 }}>Invite your CA, lawyer or advisor. They&rsquo;ll see only your scores, tasks and documents (view) until you grant more.</span>
          <input value={v} onChange={(e) => setV(e.target.value)} placeholder="advisor@firm.in or mobile" className="input" style={{ width: 'auto', minWidth: 220, background: 'var(--paper)' }} />
          <button className="btn btn-green" disabled={p} onClick={() => start(async () => { const r = await inviteAdvisor(v); setMsg(r.ok ? { ok: true, t: 'Invitation recorded ✓ ' + (r.note || '') } : { ok: false, t: r.error || 'Could not invite.' }); if (r.ok) { setV(''); router.refresh(); } })}>{p ? 'Sending…' : 'Send invite'}</button>
          {msg && <span className={msg.ok ? 'small' : 'err'} style={{ flexBasis: '100%', color: msg.ok ? 'var(--green)' : undefined }}>{msg.t}</span>}
        </div>
      )}
    </>
  );
}

export function RevokeAdvisor({ id }: { id: string }) {
  const [p, start] = useTransition();
  const router = useRouter();
  return <button className="linkbtn xs" style={{ color: 'var(--warn)' }} disabled={p} onClick={() => { if (confirm('Revoke this advisor’s access?')) start(async () => { await revokeAdvisor(id); router.refresh(); }); }}>Revoke</button>;
}

export function LevelPicker({ level }: { level: number }) {
  const [p, start] = useTransition();
  const router = useRouter();
  return (
    <div className="col gap8">
      {LEVELS.map((l, i) => (
        <button key={l[0]} disabled={p} onClick={() => {
          if (i === level) return;
          if (i > level && !confirm(`Move to Level ${i} (${l[0]})? ${l[1]}. You can step back down at any time.`)) return;
          start(async () => { await setLevel(i); router.refresh(); });
        }} className="grid" style={{ textAlign: 'left', gridTemplateColumns: '44px 1fr', gap: 14, alignItems: 'center', padding: '16px 18px', border: '1.5px solid ' + (level === i ? 'var(--green)' : 'var(--ink)'), background: level === i ? 'var(--green-t2)' : 'var(--card)' }}>
          <span className="serif" style={{ fontSize: 22, color: '#A8844C' }}>L{i}</span>
          <span className="col gap4"><span style={{ fontWeight: 600, fontSize: 15 }}>{l[0]}{level === i ? ' · current' : ''}</span><span className="small muted">{l[1]}</span></span>
        </button>
      ))}
    </div>
  );
}

export function DocUpload({ category }: { category?: string }) {
  const [err, setErr] = useState('');
  const [p, start] = useTransition();
  const router = useRouter();
  return (
    <form className="col gap8" action={(fd) => start(async () => { setErr(''); const r = await uploadDocument(fd); if (!r.ok) setErr(r.error || 'Upload failed.'); else router.refresh(); })}>
      {category ? <input type="hidden" name="category" value={category} /> : (
        <select name="category" className="select" defaultValue="Financial">{DOC_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      )}
      <select name="level" className="select" defaultValue="3" aria-label="Confidentiality level"><option value="2">L2 · verified buyers</option><option value="3">L3 · after NDA</option><option value="4">L4 · due diligence only</option></select>
      <label style={{ border: '1.5px dashed #B8B2A5', padding: 12, textAlign: 'center', cursor: 'pointer', color: 'var(--t2)', fontSize: 13.5 }}>
        {p ? 'Uploading…' : 'Choose file · PDF, XLSX, DOCX, JPG · up to 4 MB'}
        <input type="file" name="file" hidden onChange={(e) => e.currentTarget.form?.requestSubmit()} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.zip" />
      </label>
      {err && <span className="err">{err}</span>}
    </form>
  );
}

export function DeleteDoc({ id }: { id: string }) {
  const [p, start] = useTransition();
  const router = useRouter();
  return <button className="linkbtn xs" style={{ color: 'var(--warn)' }} disabled={p} onClick={() => { if (confirm('Delete this document? This cannot be undone.')) start(async () => { await deleteDocument(id); router.refresh(); }); }}>Delete</button>;
}

export function ListingForm({ listing, defaults }: { listing: any; defaults: { industry: string; years: string; location: string } }) {
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [p, start] = useTransition();
  const router = useRouter();
  const submit = (fd: FormData, s: boolean) => start(async () => { setErr(''); setOk(''); const r = await saveListing(fd, s); if (!r.ok) setErr(r.error || ''); else { setOk(s ? 'Submitted for review ✓ Our team checks every profile before it is visible.' : 'Saved ✓'); router.refresh(); } });
  return (
    <form className="card col gap14" action={(fd) => submit(fd, false)}>
      <div className="row between"><span style={{ fontWeight: 600 }}>Anonymous business profile</span>{listing && <span className="pill p-gold">{listing.status}</span>}</div>
      <span className="small muted">Never include your company name, exact address or customer names. Revenue band and transferability are filled from your assessment.</span>
      <label className="label">Anonymised title<input name="title" className="input" defaultValue={listing?.title || ''} placeholder="e.g. Profitable Industrial Distributor" /></label>
      <label className="label">Short description<textarea name="description" className="textarea" defaultValue={listing?.description || ''} placeholder="What the business does, customer mix, team strength. No names." /></label>
      <div className="grid g-auto-160" style={{ gap: 12 }}>
        <label className="label">Industry<input name="industry" className="input" defaultValue={listing?.industry || defaults.industry} /></label>
        <label className="label">State / region<input name="location" className="input" defaultValue={listing?.location || defaults.location} placeholder="e.g. Rajasthan" /></label>
        <label className="label">Operating<input name="years" className="input" defaultValue={listing?.years || defaults.years} placeholder="e.g. 18 yrs" /></label>
      </div>
      <label className="label">What you&rsquo;re open to<input name="deal_note" className="input" defaultValue={listing?.deal_note || ''} placeholder="e.g. Gradual handover, owner stays 2 yrs" /></label>
      <label className="row small" style={{ gap: 8 }}><input type="checkbox" name="open_international" defaultChecked={!!listing?.open_international} /> Open to international and NRI acquirers</label>
      <div className="row gap8">
        <button className="btn btn-ghost" disabled={p}>Save draft</button>
        <button type="button" className="btn btn-green" disabled={p} onClick={(e) => submit(new FormData(e.currentTarget.form!), true)}>Submit for review</button>
        {listing?.status === 'published' && <button type="button" className="btn btn-danger" disabled={p} onClick={() => start(async () => { await withdrawListing(); router.refresh(); })}>Withdraw from marketplace</button>}
      </div>
      {err && <span className="err">{err}</span>}
      {ok && <span className="small" style={{ color: 'var(--green)' }}>{ok}</span>}
    </form>
  );
}

export function RequestDecision({ id }: { id: string }) {
  const [p, start] = useTransition();
  const router = useRouter();
  return (
    <div className="row gap6">
      <button className="btn btn-green btn-sm" disabled={p} onClick={() => start(async () => { const r = await decideRequest(id, true); if (r.dealId) router.push('/deals/' + r.dealId); else router.refresh(); })}>Approve &amp; open workspace</button>
      <button className="btn btn-ghost btn-sm" disabled={p} onClick={() => start(async () => { await decideRequest(id, false); router.refresh(); })}>Decline</button>
    </div>
  );
}

export function BusinessForm({ b }: { b: any }) {
  const [ok, setOk] = useState(false);
  const [p, start] = useTransition();
  return (
    <form className="card grid g-auto-220" style={{ gap: 16 }} action={(fd) => start(async () => { await updateBusiness(fd); setOk(true); })}>
      {[['name', 'Business name (private)', b.name], ['legal_name', 'Legal name', b.legal_name], ['city', 'City', b.city], ['state', 'State', b.state], ['gstin', 'GSTIN', b.gstin]].map(([k, l, v]) => (
        <label key={k} className="label">{l}<input name={k} defaultValue={v || ''} className="input" style={{ background: 'var(--paper)' }} /></label>
      ))}
      <div className="row gap12" style={{ gridColumn: '1/-1' }}><button className="btn" disabled={p}>{p ? 'Saving…' : 'Save details'}</button>{ok && <span className="small" style={{ color: 'var(--green)' }}>Saved ✓ Visible only to you and advisors you invite.</span>}</div>
    </form>
  );
}
