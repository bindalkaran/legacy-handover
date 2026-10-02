'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signNda, grantDiligence, setStage, askQuestion, answerQuestion, submitOffer, respondOffer, requestReferral, toggleChecklist, askAssistant } from '@/app/actions/deal';
import { cyclePermission } from '@/app/actions/owner';
import { DEAL_STAGES } from '@/lib/constants';

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
  return <button className="btn btn-green btn-sm" disabled={p} onClick={() => { if (confirm('Grant Level 4 (due diligence) access to this acquirer? Every view and download stays logged and revocable.')) run(() => grantDiligence(dealId)); }}>Grant Level 4 access</button>;
}

export function StagePicker({ dealId, stage }: { dealId: string; stage: number }) {
  const { p, run } = useAct();
  const [err, setErr] = useState('');
  return (
    <div className="row gap8">
      <select className="select" style={{ width: 'auto', padding: '8px 10px', fontSize: 13.5 }} defaultValue={stage} disabled={p} onChange={(e) => run(() => setStage(dealId, Number(e.target.value)), (r) => setErr(r?.error || ''))}>
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
  const [ans, setAns] = useState<{ a: string; cites: string[] } | null>(null);
  const [p, start] = useTransition();
  return (
    <div className="col gap14">
      <div className="row gap6">{prompts.map(([k, t]) => <button key={k} onClick={() => { setSel(k); start(async () => setAns(await askAssistant(dealId, k))); }} style={{ fontSize: 13, padding: '8px 12px', border: '1px solid ' + (sel === k ? '#2F5249' : '#4A463F'), background: sel === k ? '#2F5249' : 'transparent', color: 'var(--paper)' }}>{t}</button>)}</div>
      <div className="col gap12" style={{ background: 'var(--dark-2)', padding: 18, minHeight: 140 }}>
        <span style={{ fontSize: 14.5, lineHeight: 1.65 }}>{p ? 'Reading accessible records…' : ans ? ans.a : 'Choose a prompt. Answers draw only on records you are permitted to see.'}</span>
        {ans && !p && <div className="row gap6">{ans.cites.map((c) => <span key={c} className="xs" style={{ border: '1px solid var(--t2)', padding: '4px 8px', color: 'var(--gold-d)' }}>{c}</span>)}</div>}
      </div>
    </div>
  );
}

export function OfferActions({ dealId, offerId }: { dealId: string; offerId: string }) {
  const { p, run } = useAct();
  return (
    <div className="row gap8 rule-tl" style={{ paddingTop: 14 }}>
      <button className="btn btn-green btn-sm" disabled={p} onClick={() => run(() => respondOffer(dealId, offerId, 'Accepted'))}>Accept</button>
      <a href="#offer-form" className="btn btn-ghost btn-sm">Counter</a>
      <button className="btn btn-ghost btn-sm" disabled={p} onClick={() => run(() => respondOffer(dealId, offerId, 'Clarification requested'))}>Request clarification</button>
      <button className="btn btn-sm" style={{ background: 'transparent', border: 0, color: 'var(--warn)' }} disabled={p} onClick={() => { if (confirm('Reject this offer?')) run(() => respondOffer(dealId, offerId, 'Rejected')); }}>Reject</button>
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
  return (
    <label className="grid" style={{ gridTemplateColumns: '24px minmax(0,1fr) auto', gap: 12, padding: kind === 'closing' ? '13px 16px' : '4px 0', borderBottom: kind === 'closing' ? '1px solid var(--rule-l)' : 0, alignItems: 'center', fontSize: 14, cursor: disabled ? 'default' : 'pointer' }}>
      <input type="checkbox" checked={c} disabled={disabled || p} onChange={() => { setC(!c); run(() => toggleChecklist(dealId, kind, k)); }} style={{ accentColor: 'var(--green)', width: 16, height: 16 }} />
      <span style={{ textDecoration: c ? 'line-through' : 'none', color: c ? 'var(--dis)' : 'var(--ink)' }}>{label}</span>
      {who ? <span className="xs muted">{who}</span> : <span />}
    </label>
  );
}
