'use client';
import { useActionState, useState, useTransition } from 'react';
import Link from 'next/link';
import { applyProfessional } from '@/app/actions/public';
import { invitePro } from '@/app/actions/pros';

export default function ProsClient({ pros, signedIn, invited }: { pros: any[]; signedIn: boolean; invited: string[] }) {
  const [type, setType] = useState('All');
  const [city, setCity] = useState('All cities');
  const [inv, setInv] = useState<Record<string, string>>(Object.fromEntries(invited.map((id) => [id, 'Introduction requested ✓'])));
  const [invErr, setInvErr] = useState<Record<string, string>>({});
  const [, start] = useTransition();
  const [state, action, pending] = useActionState(applyProfessional, null as any);
  const types = ['All', 'CA', 'CS', 'Lawyer', 'Valuer', 'M&A advisor', 'Tax advisor', 'Banker', 'Financing'];
  const cities = ['All cities', ...Array.from(new Set(pros.map((p) => p.city).filter(Boolean)))];
  const list = pros.filter((p) => (type === 'All' || p.pro_type === type) && (city === 'All cities' || p.city === city));
  return (
    <main className="wrap col gap32" style={{ paddingTop: 56, paddingBottom: 96 }}>
      <div className="grid g-auto-420" style={{ gap: 32, alignItems: 'end' }}>
        <h1 className="h1">Professionals who do succession work.</h1>
        <p className="t2" style={{ margin: 0, fontSize: 16 }}>CAs, lawyers, valuers and lenders for SME transitions. Invite one into your account or deal; they only see what you share.</p>
      </div>
      <div className="row gap8" style={{ padding: 12, background: 'var(--tint)' }}>
        {types.map((t) => <button key={t} onClick={() => setType(t)} style={{ fontSize: 13.5, padding: '9px 14px', border: 0, background: type === t ? 'var(--ink)' : 'var(--paper)', color: type === t ? 'var(--paper)' : 'var(--ink)' }}>{t}</button>)}
        <select value={city} onChange={(e) => setCity(e.target.value)} className="select" style={{ width: 'auto', marginLeft: 'auto', padding: '9px 12px', fontSize: 13.5 }}>{cities.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <span className="small muted">{list.length} professionals{pros.some((p) => p.is_sample) ? ' · profiles marked Sample illustrate the directory and are not yet verified firms' : ''}</span>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))', gap: 14 }}>
        {list.map((p) => (
          <div key={p.id} className="card col gap14">
            <div className="row gap14" style={{ flexWrap: 'nowrap' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--tint)', display: 'grid', placeItems: 'center', flexShrink: 0 }} className="serif">{p.name.split(' ').map((x: string) => x[0]).slice(0, 2).join('')}</div>
              <div className="col gap4" style={{ minWidth: 0 }}><span className="serif" style={{ fontSize: 20 }}>{p.name}</span><span className="small muted">{p.firm}</span></div>
            </div>
            <div className="row gap6" style={{ fontSize: 12 }}><span className="pill p-ink">{p.pro_type}</span><span style={{ border: '1px solid var(--rule-l)', padding: '4px 9px' }}>{p.city}</span><span style={{ border: '1px solid var(--rule-l)', padding: '4px 9px' }}>{p.languages}</span>{p.is_sample && <span className="sample-tag">Sample</span>}</div>
            <span className="t2" style={{ fontSize: 14 }}>{p.expertise}</span>
            <div className="grid rule-tl" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 8, paddingTop: 12, fontSize: 12.5 }}>
              {[['Transitions', p.transitions], ['Rating', p.rating ? p.rating + ' ★' : '—'], ['Fees from', p.fees_from]].map(([k, v]) => <div key={k} className="col gap4"><span className="muted">{k}</span><span style={{ fontSize: 15 }}>{v}</span></div>)}
            </div>
            <button className={'btn ' + (inv[p.id] ? 'btn-green' : 'btn-ghost')} disabled={!!inv[p.id]} onClick={() => {
              if (!signedIn) { window.location.href = '/sign-in?role=owner&next=/professionals'; return; }
              start(async () => {
                const r = await invitePro(p.id);
                if (r.ok) { setInv((v) => ({ ...v, [p.id]: 'Introduction requested ✓' })); setInvErr((v) => ({ ...v, [p.id]: '' })); }
                else setInvErr((v) => ({ ...v, [p.id]: r.error || 'Not available' }));
              });
            }}>{inv[p.id] || 'Invite to my account'}</button>
            {invErr[p.id] && <span className="err">{invErr[p.id]}{invErr[p.id].includes('assessment') && <> <Link href="/assessment" className="link-u">Start it</Link></>}</span>}
          </div>
        ))}
      </div>
      <div id="join" className="panel-green grid g-auto-380" style={{ padding: 32, gap: 24, alignItems: 'center' }}>
        <div className="col gap6"><span className="serif" style={{ fontSize: 26 }}>Are you a CA, lawyer or valuer?</span><span style={{ fontSize: 14.5, color: 'var(--on-green)' }}>Join the network to manage client succession readiness and receive referrals. We verify every firm before listing.</span></div>
        {state?.ok ? <span style={{ fontSize: 15 }}>Application received ✓ We&rsquo;ll be in touch to verify your firm.</span> : (
          <form action={action} className="grid g-auto-160" style={{ gap: 8 }}>
            <input name="name" required placeholder="Your name" className="input" />
            <input name="firm" placeholder="Firm" className="input" />
            <select name="pro_type" className="select">{types.slice(1).map((t) => <option key={t}>{t}</option>)}</select>
            <input name="city" placeholder="City" className="input" />
            <input name="contact" required placeholder="Mobile or email" className="input" />
            <button className="btn btn-paper" disabled={pending}>Apply to join →</button>
            {state?.error && <span className="err" style={{ color: 'var(--gold-d)' }}>{state.error}</span>}
          </form>
        )}
      </div>
      <span className="xs muted">Already advising clients? <Link href="/advisor" className="link-u">Open the advisor portal</Link>.</span>
    </main>
  );
}
