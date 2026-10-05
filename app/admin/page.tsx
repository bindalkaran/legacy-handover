import Link from 'next/link';
import { isAdmin, adminEnabled } from '@/lib/auth';
import { q, one, config } from '@/lib/db';
import { fmtDate, ago } from '@/lib/guard';
import { matchScore } from '@/lib/matching';
import { dealHealth, HEALTH_PILL } from '@/lib/deals';
import { DEAL_STAGES } from '@/lib/constants';
import { logout } from '@/app/actions/admin';
import { LoginForm, AdvanceOwner, ListingDecision, BuyerStage, Verification, ContactForm, MoveContact, DraftCard, Weights, CallbackDone, AppDecision } from './AdminClient';

export const metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const TABS = [['review', 'Owner review'], ['buyers', 'Acquirers'], ['crm', 'Outreach CRM'], ['match', 'Matching'], ['deals', 'Deal health'], ['inbox', 'Inbox'], ['analytics', 'Analytics'], ['config', 'Configuration']];
const ST_PILL: Record<string, string> = { New: 'p-grey', 'In review': 'p-gold', Verified: 'p-green', 'Profile approved': 'p-solid' };

export default async function Admin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  if (!(await isAdmin())) {
    return <main className="wrap-m col gap20" style={{ padding: '96px 24px', maxWidth: 520 }}><span className="eyebrow">Legacy Handover</span><h1 className="page-title">Admin console</h1><LoginForm enabled={adminEnabled()} /></main>;
  }
  const t = (await searchParams).tab;
  const tab = TABS.some((x) => x[0] === t) ? t! : 'review';
  const k = await one(`SELECT (SELECT count(*) FROM businesses)::int AS owners, (SELECT count(*) FROM assessments WHERE status = 'complete')::int AS done, (SELECT count(*) FROM assessments)::int AS started, (SELECT count(*) FROM payments WHERE status = 'paid' AND provider <> 'test')::int AS paid, (SELECT coalesce(sum(amount_paise),0) FROM payments WHERE status = 'paid' AND provider <> 'test')::bigint AS rev, (SELECT count(*) FROM buyer_profiles)::int AS buyers, (SELECT count(*) FROM buyer_profiles WHERE verification_stage >= 2)::int AS vbuyers, (SELECT count(*) FROM deals WHERE closed_at IS NULL)::int AS deals, (SELECT count(*) FROM businesses WHERE created_at > now() - interval '30 days')::int AS new30`);
  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ background: 'var(--dark)', color: 'var(--paper)' }}>
        <div className="row between" style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 28px', gap: 16 }}>
          <div className="row" style={{ alignItems: 'baseline', gap: 14 }}><Link href="/" className="serif" style={{ fontSize: 20, color: 'var(--paper)' }}>Legacy <em style={{ color: 'var(--gold-d)' }}>Handover</em></Link><span className="xs" style={{ color: 'var(--dis)', border: '1px solid var(--dark-r)', padding: '3px 8px' }}>Admin</span></div>
          <nav className="row" style={{ gap: 2, fontSize: 14 }}>{TABS.map(([key, l]) => <Link key={key} href={'/admin?tab=' + key} style={{ padding: '8px 14px', background: tab === key ? 'var(--paper)' : 'transparent', color: tab === key ? 'var(--ink)' : '#B8B2A5' }}>{l}</Link>)}<form action={logout}><button style={{ padding: '8px 14px', background: 'none', border: 0, color: '#B8B2A5' }}>Sign out</button></form></nav>
        </div>
      </header>
      <main className="col gap24" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 80px' }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10 }}>
          {[['Owners', k!.owners, `+${k!.new30} in 30 days`], ['Assessments complete', k!.done, k!.started ? `${Math.round((k!.done / k!.started) * 100)}% completion` : '—'], ['Paid reports', k!.paid, '₹' + (Number(k!.rev) / 100).toLocaleString('en-IN')], ['Acquirers', k!.buyers, `${k!.vbuyers} verified`], ['Active deals', k!.deals, 'workspaces open']].map(([t2, v, d]) => <div key={t2 as string} className="card col gap6" style={{ padding: 18 }}><span className="xs muted">{t2}</span><span className="big" style={{ fontSize: 34 }}>{v}</span><span className="xs" style={{ color: 'var(--green)' }}>{d}</span></div>)}
        </div>
        {tab === 'review' && <Review />}
        {tab === 'buyers' && <Buyers />}
        {tab === 'crm' && <Crm />}
        {tab === 'match' && <Match />}
        {tab === 'deals' && <Deals />}
        {tab === 'inbox' && <Inbox />}
        {tab === 'analytics' && <Analytics />}
        {tab === 'config' && <Config />}
      </main>
    </div>
  );
}

async function Review() {
  const rows = await q(`SELECT b.*, u.phone, u.email, u.name AS owner_name, s.transferability, s.readiness, s.independence FROM businesses b JOIN users u ON u.id = b.owner_id LEFT JOIN LATERAL (SELECT * FROM scores WHERE business_id = b.id ORDER BY created_at DESC LIMIT 1) s ON true ORDER BY b.created_at DESC LIMIT 200`);
  const pending = await q(`SELECT l.*, b.confidentiality_level FROM listings l LEFT JOIN businesses b ON b.id = l.business_id WHERE l.status = 'pending' ORDER BY l.updated_at`);
  return <>
    {pending.length > 0 && <div className="col gap10"><span className="eyebrow">Profiles awaiting review</span>{pending.map((l) => <div key={l.id} className="card col gap8"><div className="row between"><span className="serif" style={{ fontSize: 20 }}>{l.title}</span><ListingDecision id={l.id} /></div><span className="small t2">{l.industry} · {l.location} · {l.revenue_band} · {l.years} · Transferability {l.transferability_band}</span><span className="small">{l.description}</span><span className="xs muted">Deal note: {l.deal_note || '—'} · Owner visibility L{l.confidentiality_level}{l.confidentiality_level < 1 ? ' (must be ≥1 to publish)' : ''}</span></div>)}</div>}
    <div className="table">
      <div className="trow head" style={{ gridTemplateColumns: 'minmax(220px,2fr) repeat(3,minmax(70px,1fr)) minmax(120px,1fr) minmax(150px,1fr) 170px', minWidth: 1000 }}><span>Business</span><span>Transfer.</span><span>Readiness</span><span>Indep.</span><span>Status</span><span>Verification</span><span /></div>
      {rows.length === 0 && <div className="trow muted">No owners yet.</div>}
      {rows.map((o) => {
        const i = ['New', 'In review', 'Verified', 'Profile approved'].indexOf(o.review_status);
        return (
          <div key={o.id} className="trow" style={{ gridTemplateColumns: 'minmax(220px,2fr) repeat(3,minmax(70px,1fr)) minmax(120px,1fr) minmax(150px,1fr) 170px', minWidth: 1000 }}>
            <div className="col gap4"><span style={{ fontWeight: 500 }}>{o.name || o.owner_name || o.phone || o.email}</span><span className="xs muted">{o.industry} · {o.city || o.state || '—'} · {o.revenue_band} · L{o.confidentiality_level} · {ago(o.created_at)}</span></div>
            <span className="tab">{o.transferability ?? '—'}</span><span className="tab">{o.readiness ?? '—'}</span><span className="tab">{o.independence ?? '—'}</span>
            <span className={'pill ' + ST_PILL[o.review_status]} style={{ justifySelf: 'start' }}>{o.review_status}</span>
            <Verification id={o.id} v={o.verification} />
            <span style={{ justifySelf: 'end' }}>{i < 3 && <AdvanceOwner id={o.id} label={['Start review', 'Mark verified', 'Approve profile'][i]} />}</span>
          </div>
        );
      })}
    </div>
  </>;
}

async function Buyers() {
  const rows = await q(`SELECT bp.*, u.name, u.phone, u.email, (SELECT count(*)::int FROM access_requests ar WHERE ar.buyer_id = u.id) AS reqs FROM buyer_profiles bp JOIN users u ON u.id = bp.user_id ORDER BY bp.created_at DESC LIMIT 200`);
  return (
    <div className="table">
      <div className="trow head" style={{ gridTemplateColumns: 'minmax(200px,2fr) minmax(140px,1fr) minmax(160px,1.4fr) 80px 190px', minWidth: 860 }}><span>Acquirer</span><span>Capital</span><span>Looking for</span><span>Requests</span><span>Verification</span></div>
      {rows.length === 0 && <div className="trow muted">No acquirers yet.</div>}
      {rows.map((b) => <div key={b.user_id} className="trow" style={{ gridTemplateColumns: 'minmax(200px,2fr) minmax(140px,1fr) minmax(160px,1.4fr) 80px 190px', minWidth: 860 }}><div className="col gap4"><span style={{ fontWeight: 500 }}>{b.name || b.phone || b.email}</span><span className="xs muted">{b.buyer_type} · {b.experience}</span></div><span className="small">{b.capital} · financing {b.financing}</span><span className="small">{(b.industries || []).join(', ')} · {b.involvement} · {b.timeline}</span><span>{b.reqs}</span><BuyerStage id={b.user_id} stage={b.verification_stage} /></div>)}
    </div>
  );
}

async function Crm() {
  const STAGES = ['Prospect', 'Contacted', 'Interested', 'Assessment started', 'Assessment complete', 'Paid plan', 'Succession mandate', 'Transaction'];
  const contacts = await q(`SELECT * FROM crm_contacts WHERE NOT suppressed ORDER BY updated_at DESC`);
  const drafts = await q(`SELECT d.*, c.name, c.company FROM outreach_drafts d JOIN crm_contacts c ON c.id = d.contact_id WHERE NOT c.suppressed ORDER BY (d.status = 'awaiting approval') DESC, d.created_at DESC LIMIT 20`);
  const callbacks = await q(`SELECT * FROM callbacks WHERE status = 'new' ORDER BY created_at DESC LIMIT 10`);
  return <>
    <ContactForm />
    {callbacks.length > 0 && <div className="notice">{callbacks.length} callback request{callbacks.length > 1 ? 's' : ''} from the website are waiting in Inbox.</div>}
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
      {STAGES.map((s) => { const items = contacts.filter((c) => c.stage === s); return (
        <div key={s} className="col gap8" style={{ background: 'var(--tint)', padding: 14 }}>
          <div className="row between small" style={{ padding: '2px 4px' }}><span style={{ fontWeight: 600 }}>{s}</span><span className="muted">{items.length}</span></div>
          {items.map((c) => <div key={c.id} className="col gap4" style={{ background: 'var(--card)', padding: 12, fontSize: 13.5 }}><span style={{ fontWeight: 500 }}>{c.name}</span><span className="xs muted">{[c.company, c.city, c.source].filter(Boolean).join(' · ')}</span><MoveContact id={c.id} /></div>)}
        </div>
      ); })}
    </div>
    <span className="eyebrow">Outreach drafts · human approval required</span>
    {drafts.length === 0 && <span className="small muted">Add a prospect to generate a neutral-language draft.</span>}
    {drafts.map((d) => <DraftCard key={d.id} d={d} />)}
  </>;
}

async function Match() {
  const listings = await q(`SELECT * FROM listings WHERE status = 'published'`);
  const buyers = await q(`SELECT bp.*, u.name FROM buyer_profiles bp JOIN users u ON u.id = bp.user_id WHERE bp.verification_stage >= 1`);
  const pairs = listings.flatMap((l) => buyers.map((b) => ({ l, b, ...matchScore(b, l as any) }))).filter((p) => p.score >= 50).sort((a, b) => b.score - a.score).slice(0, 40);
  return <div className="col gap10">
    {pairs.length === 0 && <div className="card small muted">No matches yet. Matches appear when published profiles and acquirer profiles overlap.</div>}
    {pairs.map((m, i) => <div key={i} className="card grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) auto', gap: 20, alignItems: 'center', padding: '18px 20px' }}>
      <div className="col gap4"><span className="xs" style={{ color: 'var(--gold)' }}>Business{m.l.is_sample ? ' · sample' : ''}</span><span style={{ fontWeight: 500 }}>{m.l.title}</span></div>
      <div className="col gap4"><span className="xs" style={{ color: 'var(--gold)' }}>Acquirer</span><span style={{ fontWeight: 500 }}>{m.b.name || m.b.buyer_type}, {m.b.capital}</span><span className="xs muted">{m.why.join(' · ')}</span></div>
      <span className="serif" style={{ fontSize: 28, color: 'var(--green)' }}>{m.score}</span>
    </div>)}
  </div>;
}

async function Deals() {
  const deals = await q(`SELECT d.*, b.name AS biz, l.title, u.name AS buyer FROM deals d JOIN businesses b ON b.id = d.business_id LEFT JOIN listings l ON l.id = d.listing_id JOIN users u ON u.id = d.buyer_id ORDER BY d.updated_at DESC LIMIT 100`);
  const rows = await Promise.all(deals.map(async (d) => ({ d, h: await dealHealth(d) })));
  return (
    <div className="table">
      {rows.length === 0 && <div className="trow muted">No deals yet.</div>}
      {rows.map(({ d, h }) => <Link key={d.id} href={'/deals/' + d.id} className="trow" style={{ gridTemplateColumns: 'minmax(220px,2fr) minmax(130px,1fr) minmax(130px,1fr) minmax(220px,2fr)', minWidth: 760 }}><span style={{ fontWeight: 500 }}>{(d.biz || d.title) + ' × ' + (d.buyer || 'acquirer')}</span><span className="muted">{DEAL_STAGES[d.stage]}</span><span className={'pill ' + HEALTH_PILL[h.status]} style={{ justifySelf: 'start' }}>{h.status}</span><span className="small t2">{h.why}</span></Link>)}
    </div>
  );
}

async function Inbox() {
  const cbs = await q(`SELECT * FROM callbacks ORDER BY created_at DESC LIMIT 50`);
  const apps = await q(`SELECT * FROM professional_applications ORDER BY created_at DESC`);
  return <div className="grid g-auto-420" style={{ gap: 20, alignItems: 'start' }}>
    <div className="card col gap8"><span style={{ fontWeight: 600 }}>Callback requests</span>{cbs.length === 0 && <span className="small muted">None yet.</span>}{cbs.map((c) => <div key={c.id} className="row between rule-tl small" style={{ paddingTop: 8, opacity: c.status === 'done' ? .5 : 1 }}><span>{c.name} · <a href={'https://wa.me/' + String(c.phone).replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')} target="_blank" rel="noopener" className="link-u">{c.phone}</a> · {ago(c.created_at)}</span><CallbackDone id={c.id} status={c.status} /></div>)}</div>
    <div className="card col gap8"><span style={{ fontWeight: 600 }}>Professional applications</span>{apps.length === 0 && <span className="small muted">None yet.</span>}{apps.map((a) => <div key={a.id} className="row between rule-tl small" style={{ paddingTop: 8 }}><span>{a.name} · {a.firm} · {a.pro_type} · {a.city} · {a.contact}</span><AppDecision id={a.id} /></div>)}</div>
  </div>;
}

async function Analytics() {
  const ev = await q(`SELECT name, count(*)::int AS c, count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS w FROM analytics_events GROUP BY name ORDER BY c DESC`);
  const funnel = ['assessment_started', 'assessment_completed', 'account_created', 'report_viewed', 'report_paid', 'task_completed', 'business_profile_started', 'buyer_registered', 'access_requested', 'access_approved', 'nda_signed', 'offer_submitted', 'deal_closed'];
  const get = (n: string) => ev.find((e) => e.name === n) || { c: 0, w: 0 };
  const max = Math.max(1, ...funnel.map((f) => get(f).c));
  return <div className="card col gap10" style={{ maxWidth: 820 }}>
    <span style={{ fontWeight: 600 }}>Funnel · all time (last 7 days)</span>
    {funnel.map((f) => <div key={f} className="grid" style={{ gridTemplateColumns: '220px 1fr 90px', gap: 12, alignItems: 'center', fontSize: 13.5 }}><span>{f.replace(/_/g, ' ')}</span><div className="bar" style={{ height: 8 }}><i style={{ width: (get(f).c / max) * 100 + '%' }} /></div><span className="tab" style={{ textAlign: 'right' }}>{get(f).c} ({get(f).w})</span></div>)}
  </div>;
}

async function Config() {
  const version = await config<string>('active_score_version', 'score-v1.0');
  const row = await one(`SELECT weights FROM score_versions WHERE version = $1`, [version]);
  const versions = await q(`SELECT version, created_at, created_by FROM score_versions ORDER BY created_at DESC`);
  return <div className="grid g-auto-420" style={{ gap: 20, alignItems: 'start' }}>
    <Weights initial={row!.weights} version={version} />
    <div className="col gap12">
      <div className="card col gap6"><span style={{ fontWeight: 600 }}>Score versions</span>{versions.map((v) => <span key={v.version} className="row between small rule-tl" style={{ paddingTop: 6 }}><span>{v.version}{v.version === version ? ' · active' : ''}</span><span className="muted">{fmtDate(v.created_at)} · {v.created_by}</span></span>)}</div>
      <div className="card col gap6"><span style={{ fontWeight: 600 }}>Integrations</span>{[['OTP by SMS (MSG91)', !!process.env.MSG91_AUTH_KEY], ['OTP by email (Resend)', !!process.env.RESEND_API_KEY], ['Payments (Razorpay)', !!process.env.RAZORPAY_KEY_ID], ['AI narrative (Anthropic)', !!process.env.ANTHROPIC_API_KEY], ['Dedicated session secret', !!process.env.SESSION_SECRET]].map(([k, on]) => <span key={k as string} className="row between small rule-tl" style={{ paddingTop: 6 }}><span>{k}</span><span style={{ color: on ? 'var(--green)' : 'var(--warn)' }}>{on ? 'Configured' : 'Not configured'}</span></span>)}</div>
    </div>
  </div>;
}
