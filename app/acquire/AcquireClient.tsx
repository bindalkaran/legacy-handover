'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Photo from '@/components/Photo';
import OtpForm from '@/components/OtpForm';
import { saveBuyerProfile, requestAccess, saveSearch } from '@/app/actions/buyer';

type L = { id: string; industry: string; title: string; description: string; revenue_band: string; location: string; years: string; transferability_band: string; deal_note: string; verification: string; open_international: boolean; is_sample: boolean };

const F = [
  { title: 'Tell us about you', fields: [['type', 'You are', ['Individual entrepreneur', 'Business owner', 'Professional manager', 'Management team', 'Strategic company', 'Family office / investor']], ['exp', 'Operating experience', ['Under 5 yrs', '5–15 yrs', '15+ yrs']]] },
  { title: 'Capital & financing', fields: [['cap', 'Capital available', ['Under ₹1 Cr', '₹1–3 Cr', '₹3–10 Cr', '₹10 Cr+']], ['fin', 'Will you need acquisition financing?', ['No', 'Partly', 'Yes']]] },
  { title: 'What you’re looking for', fields: [['industries', 'Preferred industries', ['Manufacturing', 'Distribution', 'Wholesale', 'B2B services', 'Specialty retail', 'Open']], ['inv', 'Your involvement', ['Full-time operator', 'Board / oversight', 'Either']], ['when', 'Timeline', ['Within 6 months', '6–12 months', '12–24 months']]] }
] as const;

const IND_IMG: Record<string, string> = { Manufacturing: 'manufacturing', Distribution: 'distribution', Wholesale: 'wholesale', 'B2B services': 'services', 'Specialty retail': 'retail' };
const indImg = (i: string) => `/images/listing-${IND_IMG[i] || 'manufacturing'}.jpg`;

const vc = (v: string) => (v === 'Financially verified' ? 'p-green' : v === 'Business verified' ? 'p-green-l' : 'p-grey');

export default function AcquireClient({ listings, signedIn, hasProfile, requested, savedLabels }: { listings: L[]; signedIn: boolean; hasProfile: boolean; requested: string[]; savedLabels: string[] }) {
  const router = useRouter();
  const [ind, setInd] = useState('All');
  const [intl, setIntl] = useState(false);
  const [savedSet, setSavedSet] = useState<string[]>(savedLabels);
  const [reg, setReg] = useState<null | { step: number; target?: L; afterSave?: boolean }>(null);
  const [f, setF] = useState<Record<string, any>>({ industries: [] });
  const [done, setDone] = useState<string[]>(requested);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [p, start] = useTransition();
  const [profile, setProfile] = useState(hasProfile);
  const inds = ['All', 'Manufacturing', 'Distribution', 'Wholesale', 'B2B services', 'Specialty retail'];
  const label = (ind === 'All' ? 'All industries' : ind) + (intl ? ' · international' : '');
  const saved = savedSet.includes(label);
  const list = listings.filter((l) => (ind === 'All' || l.industry === ind) && (!intl || l.open_international));

  const doRequest = (l: L) => start(async () => {
    setErr('');
    if (l.is_sample) { setMsg('This is a sample listing that shows how opportunities appear. Requests open on live, owner-approved profiles. Create a profile to be matched as they are published.'); setReg({ step: 9 }); return; }
    const r = await requestAccess(l.id);
    if (r.ok) { setDone([...done, l.id]); setMsg(`Your access request for “${r.title}” has been sent. It appears in the owner’s dashboard, and they decide whether to share more.`); setReg({ step: 9 }); return; }
    if ('needAuth' in r && r.needAuth) return setReg({ step: 0, target: l });
    if ('needProfile' in r && r.needProfile) return setReg({ step: 0, target: l });
    setErr(r.error || ''); setMsg(r.error || ''); setReg({ step: 9 });
  });
  const doSave = () => start(async () => {
    if (!profile) return setReg({ step: 0, afterSave: true });
    const r = await saveSearch(label, { industry: ind, intl });
    if (r.ok) setSavedSet([...savedSet, label]); else setReg({ step: 0, afterSave: true });
  });
  const finishProfile = () => start(async () => {
    const r = await saveBuyerProfile({ ...f, international: intl });
    if (!r.ok) {
      if ('needAuth' in r && r.needAuth) { setReg({ ...reg!, step: 3 }); return; }
      setErr('We couldn’t save your profile. Please try again.'); return;
    }
    setProfile(true);
    if (reg?.afterSave) { await saveSearch(label, { industry: ind, intl }); setSavedSet([...savedSet, label]); }
    if (reg?.target) {
      const rr = await requestAccess(reg.target.id);
      if (rr.ok) { setDone([...done, reg.target.id]); setMsg(`Your access request for “${rr.title}” has been sent. It appears in the owner’s dashboard, and they decide whether to share more.`); }
      else setMsg(('error' in rr && rr.error) || 'Profile created.');
    } else setMsg('We’ll match you with opportunities that fit. Complete verification to request access to details.');
    setReg({ step: 9 });
    router.refresh();
  });

  const step = reg?.step ?? 0;
  const cur = step < 3 ? F[step] : null;
  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--paper)', borderBottom: '1px solid var(--ink)' }}>
        <div className="wrap row between" style={{ padding: '16px 32px', gap: 24 }}>
          <Link href="/" className="serif" style={{ fontSize: 23 }}>Legacy <em style={{ color: 'var(--green)' }}>Handover</em></Link>
          <nav className="row" style={{ gap: 24, fontSize: 13.5 }}><Link href="/">For owners</Link><Link href="/acquire" className="link-u">For acquirers</Link>{signedIn ? <form action="/api/sign-out" method="post" style={{ display: 'inline' }}><button className="linkbtn" style={{ fontSize: 13.5 }}>Sign out</button></form> : <Link href="/sign-in?role=buyer">Sign in</Link>}</nav>
          {profile ? <Link href="/acquirer" className="btn btn-green btn-sm">My acquirer dashboard</Link> : <button className="btn btn-green btn-sm" onClick={() => setReg({ step: 0 })}>Create acquirer profile</button>}
        </div>
      </header>

      <section className="wrap grid g-auto-420" style={{ paddingTop: 72, paddingBottom: 48, gap: 48, alignItems: 'end' }}>
        <h1 className="h1" style={{ fontSize: 'clamp(38px,5vw,64px)' }}>Don&rsquo;t start from zero. <em style={{ color: 'var(--green)' }}>Take a legacy forward.</em></h1>
        <div className="col gap16">
          <p className="t2" style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>Established, profitable businesses whose owners are planning their next chapter. Every profile is reviewed. Details unlock as you&rsquo;re verified and the owner approves.</p>
          <div className="row gap6" style={{ fontSize: 12.5 }}>{['Browse', 'Profile', 'Verified', 'Owner approves', 'NDA & data room'].map((t, i) => <span key={t} style={{ padding: '6px 12px', background: i === 0 || (profile && i < 2) ? 'var(--green)' : 'var(--tint)', color: i === 0 || (profile && i < 2) ? 'var(--paper)' : 'var(--t2)' }}>{t}</span>)}</div>
        </div>
      </section>

      <section className="wrap col gap20" style={{ paddingBottom: 96 }}>
        <div className="row gap8" style={{ padding: 12, background: 'var(--tint)' }}>
          {inds.map((c) => <button key={c} onClick={() => setInd(c)} style={{ fontSize: 13.5, padding: '9px 15px', border: 0, background: ind === c ? 'var(--ink)' : 'var(--paper)', color: ind === c ? 'var(--paper)' : 'var(--t2)' }}>{c}</button>)}
          <button onClick={() => setIntl(!intl)} style={{ fontSize: 13.5, padding: '9px 15px', border: '1px solid var(--ink)', background: intl ? 'var(--ink)' : 'transparent', color: intl ? 'var(--paper)' : 'var(--ink)' }}>Open to international buyers</button>
          <span className="t2" style={{ marginLeft: 'auto', fontSize: 13, paddingRight: 8 }}>{list.length} reviewed opportunities · identities protected</span>
          <button className="btn btn-sm" onClick={doSave} disabled={p || saved}>{saved ? 'Search saved ✓' : 'Save this search'}</button>
        </div>
        {listings.length === 0 && (
          <div className="card col gap10" style={{ maxWidth: 760 }}>
            <span className="serif" style={{ fontSize: 24 }}>No businesses are open to acquirers yet.</span>
            <span className="t2" style={{ fontSize: 15.5, lineHeight: 1.6 }}>A profile appears here only after an owner chooses to share an anonymous summary and our team reviews it. Create your acquirer profile now and new opportunities that match it will show in your acquirer dashboard.</span>
          </div>
        )}
        {listings.length > 0 && list.length === 0 && <div className="card muted">No published opportunities match these filters yet. Save the search to see new matches in your acquirer dashboard.</div>}
        <div className="grid g-auto-340" style={{ gap: 14 }}>
          {list.map((l) => {
            const req = done.includes(l.id);
            return (
              <div key={l.id} className="card col gap16" style={{ padding: 24 }}>
                <Photo src={indImg(l.industry)} caption={`${l.industry}: representative photo, not this business`} sizes="(max-width: 760px) 100vw, 33vw" style={{ aspectRatio: '16/9', margin: '-24px -24px 0', borderBottom: '1px solid var(--ink)' }} />
                <div className="row between" style={{ fontSize: 12 }}><span style={{ color: 'var(--gold)', fontWeight: 500 }}>{l.industry}</span><span className="row gap6">{l.is_sample && <span className="sample-tag">Sample</span>}<span className={'pill ' + vc(l.verification)}>{l.verification}</span></span></div>
                <span className="serif" style={{ fontSize: 23, lineHeight: 1.2 }}>{l.title}</span>
                <span className="t2" style={{ fontSize: 14 }}>{l.description}</span>
                <div className="grid rule-tl" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 14 }}>
                  {[['Revenue', l.revenue_band], ['Location', l.location], ['Operating', l.years], ['Transferability', l.transferability_band]].map(([k, v]) => <div key={k} className="col gap4"><span className="xs muted">{k}</span><span style={{ fontSize: 14.5, color: k === 'Transferability' ? 'var(--green)' : undefined }}>{v || '—'}</span></div>)}
                </div>
                <div className="row between" style={{ gap: 12 }}>
                  <span className="xs muted">{l.deal_note}</span>
                  <button className={'btn btn-sm ' + (req ? 'btn-green' : 'btn-ghost')} disabled={req || p} onClick={() => doRequest(l)}>{req ? 'Requested ✓' : l.is_sample ? 'Sample only' : 'Request access'}</button>
                </div>
              </div>
            );
          })}
        </div>
        {err && <span className="err">{err}</span>}
      </section>

      <section style={{ background: 'var(--green)', color: 'var(--paper)' }}>
        <div className="wrap grid g-auto-420" style={{ paddingTop: 80, paddingBottom: 80, gap: 40, alignItems: 'center' }}>
          <div className="col gap14"><span className="small" style={{ color: 'var(--gold-d)' }}>Future Successor Network</span><h2 className="h2" style={{ fontSize: 'clamp(28px,3.4vw,42px)', lineHeight: 1.1 }}>&ldquo;I want to acquire and operate an established business within the next 24 months.&rdquo;</h2></div>
          <div className="col gap14"><p style={{ margin: 0, fontSize: 15.5, color: '#C9D3CC' }}>Senior managers, NRI entrepreneurs, operators and management teams: register your intent once. We&rsquo;ll match you as owners become ready, often before anything is listed.</p>
            <button className="btn btn-paper btn-lg" style={{ alignSelf: 'flex-start' }} onClick={() => (profile ? router.push('/acquirer') : setReg({ step: 0 }))}>Join the network →</button></div>
        </div>
      </section>

      {reg && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(28,27,25,.45)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 40 }}>
          <div className="col gap20" style={{ background: 'var(--card)', width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', padding: 30 }}>
            <div className="row between" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
              <div className="col gap6"><span className="small" style={{ color: 'var(--gold)', fontWeight: 500 }}>{step < 3 ? `Acquirer profile · Step ${step + 1} of 3` : step === 3 ? 'Verify it’s you' : 'Done'}</span><span className="serif" style={{ fontSize: 26, lineHeight: 1.2 }}>{cur ? cur.title : step === 3 ? 'Create your private account' : profile ? 'You’re in' : 'Notice'}</span></div>
              <button aria-label="Close" onClick={() => setReg(null)} style={{ fontSize: 22, background: 'none', border: 0, color: 'var(--muted)', width: 44, height: 44 }}>×</button>
            </div>
            {cur && (
              <>
                <div className="col gap16">
                  {cur.fields.map(([key, label, opts]) => (
                    <div key={key} className="col gap8"><span style={{ fontSize: 14, fontWeight: 500 }}>{label}{key === 'industries' ? ' (choose any)' : ''}</span>
                      <div className="row gap6">{opts.map((o) => {
                        const on = key === 'industries' ? (f.industries || []).includes(o) : f[key] === o;
                        return <button key={o} className={'chip' + (on ? ' on' : '')} style={{ minHeight: 40, padding: '9px 14px', fontSize: 13.5 }} onClick={() => setF(key === 'industries' ? { ...f, industries: on ? f.industries.filter((x: string) => x !== o) : [...(f.industries || []), o] } : { ...f, [key]: o })}>{o}</button>;
                      })}</div>
                    </div>
                  ))}
                </div>
                <div className="row between rule-tl" style={{ paddingTop: 18 }}>
                  <button className="btn btn-ghost" style={{ visibility: step === 0 ? 'hidden' : 'visible' }} onClick={() => setReg({ ...reg, step: step - 1 })}>← Back</button>
                  <button className="btn btn-green" disabled={p} onClick={() => (step < 2 ? setReg({ ...reg, step: step + 1 }) : signedIn ? finishProfile() : setReg({ ...reg, step: 3 }))}>{step < 2 ? 'Continue →' : 'Create profile'}</button>
                </div>
              </>
            )}
            {step === 3 && <OtpForm role="buyer" submitLabel="Verify & create profile" onDone={() => finishProfile()} />}
            {err && step < 9 && <span className="err">{err}</span>}
            {step === 9 && (
              <div className="col gap14">
                <p className="t2" style={{ margin: 0, fontSize: 15 }}>{msg}</p>
                {profile && <div className="col gap8" style={{ fontSize: 14 }}><span className="row gap10"><span style={{ color: 'var(--green)' }}>✓</span>Profile complete</span><span className="row gap10 muted"><span>○</span>Identity verification · our team reaches out</span><span className="row gap10 muted"><span>○</span>Owner review · typically 3–5 working days</span></div>}
                <div className="row gap12"><button className="btn btn-green" onClick={() => setReg(null)}>Continue browsing</button>{profile && <Link href="/acquirer" className="link-u">Go to my acquirer dashboard →</Link>}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
