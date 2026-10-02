'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { requestAccess, setSearchFrequency, deleteSearch } from '@/app/actions/buyer';

export function RequestButton({ id, requested, sample }: { id: string; requested: boolean; sample: boolean }) {
  const [state, setState] = useState(requested);
  const [err, setErr] = useState('');
  const [p, start] = useTransition();
  const router = useRouter();
  return (
    <div className="col gap4" style={{ alignItems: 'flex-end' }}>
      <button className={'btn btn-sm ' + (state ? '' : 'btn-ghost')} disabled={state || p} onClick={() => start(async () => { const r = await requestAccess(id); if (r.ok) { setState(true); router.refresh(); } else setErr(('error' in r && r.error) || 'Could not request.'); })}>{state ? 'Requested ✓' : 'Request access'}</button>
      {sample && !state && <span className="sample-tag">Sample</span>}
      {err && <span className="err" style={{ maxWidth: 260, textAlign: 'right' }}>{err}</span>}
    </div>
  );
}

export function FrequencyPicker({ id, value }: { id: string; value: string }) {
  const [v, setV] = useState(value);
  const [, start] = useTransition();
  const router = useRouter();
  return (
    <div className="row gap6"><span className="xs muted">Alert</span>
      {['Instant', 'Weekly', 'Off'].map((f) => <button key={f} onClick={() => { setV(f); start(async () => { await setSearchFrequency(id, f); }); }} style={{ fontSize: 12.5, padding: '7px 11px', border: '1px solid var(--ink)', background: v === f ? 'var(--ink)' : 'transparent', color: v === f ? 'var(--paper)' : 'var(--ink)' }}>{f}</button>)}
      <button className="linkbtn xs" style={{ color: 'var(--warn)', marginLeft: 6 }} onClick={() => start(async () => { await deleteSearch(id); router.refresh(); })}>Remove</button>
    </div>
  );
}
