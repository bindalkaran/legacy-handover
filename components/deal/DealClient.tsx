'use client';
import ConfirmButton from '@/components/ConfirmDialog';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signNda, grantDiligence, setStage, askQuestion, answerQuestion, submitOffer, respondOffer, replyClarification, requestReferral, toggleChecklist, askAssistant, toggleInstalment, addEarnout, setEarnoutProgress, saveFinancing } from '@/app/actions/deal';
import { cyclePermission } from '@/app/actions/owner';
import { DEAL_STAGES, AI_ASSIST_LABEL, RULES_ASSIST_LABEL } from '@/lib/constants';

function useAct() {
  const [p, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<any>, after?: (r: any) => void) => start(async () => { const r = await fn(); after?.(r); router.refresh(); });
  return { p, run };
}

export function SignNda({ dealId, label }: { dealId: string; label: string }) {
  const { p, run } = useAct();
  const [agree, setAgree] = useState(false);
  return (
    <div className="col gap10">
      <label className="row small" style={{ gap: 8, flexWrap: 'nowrap', alignItems: 'flex-start' }}><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 3 }} /> I have read the NDA above and agree to be bound by it. My acceptance, time and account are recorded.</label>
      <button className="btn btn-green btn-lg" style={{ alignSelf: 'flex-start' }} disabled={!agree || p} onClick={() => run(() => signNda(dealId))}>{p ? 'Signing…' : label}</button>
    </div>
  );
}

export function GrantDiligence({ dealId }: { dealId: string }) {
  const { p, run } = useAct();
  return <ConfirmButton className="btn btn-green btn-sm" disabled={p} message="Grant Level 4 (due diligence) access to this acquirer? Every view and download stays logged and revocable." confirmLabel="Grant access" onConfirm={() => run(() => grantDiligence(dealId))}>Grant Level 4 access</ConfirmButton>;
}

export function StagePicker({ dealId, stage }: { dealId: string; stage: number }) {
  const { p, run } = useAct();
  const [err, setErr] = useState('');
  const [v, setV] = useState(stage);
  return (
    <div className="row gap8">
      <select className="select" style={{ width: 'auto', padding: '8px 10px', fontSize: 13.5 }} value={v} disabled={p} onChange={(e) => { const next = Number(e.target.value); setV(next); run(() => setStage(dealId, next), (r) => { setErr(r?.error || ''); if (!r?.ok) setV(stage); }); }}>
        {DEAL_STAGES.map((s, i) => i >= 2 && <option key={s} value={i}>{s}</option>)}
      </select>
      {err && <span className="err">{err}</span>}
    </div>
  );
}

export function PermButton({ id, perm }: { id: string; perm: string }) {
  const { p, run } = useAct();
  return <button className="xs" disabled={p} onClick={() => run(() => cyclePermission(id))} style={{ justifySelf: 'start', padding: '5px 10px', border: '1px solid var(--ink)', background: 'transparent' }}>{perm}</button>;
}

export function AskForm({ dealId }: { dealId: string }) {
  const { p, run } = useAct();
  const [v, setV] = useState('');
  return (
    <div className="row gap8">
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Ask the other party a question…" className="input" style={{ flex: 1, minWidth: 200, width: 'auto' }} />
      <button className="btn" disabled={p || !v.trim()} onClick={() => run(() => askQuestion(dealId, v), () => setV(''))}>Send</button>
    </div>
  );
}

export function AnswerForm({ dealId, qid }: { dealId: string; qid: string }) {
  const { p, run } = useAct();
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  return (
    <div className="col gap6">
      <div className="row gap8"><input value={v} onChange={(e) => setV(e.target.value)} placeholder="Write an answer…" className="input" style={{ flex: 1, minWidth: 180, width: 'auto', padding: '9px 12px', fontSize: 14 }} /><button className="btn btn-sm" disabled={p || !v.trim()} onClick={() => run(() => answerQuestion(dealId, qid, v), (r) => setErr(r?.error || ''))}>Answer</button></div>
      {err && <span className="err">{err}</span>}
    </div>
  );
}

export function Assistant({ dealId, prompts }: { dealId: string; prompts: [string, string][] }) {
  const [sel, setSel] = useState<string | null>(null);
  const [ans, setAns] = useState<{ a: string; cites: string[]; ai: boolean } | null>(null);
  const [p, start] = useTransition();
  return (
    <div className="col gap14">
      <div className="row gap6">{prompts.map(([k, t]) => <button key={k} onClick={() => { setSel(k); start(async () => setAns(await askAssistant(dealId, k))); }} style={{ fontSize: 13, padding: '8px 12px', border: '1px solid ' + (sel === k ? '#2F5249' : '#4A463F'), background: sel === k ? '#2F5249' : 'transparent', color: 'var(--paper)' }}>{t}</button>)}</div>
      <div className="col gap12" style={{ background: 'var(--dark-2)', padding: 18, minHeight: 140 }}>
        <span style={{ fontSize: 14.5, lineHeight: 1.65 }}>{p ? 'Reading accessible records…' : ans ? ans.a : 'Choose a prompt. Answers draw only on records you are permitted to see.'}</span>
        {ans && !p && <div className="row gap6">{ans.cites.map((c) => <span key={c} className="xs" style={{ border: '1px solid var(--t2)', padding: '4px 8px', color: 'var(--gold-d)' }}>{c}</span>)}</div>}
      </div>
      <span className="xs" style={{ color: '#B8B2A5' }}>{ans?.ai ? AI_ASSIST_LABEL : RULES_ASSIST_LABEL}</span>
    </div>
  );
}

export function OfferActions({ dealId, offerId, clarifying }: { dealId: string; offerId: string; clarifying?: boolean }) {
  const { p, run } = useAct();
  const [err, setErr] = useState('');
  const after = (r: any) => setErr(r?.ok ? '' : r?.error || '');
  return (
    <div className="col gap6 rule-tl" style={{ paddingTop: 14 }}>
      <div className="row gap8">
        <button className="btn btn-green btn-sm" disabled={p} onClick={() => run(() => respondOffer(dealId, offerId, 'Accepted'), after)}>Accept</button>
        <a href="#offer-form" className="btn btn-ghost btn-sm">Counter</a>
        {!clarifying && <button className="btn btn-ghost btn-sm" disabled={p} onClick={() => run(() => respondOffer(dealId, offerId, 'Clarification requested'), after)}>Request clarification</button>}
        <ConfirmButton className="btn btn-sm" style={{ background: 'transparent', border: 0, color: 'var(--warn)' }} disabled={p} danger message="Reject this offer? The other side is notified and it is logged in the deal activity." confirmLabel="Reject offer" onConfirm={() => run(() => respondOffer(dealId, offerId, 'Rejected'), after)}>Reject</ConfirmButton>
      </div>
      {clarifying && <span className="xs muted">Waiting for the other party to reply to your clarification request.</span>}
      {err && <span className="err">{err}</span>}
    </div>
  );
}

export function ClarifyReply({ dealId, offerId }: { dealId: string; offerId: string }) {
  const { p, run } = useAct();
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  return (
    <div className="col gap8 rule-tl" style={{ paddingTop: 14 }}>
      <span className="small">The other party asked for clarification on this offer. Your reply is logged and the offer goes back to them.</span>
      <textarea value={v} onChange={(e) => setV(e.target.value)} placeholder="Explain the terms or conditions they asked about" className="textarea" style={{ background: 'var(--paper)', minHeight: 80 }} />
      <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} disabled={p || !v.trim()} onClick={() => run(() => replyClarification(dealId, offerId, v), (r) => { if (r?.ok) { setV(''); setErr(''); } else setErr(r?.error || 'Could not send.'); })}>{p ? 'Sending…' : 'Send reply'}</button>
      {err && <span className="err">{err}</span>}
    </div>
  );
}

export function OfferForm({ dealId, title, submitLabel, initial }: { dealId: string; title: string; submitLabel: string; initial: { equity: number; debt: number; seller: number; earn: number; months: number; conditions: string } }) {
  const { p, run } = useAct();
  const [f, setF] = useState(initial);
  const [msg, setMsg] = useState('');
  const total = (Number(f.equity) || 0) + (Number(f.debt) || 0) + (Number(f.seller) || 0) + (Number(f.earn) || 0);
  const fields: [keyof typeof f, string][] = [['equity', 'Equity (₹ Cr)'], ['debt', 'Bank / NBFC debt (₹ Cr)'], ['seller', 'Seller financing (₹ Cr)'], ['earn', 'Earn-out max (₹ Cr)'], ['months', 'Timeline (months)']];
  return (
    <div id="offer-form" className="card col gap14" style={{ padding: 24 }}>
      <span className="serif" style={{ fontSize: 22 }}>{title}</span>
      {fields.map(([k, l]) => (
        <label key={k} className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 150px', gap: 12, alignItems: 'center', fontSize: 14 }}><span>{l}</span>
          <input type="number" step="0.01" min="0" value={f[k] as number} onChange={(e) => { setF({ ...f, [k]: e.target.value as any }); setMsg(''); }} className="input" style={{ textAlign: 'right', background: 'var(--paper)', padding: '10px 12px' }} /></label>
      ))}
      <div className="row between rule-t" style={{ paddingTop: 12, fontSize: 14 }}><span>Total (₹ Cr)</span><span className="serif" style={{ fontSize: 24 }}>{total.toFixed(2)}</span></div>
      <textarea value={f.conditions} onChange={(e) => setF({ ...f, conditions: e.target.value })} placeholder="Conditions & required approvals" className="textarea" style={{ background: 'var(--paper)' }} />
      <button className="btn btn-lg" disabled={p} onClick={() => run(() => submitOffer(dealId, { ...f, equity: Number(f.equity), debt: Number(f.debt), seller: Number(f.seller), earn: Number(f.earn), months: Number(f.months) }), (r) => setMsg(r?.ok ? 'Sent ✓ logged' : r?.error || 'Could not send.'))}>{p ? 'Sending…' : submitLabel}</button>
      {msg && <span className="small" style={{ color: msg.startsWith('Sent') ? 'var(--green)' : 'var(--warn)' }}>{msg}</span>}
    </div>
  );
}

export function ReferralButton({ dealId, idx, done }: { dealId: string; idx: number; done: boolean }) {
  const { p, run } = useAct();
  return <button className={'btn btn-sm ' + (done ? 'btn-green' : 'btn-ghost')} style={{ whiteSpace: 'nowrap' }} disabled={done || p} onClick={() => run(() => requestReferral(dealId, idx))}>{done ? 'Referral requested ✓' : 'Request referral'}</button>;
}

export function CheckItem({ dealId, kind, k, label, who, checked, disabled }: { dealId: string; kind: 'closing' | 'transition'; k: string; label: string; who?: string; checked: boolean; disabled?: boolean }) {
  const { p, run } = useAct();
  const [c, setC] = useState(checked);
  const [note, setNote] = useState('');
  return (<>
    <label className="grid" style={{ gridTemplateColumns: '24px minmax(0,1fr) auto', gap: 12, padding: kind === 'closing' ? '13px 16px' : '4px 0', borderBottom: kind === 'closing' ? '1px solid var(--rule-l)' : 0, alignItems: 'center', fontSize: 14, cursor: disabled ? 'default' : 'pointer' }}>
      <input type="checkbox" checked={c} disabled={disabled || p} onChange={() => { const prev = c; setC(!c); run(() => toggleChecklist(dealId, kind, k), (r) => { if (!r?.ok) setC(prev); setNote(r?.note || r?.error || ''); }); }} style={{ accentColor: 'var(--green)', width: 16, height: 16 }} />
      <span style={{ textDecoration: c ? 'line-through' : 'none', color: c ? 'var(--dis)' : 'var(--ink)' }}>{label}</span>
      {who ? <span className="xs muted">{who}</span> : <span />}
    </label>
    {note && <span className="small" style={{ color: 'var(--warn)', padding: kind === 'closing' ? '8px 16px' : '2px 0' }}>{note}</span>}
  </>);
}

export function Instalments({ dealId, received, total, canEdit }: { dealId: string; received: boolean[]; total: number; canEdit: boolean }) {
  const { p, run } = useAct();
  const [err, setErr] = useState('');
  return (
    <div className="col gap6">
      <div className="row" style={{ gap: 3, flexWrap: 'nowrap' }}>
        {Array.from({ length: total }, (_, i) => (
          <button key={i} type="button" title={`Instalment ${i + 1}${received[i] ? ' · received' : ''}`} aria-label={`Instalment ${i + 1}, ${received[i] ? 'received' : 'not received'}`} disabled={!canEdit || p}
            onClick={() => run(() => toggleInstalment(dealId, i), (r) => setErr(r?.ok ? '' : r?.error || ''))}
            style={{ flex: 1, height: 22, padding: 0, border: 0, background: received[i] ? 'var(--green)' : 'var(--rule-l)', cursor: canEdit ? 'pointer' : 'default' }} />
        ))}
      </div>
      {canEdit && <span className="xs muted">Click an instalment to record it as received. Click again to undo.</span>}
      {err && <span className="err">{err}</span>}
    </div>
  );
}

export function EarnoutForm({ dealId }: { dealId: string }) {
  const { p, run } = useAct();
  const [f, setF] = useState({ title: '', amount: '', measure: '' });
  const [err, setErr] = useState('');
  return (
    <div className="col gap8 rule-tl" style={{ paddingTop: 12 }}>
      <span className="xs muted">Add a milestone from the definitive agreement</span>
      <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. FY27 revenue at least ₹9.5 Cr" className="input" style={{ background: 'var(--paper)', padding: '9px 12px', fontSize: 14 }} />
      <div className="row gap8">
        <input type="number" step="0.01" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="Amount (₹ Cr)" className="input" style={{ flex: 1, minWidth: 120, width: 'auto', background: 'var(--paper)', padding: '9px 12px', fontSize: 14 }} />
        <input value={f.measure} onChange={(e) => setF({ ...f, measure: e.target.value })} placeholder="Measured on (e.g. 31 Mar 2027)" className="input" style={{ flex: 2, minWidth: 160, width: 'auto', background: 'var(--paper)', padding: '9px 12px', fontSize: 14 }} />
      </div>
      <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} disabled={p || !f.title.trim() || !f.amount} onClick={() => run(() => addEarnout(dealId, { title: f.title, amount: Number(f.amount), measure: f.measure }), (r) => { if (r?.ok) { setF({ title: '', amount: '', measure: '' }); setErr(''); } else setErr(r?.error || 'Could not add.'); })}>Add milestone</button>
      {err && <span className="err">{err}</span>}
    </div>
  );
}

export function EarnoutProgress({ dealId, id, progress, canEdit }: { dealId: string; id: string; progress: number; canEdit: boolean }) {
  const { p, run } = useAct();
  const [v, setV] = useState(progress);
  return (
    <div className="row gap10" style={{ flexWrap: 'nowrap', alignItems: 'center' }}>
      <div className="bar" style={{ height: 8, flex: 1 }}><i style={{ width: v + '%' }} /></div>
      {canEdit ? <input type="number" min={0} max={100} step={5} value={v} disabled={p} onChange={(e) => setV(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} onBlur={() => { if (v !== progress) run(() => setEarnoutProgress(dealId, id, v)); }} className="input" style={{ width: 70, padding: '4px 8px', fontSize: 13, textAlign: 'right', background: 'var(--paper)' }} aria-label="Progress percent" /> : null}
      <span className="xs muted" style={{ minWidth: 34, textAlign: 'right' }}>{v}%</span>
    </div>
  );
}

export function FinancingFields({ dealId, collateral, credit, side }: { dealId: string; collateral: string; credit: string; side: string }) {
  const { p, run } = useAct();
  const [c, setC] = useState(collateral);
  const [cp, setCp] = useState(credit);
  const [msg, setMsg] = useState('');
  const canEdit = side === 'owner' || side === 'buyer';
  if (!canEdit) return null;
  return (
    <div className="col gap8 rule-tl" style={{ paddingTop: 12 }}>
      <label className="label">Collateral<input value={c} onChange={(e) => { setC(e.target.value); setMsg(''); }} placeholder="e.g. Inventory, receivables, share pledge" className="input" style={{ background: 'var(--paper)' }} /></label>
      {side === 'buyer' && <label className="label">Your credit profile<input value={cp} onChange={(e) => { setCp(e.target.value); setMsg(''); }} placeholder="e.g. CIBIL 790, existing term loans" className="input" style={{ background: 'var(--paper)' }} /></label>}
      <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} disabled={p} onClick={() => run(() => saveFinancing(dealId, side === 'buyer' ? { collateral: c, credit: cp } : { collateral: c }), (r) => setMsg(r?.ok ? 'Saved ✓' : r?.error || 'Could not save.'))}>Save financing details</button>
      {msg && <span className="small" style={{ color: msg.startsWith('Saved') ? 'var(--green)' : 'var(--warn)' }}>{msg}</span>}
    </div>
  );
}
