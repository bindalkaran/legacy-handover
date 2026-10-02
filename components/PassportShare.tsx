'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createShare, revokeShare } from '@/app/actions/passport';

const SECTIONS = ['Identity', 'Financial profile', 'Scores', 'Valuation history', 'Documents', 'Transition status'];

export function ShareBox() {
  const [open, setOpen] = useState(false);
  const [sec, setSec] = useState<string[]>(['Identity', 'Financial profile', 'Scores']);
  const [exp, setExp] = useState(168);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const [p, start] = useTransition();
  const router = useRouter();
  return (
    <div className="col gap12">
      <div className="row gap10 noprint"><button className="btn btn-ghost btn-sm" onClick={() => setOpen(!open)}>Share…</button><button className="btn btn-sm" onClick={() => window.print()}>Download PDF</button></div>
      {open && (
        <div className="card col gap12 noprint" style={{ padding: 20 }}>
          <span style={{ fontWeight: 600 }}>Share a read-only passport link</span>
          <div className="row gap6">{SECTIONS.map((s) => { const on = sec.includes(s); return <button key={s} className={'chip ink' + (on ? ' on' : '')} style={{ minHeight: 36, padding: '8px 12px', fontSize: 13 }} onClick={() => { setSec(on ? sec.filter((x) => x !== s) : [...sec, s]); setLink(''); }}>{s}</button>; })}</div>
          <div className="row gap8"><span className="muted" style={{ fontSize: 13.5 }}>Expires in</span>
            {[[24, '24 hours'], [168, '7 days'], [720, '30 days']].map(([h, l]) => <button key={h} onClick={() => { setExp(h as number); setLink(''); }} style={{ fontSize: 13, padding: '7px 12px', border: '1px solid var(--ink)', background: exp === h ? 'var(--ink)' : 'transparent', color: exp === h ? 'var(--paper)' : 'var(--ink)' }}>{l}</button>)}
            <button className="btn btn-green btn-sm" style={{ marginLeft: 'auto' }} disabled={p} onClick={() => start(async () => { const r = await createShare(sec, exp); if (r.ok) { const url = window.location.origin + r.path; setLink(url); navigator.clipboard?.writeText(url).catch(() => {}); router.refresh(); } else setErr(('error' in r && r.error) || 'Could not create link.'); })}>{link ? 'Link copied ✓' : 'Create link'}</button>
          </div>
          {link && <input readOnly value={link} className="input" style={{ fontSize: 13 }} onFocus={(e) => e.currentTarget.select()} />}
          {err && <span className="err">{err}</span>}
        </div>
      )}
    </div>
  );
}

export function RevokeShare({ id }: { id: string }) {
  const [p, start] = useTransition();
  const router = useRouter();
  return <button className="linkbtn xs" style={{ color: 'var(--warn)' }} disabled={p} onClick={() => start(async () => { await revokeShare(id); router.refresh(); })}>Revoke</button>;
}
