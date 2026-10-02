import { fmtDate } from '@/lib/guard';

const cr = (n: any) => (n == null ? '—' : '₹' + Number(n) + ' Cr');

export default function PassportView({ data, sections }: { data: any; sections: string[] }) {
  const { b, history, latest, docs, docTotal, docTarget, tasks, deal, offer, timeline, trDone } = data;
  const has = (s: string) => sections.includes(s);
  const days = deal?.closed_at ? Math.floor((Date.now() - new Date(deal.closed_at).getTime()) / 864e5) : null;
  const status = deal?.closed_at ? `Transition, day ${Math.min(90, days!)} of 90` : deal ? 'In a deal workspace' : b.lifecycle === 'Assessment' ? 'Preparing' : b.lifecycle;
  const blocks: [string, string, [string, string][]][] = [
    ['Identity', 'Ownership', [['Owner', b.owner_name || 'Owner'], ['Structure', latest?.labels?.structure || '—'], ...(deal?.closed_at ? [['Transferred', fmtDate(deal.closed_at)] as [string, string]] : [])]],
    ['Financial profile', 'Financial profile', [['Revenue band', b.revenue_band || '—'], ['Est. EBITDA', latest ? cr(latest.profit) : '—'], ['Employees', b.employees_band || '—']]],
    ['Scores', 'Readiness', [['Tasks complete', tasks ? `${tasks.done} of ${tasks.total}` : '—'], ['Transferability', latest ? String(latest.transferability) : '—'], ['Independence', latest ? String(latest.independence) : '—']]],
    ['Valuation history', 'Valuation history', [...history.filter((h: any) => h.value_low).slice(-2).map((h: any) => [fmtDate(h.created_at) + ' indicative', `₹${Number(h.value_low)}–${Number(h.value_high)} Cr`] as [string, string]), ...(offer ? [['Accepted offer', cr(Number(offer.equity) + Number(offer.debt) + Number(offer.seller_financing) + Number(offer.earn_out))] as [string, string]] : [])]],
    ['Documents', 'Documents', [['In data room', String(docTotal)], ['Typical set', String(docTarget)], ['Categories covered', `${docs.length} of 5`]]],
    ['Transition status', 'Transition', [['Status', status], ['Checklist items done', String(trDone)], ['Deal reference', deal?.ref || '—']]]
  ];
  return (
    <div className="col" style={{ gap: 36 }}>
      <section className="grid g-auto-420 rule-b" style={{ gap: 40, alignItems: 'end', paddingBottom: 36 }}>
        <div className="col gap14">
          <span className="eyebrow">Succession Passport · digital transfer record</span>
          <h1 className="h1">{has('Identity') ? b.name || 'Your business' : (latest?.labels?.industry || 'Business') + ' business'}</h1>
          <span className="t2" style={{ fontSize: 15 }}>{[b.industry, has('Identity') ? [b.city, b.state].filter(Boolean).join(', ') : b.state, b.years_band ? b.years_band + ' yrs operating' : null, has('Identity') ? b.legal_name : null].filter(Boolean).join(' · ')}</span>
          <div className="row gap8" style={{ fontSize: 12.5 }}><span className="pill p-solid" style={{ padding: '5px 10px' }}>Status · {status}</span><span className="pill p-line" style={{ padding: '5px 10px' }}>Passport ID LH-P-{String(b.id).slice(0, 6).toUpperCase()}</span><span className="pill p-line" style={{ padding: '5px 10px' }}>Updated {fmtDate(b.updated_at)}</span></div>
        </div>
        <div className="photo" style={{ aspectRatio: '16/10' }}><span>The business premises (owner&rsquo;s choice)</span></div>
      </section>
      <section className="grid g-auto-300" style={{ gap: 0, borderTop: '1px solid var(--ink)', borderLeft: '1px solid var(--ink)' }}>
        {blocks.filter(([s]) => has(s)).map(([, t, rows]) => (
          <div key={t} className="col gap10" style={{ borderRight: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)', padding: 22, background: 'var(--card)' }}>
            <span className="eyebrow">{t}</span>
            {rows.length === 0 && <span className="small muted">Nothing recorded yet.</span>}
            {rows.map(([k, v]) => <div key={k} className="row between rule-tl" style={{ fontSize: 14, paddingTop: 8, flexWrap: 'nowrap', gap: 12 }}><span className="muted">{k}</span><span style={{ textAlign: 'right' }}>{v}</span></div>)}
          </div>
        ))}
      </section>
      <section className="grid g-auto-420" style={{ gap: 24 }}>
        {has('Scores') && (
          <div className="col gap14">
            <span className="eyebrow">Score history</span>
            <div className="card col gap12" style={{ padding: 20 }}>
              {history.map((h: any, i: number) => (
                <div key={i} className="grid" style={{ gridTemplateColumns: '90px repeat(3,minmax(0,1fr))', gap: 10, alignItems: 'center', fontSize: 13 }}>
                  <span className="muted">{fmtDate(h.created_at)}</span>
                  {([['T', h.transferability, 'var(--green)'], ['R', h.readiness, 'var(--green)'], ['I', h.independence, 'var(--gold)']] as const).map(([k, v, c]) => <div key={k} className="col gap4"><div style={{ height: 5, background: 'var(--tint)' }}><div style={{ height: '100%', width: v + '%', background: c }} /></div><span>{k} {v}</span></div>)}
                </div>
              ))}
              <span className="xs muted">T Transferability · R Succession Readiness · I Business Independence · each point stamped with its score version ({latest?.score_version}).</span>
            </div>
          </div>
        )}
        {has('Transition status') && (
          <div className="col gap14">
            <span className="eyebrow">Transfer timeline</span>
            <div className="col gap16" style={{ borderLeft: '1px solid var(--ink)', paddingLeft: 20 }}>
              {timeline.length === 0 && <span className="small muted">No milestones yet.</span>}
              {timeline.map((t: any, i: number) => <div key={i} className="col gap4" style={{ position: 'relative' }}><span style={{ position: 'absolute', left: -25, top: 5, width: 9, height: 9, borderRadius: '50%', background: 'var(--green)' }} /><span className="xs muted">{fmtDate(t.created_at)}</span><span style={{ fontSize: 14.5 }}>{t.action}</span></div>)}
            </div>
          </div>
        )}
      </section>
      <span className="xs muted" style={{ lineHeight: 1.6 }}>The Succession Passport is a record of information provided by the owner and activity on the platform. It is not a certified valuation, audit or legal title document.</span>
    </div>
  );
}
