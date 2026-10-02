'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { STEPS, visibleQuestions, type Answers } from '@/lib/assessment';
import { saveAssessment, completeAssessment } from '@/app/actions/assessment';
import OtpForm from '@/components/OtpForm';
import Photo from '@/components/Photo';

export default function AssessmentClient({ initialAnswers, initialStep, hasDraft, signedIn, invite }: { initialAnswers: Answers; initialStep: number; hasDraft: boolean; signedIn: boolean; invite?: { token: string; by: string } }) {
  const [phase, setPhase] = useState<'intro' | 'q' | 'auth' | 'proc'>('intro');
  const [a, setA] = useState<Answers>(initialAnswers);
  const [step, setStep] = useState(Math.min(initialStep, STEPS.length - 1));
  const [why, setWhy] = useState<string | null>(null);
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved' | 'error'>(hasDraft ? 'saved' : 'idle');
  const [proc, setProc] = useState(0);
  const [err, setErr] = useState('');
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ a, step });
  latest.current = { a, step };

  const persist = (na: Answers, ns: number) => {
    setSaved('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const r = await saveAssessment(na, ns);
      setSaved(r.ok ? 'saved' : 'error');
    }, 350);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { if (invite) fetch('/api/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: invite.token }) }).catch(() => {}); }, [invite]);

  const st = STEPS[step];
  const vis = visibleQuestions(st, a);
  const answered = vis.filter((q) => a[q.id] !== undefined).length;
  const doneSteps = STEPS.map((s) => visibleQuestions(s, a).every((q) => a[q.id] !== undefined));
  const pct = phase === 'intro' ? 0 : phase === 'proc' ? 100 : Math.round(((step + answered / Math.max(vis.length, 1)) / STEPS.length) * 100);

  const set = (id: string, v: number) => { const na = { ...a, [id]: v }; setA(na); persist(na, step); };
  const go = (s: number) => { setStep(s); persist(a, s); window.scrollTo(0, 0); };

  const runFinish = () => start(async () => {
    setErr('');
    const r = await completeAssessment(latest.current.a, latest.current.step);
    if (!r.ok && 'needAuth' in r && r.needAuth) { setPhase('auth'); window.scrollTo(0, 0); return; }
    if (!r.ok) { setErr((r as any).error || 'Something went wrong. Your answers are saved.'); return; }
    setPhase('proc');
    let i = 0;
    const iv = setInterval(() => { i++; setProc(i); if (i >= 4) { clearInterval(iv); setTimeout(() => { window.location.href = '/report'; }, 500); } }, 650);
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`.as-rail{display:flex}.as-compact{display:none}@media(max-width:760px){.as-rail{display:none}.as-compact{display:flex}}`}</style>
      <header style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--paper)', borderBottom: '1px solid var(--ink)' }}>
        <div className="wrap-m row between" style={{ padding: '14px 24px', flexWrap: 'nowrap' }}>
          <Link href="/" className="serif" style={{ fontSize: 20 }}>Legacy <em style={{ color: 'var(--green)' }}>Handover</em></Link>
          <div className="row small muted" style={{ gap: 18, flexWrap: 'nowrap' }}>
            <span className="row" style={{ gap: 7, whiteSpace: 'nowrap' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: saved === 'error' ? 'var(--warn)' : '#4E8A6E' }} />{saved === 'saving' ? 'Saving…' : saved === 'saved' ? 'Saved' : saved === 'error' ? 'Not saved, retrying on next answer' : 'Autosave on'}</span>
            <Link href={signedIn ? '/dashboard' : '/'} className="btn btn-ghost btn-sm">Save &amp; exit</Link>
          </div>
        </div>
        <div style={{ height: 3, background: 'var(--rule-l)' }}><div style={{ height: '100%', width: pct + '%', background: 'var(--green)', transition: 'width .4s ease' }} /></div>
      </header>

      {phase === 'intro' && (
        <main className="wrap-m grid g-auto-420" style={{ padding: '56px 24px 96px', width: '100%', gap: 56, alignItems: 'stretch' }}>
          <div className="col gap28">
            <span className="eyebrow">Succession assessment</span>
            {invite && <div className="notice">Invited by {invite.by}. When you finish, your scores, tasks and documents (view only) are shared with them. Nothing else, and you can revoke it any time.</div>}
            <h1 className="h1" style={{ fontSize: 'clamp(34px,4.4vw,56px)' }}>Seven minutes. Entirely private. No decisions required.</h1>
            <p className="t2" style={{ margin: 0, fontSize: 16.5, lineHeight: 1.6, maxWidth: 560 }}>About forty short questions on you, your business and the people in it. Answer in ranges, skip anything, and say &ldquo;I don&rsquo;t know&rdquo; whenever that&rsquo;s the truth. It&rsquo;s simply noted.</p>
            <div className="grid g-auto-160 rule-t" style={{ gap: 20, paddingTop: 20 }}>
              {[['We’ll ask about', 'You · the business · ownership · a possible successor · your role · customers · your team · records'], ['You’ll receive', 'Three scores with reasons · which paths fit · indicative value · your first actions'], ['We will never', 'Contact your staff or family · list your business · share anything without your approval']].map(([h, p]) => (
                <div key={h} className="col gap8"><span className="eyebrow">{h}</span><span className="t2" style={{ fontSize: 14, lineHeight: 1.6 }}>{p}</span></div>
              ))}
            </div>
            <div className="col gap12" style={{ alignItems: 'flex-start' }}>
              <button className="btn btn-green btn-lg" onClick={() => { setPhase('q'); window.scrollTo(0, 0); }}>{Object.keys(a).length ? `Resume from step ${step + 1} →` : 'Begin →'}</button>
              <span className="small muted">Progress saves after every answer. Leave and return anytime on this device, or sign in to continue anywhere.</span>
            </div>
          </div>
          <Photo caption="Owner at their desk, reading: calm, unposed" style={{ minHeight: 420 }} />
        </main>
      )}

      {phase === 'q' && (
        <>
          <main className="wrap-m" style={{ padding: '48px 24px 140px', width: '100%', display: 'flex', flexWrap: 'wrap', gap: '32px 56px' }}>
            <div className="as-compact row between small rule-bl" style={{ flexBasis: '100%', paddingBottom: 12 }}>
              <span style={{ color: 'var(--gold)', fontWeight: 500 }}>Step {step + 1} of {STEPS.length} · {st.key}</span>
              <div className="row gap4" style={{ flexWrap: 'nowrap' }}>{STEPS.map((s, i) => <button key={s.key} aria-label={s.key} onClick={() => go(i)} style={{ width: 22, height: 22, padding: 0, border: 0, background: 'transparent', display: 'grid', placeItems: 'center' }}><span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid ' + (doneSteps[i] || i === step ? 'var(--green)' : '#B8B2A5'), background: doneSteps[i] || i === step ? 'var(--green)' : 'transparent' }} /></button>)}</div>
            </div>
            <aside className="as-rail col" style={{ alignSelf: 'start', gap: 2, flex: '1 1 220px', maxWidth: '100%' }}>
              <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 500, marginBottom: 12 }}>Step {step + 1} of {STEPS.length}</span>
              {STEPS.map((s, i) => (
                <button key={s.key} onClick={() => go(i)} className="row" style={{ textAlign: 'left', background: i === step ? 'var(--tint)' : 'transparent', border: 0, padding: '10px 12px', gap: 12, fontSize: 14, color: i === step ? 'var(--ink)' : 'var(--muted)', flexWrap: 'nowrap' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid ' + (doneSteps[i] || i === step ? 'var(--green)' : '#B8B2A5'), background: doneSteps[i] ? 'var(--green)' : 'transparent', color: 'var(--paper)', display: 'grid', placeItems: 'center', fontSize: 11, flexShrink: 0 }}>{doneSteps[i] ? '✓' : ''}</span>{s.key}
                </button>
              ))}
              <div className="t2" style={{ marginTop: 24, padding: 16, background: 'var(--tint)', fontSize: 13, lineHeight: 1.55 }}>Your answers are private and saved on every tap. You can leave and return anytime.</div>
            </aside>
            <section className="col" style={{ gap: 36, minWidth: 0, flex: '999 1 min(100%,480px)' }}>
              <div className="col gap10">
                <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(30px,4vw,44px)', letterSpacing: '-.025em', lineHeight: 1.08, margin: 0 }}>{st.title}</h1>
                <p className="t2" style={{ margin: 0, fontSize: 16, maxWidth: 620 }}>{st.intro}</p>
              </div>
              <div className="col gap14">
                {vis.map((q) => {
                  const cur = a[q.id];
                  return (
                    <fieldset key={q.id} className="col gap14" style={{ background: 'var(--card)', border: '1px solid ' + (cur !== undefined ? '#C9D3CC' : 'var(--ink)'), padding: '22px 24px', margin: 0 }}>
                      <div className="row between" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', gap: 16 }}>
                        <legend style={{ fontSize: 16.5, fontWeight: 500, lineHeight: 1.4, float: 'left', padding: 0 }}>{q.label}</legend>
                        <div className="row gap8" style={{ flexShrink: 0, flexWrap: 'nowrap' }}>
                          {q.optional && <span className="xs muted">Optional</span>}
                          {q.why && <button onClick={() => setWhy(why === q.id ? null : q.id)} style={{ fontSize: 12, background: 'var(--tint)', border: 0, padding: '5px 10px', color: 'var(--t2)' }}>Why we ask</button>}
                        </div>
                      </div>
                      {why === q.id && <div className="t2" style={{ fontSize: 13.5, background: 'var(--paper)', padding: '12px 14px' }}>{q.why}</div>}
                      <div className="row gap8">
                        {q.options.map((o, i) => <button key={o} className={'chip' + (cur === i ? ' on' : '')} onClick={() => set(q.id, i)} aria-pressed={cur === i}>{o}</button>)}
                        <button className={'chip chip-dash' + (cur === -1 ? ' on' : '')} onClick={() => set(q.id, -1)} aria-pressed={cur === -1}>{q.id === 'age' ? 'Prefer not to say' : 'I don’t know'}</button>
                      </div>
                    </fieldset>
                  );
                })}
              </div>
              {err && <span className="err">{err}</span>}
            </section>
          </main>
          <footer style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(245,242,235,.96)', backdropFilter: 'blur(6px)', borderTop: '1px solid var(--ink)' }}>
            <div className="wrap-m row between" style={{ padding: '14px 24px', flexWrap: 'nowrap' }}>
              <button className="btn btn-ghost" style={{ visibility: step === 0 ? 'hidden' : 'visible' }} onClick={() => go(Math.max(0, step - 1))}>← Back</button>
              <span className="small muted">{answered} of {vis.length} answered</span>
              <button className="btn btn-green" onClick={() => (step < STEPS.length - 1 ? go(step + 1) : runFinish())}>{step < STEPS.length - 1 ? 'Continue →' : 'See my results →'}</button>
            </div>
          </footer>
        </>
      )}

      {phase === 'auth' && (
        <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '48px 24px' }}>
          <div className="col gap24" style={{ maxWidth: 440, width: '100%' }}>
            <span className="eyebrow">Last step · your private account</span>
            <h1 className="serif" style={{ fontWeight: 300, fontSize: 34, margin: 0, letterSpacing: '-.02em' }}>Where should we keep your results?</h1>
            <p className="t2" style={{ margin: 0 }}>Your answers are saved. Verify your mobile or email so the report, scores and plan stay private to you and available on any device.</p>
            <OtpForm role="owner" submitLabel="Verify & see my results" onDone={() => runFinish()} />
            <button className="linkbtn small muted" style={{ alignSelf: 'flex-start' }} onClick={() => setPhase('q')}>← Back to my answers</button>
          </div>
        </main>
      )}

      {phase === 'proc' && (
        <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '48px 24px' }}>
          <div className="col gap28" style={{ maxWidth: 520, width: '100%', alignItems: 'center', textAlign: 'center' }}>
            <div className="spinner" />
            <h1 className="serif" style={{ fontWeight: 300, fontSize: 36, margin: 0 }}>Preparing your report</h1>
            <div className="col gap10" style={{ width: '100%', textAlign: 'left' }}>
              {['Validating your answers', 'Calculating scores with the rules engine', 'Analysing succession paths', 'Writing your personalised summary'].map((t, i) => (
                <div key={t} className="row" style={{ gap: 12, padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--ink)', fontSize: 14.5, color: proc >= i ? 'var(--ink)' : 'var(--dis)', flexWrap: 'nowrap' }}><span style={{ width: 18, textAlign: 'center' }}>{proc > i ? '✓' : proc === i ? '…' : ''}</span>{t}</div>
              ))}
            </div>
            <span className="small muted">Your answers are saved. If anything interrupts this, nothing is lost.</span>
          </div>
        </main>
      )}
    </div>
  );
}
