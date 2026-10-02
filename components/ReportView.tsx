import Link from 'next/link';
import { band } from '@/lib/assessment';
import { type StoredScore, headline, interpretation, strongest, weakest, TIPS, paths, valueLabel, valueFactors, VALUE_DISCLAIMER, TIMELINE, nextActions } from '@/lib/report';
import UnlockBlock from './UnlockBlock';
import PrintButton from './PrintButton';

const col = (v: number) => (v >= 55 ? 'var(--green)' : 'var(--warn)');

export default function ReportView({ s, unlocked, sample, testMode, level = 0 }: { s: StoredScore; unlocked: boolean; sample?: boolean; testMode?: boolean; level?: number }) {
  const L = s.labels || {};
  const P = paths(s);
  const fitC = (f: string) => (f === 'High fit' ? 'p-green' : f === 'Medium fit' ? 'p-gold' : 'p-grey');
  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="rule-b noprint">
        <div className="wrap-m row between" style={{ padding: '14px 24px' }}>
          <Link href="/" className="serif" style={{ fontSize: 20 }}>Legacy <em style={{ color: 'var(--green)' }}>Handover</em></Link>
          <div className="row gap10" style={{ fontSize: 14 }}>
            {sample ? <Link href="/assessment" className="btn btn-green btn-sm">Take the assessment →</Link> : <>
              <Link href="/assessment?retake=1" className="btn btn-ghost btn-sm">Edit answers</Link>
              <PrintButton />
              <Link href="/dashboard" className="btn btn-green btn-sm">Build my plan →</Link>
            </>}
          </div>
        </div>
      </header>
      <main className="wrap-m col" style={{ padding: '56px 24px 96px', gap: 64 }}>
        {sample && <div className="notice">This is a sample report for an illustrative industrial distributor. Your own report is built from your answers.</div>}
        <section className="col gap20">
          <div className="row gap10" style={{ fontSize: 12.5 }}>
            <span className="pill p-solid" style={{ padding: '6px 12px' }}>Private · Level {level}</span>
            <span className="pill" style={{ background: 'var(--tint)', color: 'var(--t2)', padding: '6px 12px' }}>{L.industry} · {L.revenue} revenue</span>
            <span className="pill" style={{ background: 'var(--tint)', color: 'var(--t2)', padding: '6px 12px' }}>Data quality: {s.data_quality}</span>
          </div>
          <h1 className="h1" style={{ fontSize: 'clamp(36px,5vw,60px)', maxWidth: 900 }}>{headline(s.transferability)}</h1>
          <div className="grid g-auto-420">
            <div className="card col gap10"><span className="xs" style={{ color: 'var(--gold)', fontWeight: 500 }}>Interpretation · {s.narrative ? 'AI-assisted' : 'rules-based summary'}, based on your answers</span><p style={{ margin: 0, fontSize: 16, lineHeight: 1.65 }}>{interpretation(s)}</p></div>
            <div className="panel-tint col gap10"><span className="xs t2" style={{ fontWeight: 500 }}>Facts you supplied</span>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px 16px', fontSize: 14 }}>
                {[['Industry', L.industry], ['Revenue', L.revenue], ['Employees', L.employees], ['Years operating', L.years], ['Timeline', L.timeline], ['Successor', L.succWho || 'Not identified']].map(([k, v]) => <div key={k} className="col gap4"><span className="muted xs">{k}</span><span>{v || '—'}</span></div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="grid g-auto-260">
          {([['Transferability', s.transferability, 'Could this business operate under a new owner?'], ['Succession Readiness', s.readiness, 'How prepared are you and the business for an actual transition?'], ['Business Independence', s.independence, 'How well could the business run without you?']] as const).map(([t, v, qq]) => (
            <div key={t} className="card col gap14" style={{ padding: 26 }}>
              <div className="row between"><span style={{ fontWeight: 600, fontSize: 15 }}>{t}</span><span className={'pill ' + (v >= 55 ? 'p-green' : 'p-warn')}>{band(v)}</span></div>
              <div className="row" style={{ alignItems: 'baseline', gap: 6 }}><span className="big tab" style={{ fontSize: 64, color: col(v) }}>{v}</span><span className="muted" style={{ fontSize: 15 }}>/ 100</span></div>
              <div className={'bar' + (v < 55 ? ' warn' : '')} style={{ height: 6 }}><i style={{ width: v + '%' }} /></div>
              <span className="t2" style={{ fontSize: 14 }}>{qq}</span>
            </div>
          ))}
        </section>

        <section className="grid g-auto-420" style={{ gap: 48 }}>
          <div className="col gap16">
            <h2 className="serif" style={{ fontWeight: 300, fontSize: 32, letterSpacing: '-.02em', margin: 0 }}>What drives your Transferability</h2>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>Weighted components · {s.score_version} / {s.assessment_version}</p>
            <div className="col gap14">
              {s.components.map((c) => (
                <div key={c.k} className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 44px', gap: '8px 16px', alignItems: 'center' }}>
                  <span style={{ fontSize: 14.5 }}>{c.k} <span style={{ color: 'var(--dis)', fontSize: 12.5 }}>· {c.w}%</span></span>
                  <span className="tab" style={{ fontSize: 14.5, textAlign: 'right', color: col(c.s) }}>{c.s}</span>
                  <div className={'bar' + (c.s < 55 ? ' warn' : '')} style={{ gridColumn: '1/-1' }}><i style={{ width: c.s + '%' }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="col gap16">
            <div className="col gap12" style={{ background: 'var(--green-t2)', padding: 22 }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--green)' }}>Strengths</span>
              {strongest(s).map((c) => <span key={c.k} className="row" style={{ fontSize: 14.5, gap: 10, flexWrap: 'nowrap' }}><span style={{ color: 'var(--green)' }}>+</span>{c.k} is a relative strength ({c.s})</span>)}
            </div>
            <div className="col gap12" style={{ background: '#F7EEE3', padding: 22 }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--warn)' }}>Risks to address</span>
              {weakest(s).map((k) => <span key={k} className="row" style={{ fontSize: 14.5, gap: 10, flexWrap: 'nowrap' }}><span style={{ color: 'var(--warn)' }}>!</span>{TIPS[k]}</span>)}
            </div>
          </div>
        </section>

        {!unlocked && !sample && <UnlockBlock testMode={!!testMode} />}

        {unlocked && <>
          <section className="col gap24">
            <div className="row between" style={{ alignItems: 'flex-end', gap: 24 }}>
              <h2 className="serif" style={{ fontWeight: 300, fontSize: 32, letterSpacing: '-.02em', margin: 0 }}>Your succession paths</h2>
              <span className="muted" style={{ fontSize: 14, maxWidth: 420 }}>Compatibility, not a recommendation. Several paths can be right at once.</span>
            </div>
            <div className="grid g-auto-300" style={{ gap: 12 }}>
              {P.map((p) => (
                <div key={p.t} className="card col gap10" style={{ padding: 20 }}>
                  <div className="row between" style={{ flexWrap: 'nowrap' }}><span className="serif" style={{ fontSize: 21 }}>{p.t}</span><span className={'pill ' + fitC(p.fit)}>{p.fit}</span></div>
                  <span className="t2" style={{ fontSize: 14 }}>{p.why}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="grid g-auto-420">
            <div className="panel-green col gap16" style={{ padding: 30 }}>
              <span className="small" style={{ color: 'var(--gold-d)' }}>Indicative enterprise value</span>
              <span className="serif" style={{ fontSize: 'clamp(36px,5vw,52px)', letterSpacing: '-.02em' }}>{valueLabel(s)}</span>
              <div className="col gap8" style={{ fontSize: 14, color: '#C9D3CC' }}>
                {valueFactors(s).map(([k, v]) => <span key={k} className="row between" style={{ borderTop: '1px solid #2F5249', paddingTop: 8, flexWrap: 'nowrap' }}><span>{k}</span><span style={{ color: 'var(--paper)' }}>{v}</span></span>)}
              </div>
              <span style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--on-green-m)' }}>{VALUE_DISCLAIMER}</span>
            </div>
            <div className="card col gap16" style={{ padding: 30 }}>
              <span className="serif" style={{ fontSize: 24 }}>Suggested timeline</span>
              {TIMELINE.map(([w, d]) => <div key={w} className="grid" style={{ gridTemplateColumns: '96px 1fr', gap: 16, fontSize: 14, alignItems: 'baseline' }}><span style={{ fontWeight: 600, color: 'var(--green)' }}>{w}</span><span className="t2">{d}</span></div>)}
            </div>
          </section>
          <section className="grid g-auto-380" style={{ background: 'var(--tint)', padding: 40, gap: 32, alignItems: 'center' }}>
            <div className="col gap14">
              <span className="small" style={{ color: 'var(--gold)', fontWeight: 500 }}>Your next five actions</span>
              {nextActions(s).map((t, i) => <span key={t} className="row" style={{ fontSize: 16, gap: 14, flexWrap: 'nowrap' }}><span className="serif" style={{ color: 'var(--gold)' }}>{i + 1}</span>{t}</span>)}
            </div>
            <div className="col gap12">
              <Link href={sample ? '/assessment' : '/dashboard?view=tasks'} className="btn btn-green btn-lg" style={{ justifyContent: 'space-between' }}><span>{sample ? 'Get my own report' : 'Turn this into my readiness plan'}</span><span>→</span></Link>
              <span className="small muted" style={{ textAlign: 'center' }}>Your report stays private. Invite your CA or advisor from the dashboard.</span>
            </div>
          </section>
        </>}
      </main>
    </div>
  );
}
