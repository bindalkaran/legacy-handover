import Link from 'next/link';
import { requireUser, ago } from '@/lib/guard';
import { q, one, config } from '@/lib/db';
import { matchScore } from '@/lib/matching';
import { BUYER_STAGES } from '@/lib/constants';
import { nextStep } from '@/lib/deals';
import Shell from '@/components/Shell';
import { RequestButton } from '@/components/BuyerClient';

export const metadata = { title: 'Acquirer dashboard', robots: { index: false } };
export const dynamic = 'force-dynamic';

const T: Record<string, string> = { home: 'Your acquisition dashboard', matches: 'Your matches', requests: 'Access requests', deals: 'Active deals', searches: 'Saved searches' };

function dealStageIdx(stage: number, ndaDone: boolean) {
  // map 13-stage deal lifecycle onto the 6 buyer stages
  if (stage >= 7) return 5; if (stage >= 6) return 4; if (stage >= 5) return 3; if (ndaDone || stage >= 3) return 2; return 1;
}

export default async function Acquirer({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requireUser('/acquirer');
  const view = ((await searchParams).view || 'home') as string;
  const v = view in T ? view : 'home';
  const profile = await one(`SELECT * FROM buyer_profiles WHERE user_id = $1`, [user.id]);
  if (!profile) {
    return (
      <main className="wrap-m col gap24" style={{ padding: '80px 24px', maxWidth: 720 }}>
        <span className="eyebrow">Acquirer</span>
        <h1 className="h1">Create your acquirer profile to see matches.</h1>
        <p className="t2" style={{ fontSize: 16 }}>Three short steps: who you are, your capital and financing, and what you&rsquo;re looking for. Owners see this when you request access.</p>
        <div className="row gap12"><Link href="/acquire" className="btn btn-green btn-lg">Create acquirer profile →</Link><form action="/api/sign-out" method="post"><button className="btn btn-ghost">Sign out</button></form></div>
      </main>
    );
  }
  const showSamples = await config<boolean>('show_samples', true);
  const listings = await q(`SELECT * FROM listings WHERE status = 'published' ${showSamples ? '' : 'AND NOT is_sample'}`);
  const requests = await q(`SELECT ar.*, l.title, l.is_sample, (SELECT d.id FROM deals d WHERE d.listing_id = ar.listing_id AND d.buyer_id = ar.buyer_id ORDER BY d.created_at DESC LIMIT 1) AS deal_id FROM access_requests ar JOIN listings l ON l.id = ar.listing_id WHERE ar.buyer_id = $1 ORDER BY ar.created_at DESC`, [user.id]);
  const reqIds = new Set(requests.map((r) => r.listing_id));
  const matches = listings.map((l) => ({ l, ...matchScore({ ...profile, industries: profile.industries }, l as any) })).filter((m) => m.score >= 40).sort((a, b) => b.score - a.score);
  const deals = await q(`SELECT d.*, l.title, (SELECT count(*)::int FROM documents x WHERE x.business_id = d.business_id AND x.level <= d.buyer_max_level AND x.permission <> 'Hidden') AS docs, (SELECT count(*)::int FROM deal_questions dq WHERE dq.deal_id = d.id AND dq.answer IS NULL) AS openq FROM deals d LEFT JOIN listings l ON l.id = d.listing_id WHERE d.buyer_id = $1 ORDER BY d.created_at DESC`, [user.id]);
  const searches = await q(`SELECT * FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC`, [user.id]);
  const vs = profile.verification_stage as number;
  const nav = [['home', 'Dashboard', ''], ['matches', 'Matches', matches.length], ['requests', 'My requests', requests.length], ['deals', 'My deals', deals.length], ['searches', 'Saved searches', searches.length]].map(([k, l, b]) => ({ href: '/acquirer' + (k === 'home' ? '' : '?view=' + k), label: String(l), badge: b || undefined, on: v === k }));
  const extra = [{ href: '/acquire', label: 'Explore businesses' }, { href: '/professionals', label: 'Professionals' }, { href: '/settings', label: 'Settings' }];
  const footer = (
    <div className="col gap8 small rule-tl" style={{ paddingTop: 16 }}>
      <span className="muted">Verification</span>
      {['Profile complete', 'Identity verified', 'Financially verified', 'Qualified'].map((t, i) => <span key={t} className="row gap8" style={{ color: vs > i ? 'var(--green)' : 'var(--dis)' }}><span>{vs > i ? '✓' : '○'}</span>{t}</span>)}
    </div>
  );
  const capLine = `Capital ${profile.capital || '—'} · ${(profile.industries || []).join(', ') || 'Open'} · ${profile.involvement || '—'}`;
  const showMatches = v === 'home' || v === 'matches';
  const showReq = v === 'home' || v === 'requests';
  return (
    <Shell variant="line" nav={nav} extra={extra} footer={footer}>
      <div className="row between rule-b" style={{ alignItems: 'flex-end', gap: 20, paddingBottom: 20 }}>
        <h1 className="page-title">{T[v]}</h1>
        <span className="muted" style={{ fontSize: 13.5 }}>{capLine} · <Link href="/acquire" className="link-u">Edit</Link></span>
      </div>
      {v === 'home' && (
        <div className="grid g-auto-160" style={{ gap: 0, borderTop: '1px solid var(--ink)', borderLeft: '1px solid var(--ink)' }}>
          {[['Matching opportunities', matches.length], ['Access requests', requests.length], ['Active deals', deals.filter((d) => !d.closed_at).length], ['Open questions', deals.reduce((a, d) => a + d.openq, 0)]].map(([k, n]) => (
            <div key={k} className="col gap6" style={{ padding: 20, borderRight: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)' }}><span className="xs muted">{k}</span><span className="big" style={{ fontSize: 40 }}>{n}</span></div>
          ))}
        </div>
      )}
      {showMatches && (
        <div className="col gap12">
          <span className="eyebrow">Matches · why they fit</span>
          {matches.length === 0 && <div className="card small muted">No matches yet. Broaden your industries or capital in your profile; new profiles that fit appear here after our review.</div>}
          {(v === 'home' ? matches.slice(0, 4) : matches).map((m) => (
            <div key={m.l.id} className="card grid" style={{ gridTemplateColumns: 'auto minmax(0,1fr) auto', gap: 22, alignItems: 'center', padding: '20px 22px' }}>
              <span className="big" style={{ fontSize: 40, color: 'var(--green)', minWidth: 56 }}>{m.score}</span>
              <div className="col gap6" style={{ minWidth: 0 }}>
                <span className="serif" style={{ fontSize: 21 }}>{m.l.title}</span>
                <span className="t2" style={{ fontSize: 13.5 }}>{m.l.location} · {m.l.revenue_band} · {m.l.years} · Transferability {m.l.transferability_band}</span>
                <div className="row gap6">{m.why.map((w) => <span key={w} className="xs" style={{ border: '1px solid var(--rule-l)', padding: '4px 9px' }}>{w}</span>)}</div>
              </div>
              <RequestButton id={m.l.id} requested={reqIds.has(m.l.id)} sample={m.l.is_sample} />
            </div>
          ))}
        </div>
      )}
      {showReq && (
        <div className="col gap12">
          <span className="eyebrow">Access requests</span>
          <div className="table">
            {requests.length === 0 && <div className="trow muted">No requests yet.</div>}
            {requests.map((r) => (
              <div key={r.id} className="trow" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(100px,150px) minmax(140px,180px)' }}>
                <span>{r.title}</span><span className="xs muted">Sent {ago(r.created_at)}</span>
                {r.status === 'Approved' && r.deal_id
                  ? <Link href={'/deals/' + r.deal_id} className="pill p-green" style={{ justifySelf: 'start' }}>Approved · open workspace →</Link>
                  : <span className={'pill ' + (r.status === 'Approved' ? 'p-green' : r.status === 'Declined' ? 'p-grey' : 'p-gold')} style={{ justifySelf: 'start' }}>{r.status === 'Approved' ? 'Approved · workspace opening' : r.status === 'Declined' ? 'Declined by owner' : 'Owner reviewing'}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {v === 'deals' && (
        <div className="grid g-auto-300" style={{ gap: 14 }}>
          {deals.length === 0 && <div className="card small muted">No active deals. A workspace opens when an owner approves your request.</div>}
          {deals.map((d) => {
            const nda = !!(d.nda_owner_at && d.nda_buyer_at);
            const si = dealStageIdx(d.stage, nda);
            return (
              <div key={d.id} className="card col gap14">
                <span className="serif" style={{ fontSize: 22 }}>{d.title || 'Deal ' + d.ref}</span>
                <div className="row gap4" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>{BUYER_STAGES.map((s, i) => <div key={s} className="col gap6" style={{ flex: 1 }}><div style={{ height: 6, background: i < si ? 'var(--green)' : i === si ? 'var(--gold)' : 'var(--rule-l)' }} /><span style={{ fontSize: 10.5, lineHeight: 1.3, color: i <= si ? 'var(--ink)' : 'var(--dis)' }}>{s}</span></div>)}</div>
                <span className="small" style={{ color: 'var(--green)' }}>Next step: {nextStep(d, 'buyer', nda)}</span>
                <div className="row gap8 xs muted rule-tl" style={{ paddingTop: 12 }}><span>{d.nda_owner_at && d.nda_buyer_at ? 'NDA signed' : 'NDA pending'}</span><span>·</span><span>{d.docs} documents</span><span>·</span><span>{d.openq} open questions</span></div>
                <Link href={'/deals/' + d.id} className="btn btn-sm" style={{ alignSelf: 'flex-start' }}>Open workspace →</Link>
              </div>
            );
          })}
        </div>
      )}
      {v === 'searches' && (
        <div className="col gap10">
          {searches.length === 0 && <div className="card small muted">No saved searches. Use &ldquo;Save this search&rdquo; on the explore page.</div>}
          {searches.map((s) => (
            <div key={s.id} className="card row between" style={{ gap: 14 }}>
              <div className="col gap4"><span className="serif" style={{ fontSize: 20 }}>{s.label}</span><span className="small muted">{listings.filter((l) => (s.filters.industry === 'All' || l.industry === s.filters.industry) && (!s.filters.intl || l.open_international)).length} matching now</span></div>
            </div>
          ))}
          <span className="xs muted">Each saved search shows how many current profiles match it. Check back here, or on the explore page, for new opportunities.</span>
        </div>
      )}
    </Shell>
  );
}
