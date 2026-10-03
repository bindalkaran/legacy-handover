import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { fmtDate, ago } from '@/lib/guard';
import { currentUser, isAdmin } from '@/lib/auth';
import { q, one } from '@/lib/db';
import { loadDeal, loadDealForAdmin, dealHealth, ndaDone, nextStep, HEALTH_PILL, type ViewSide } from '@/lib/deals';
import { DEAL_STAGES, DOC_CATEGORIES, CLOSING_ITEMS, TRANSITION_PHASES, TRANSITION_KEYS, HANDOVER_CATS, LENDERS, SELLER_INSTALMENTS, AI_OBS_LABEL, RULES_OBS_LABEL } from '@/lib/constants';
import Wordmark from '@/components/Wordmark';
import { DocUpload } from '@/components/owner/OwnerClient';
import { SignNda, GrantDiligence, StagePicker, PermButton, AskForm, AnswerForm, Assistant, OfferActions, ClarifyReply, OfferForm, ReferralButton, CheckItem, Instalments, EarnoutForm, EarnoutProgress, FinancingFields } from '@/components/deal/DealClient';

export const metadata = { title: 'Deal workspace', robots: { index: false } };
export const dynamic = 'force-dynamic';

const TABS = [['overview', 'Overview'], ['parties', 'Parties'], ['nda', 'NDA'], ['room', 'Data room'], ['qa', 'Questions & AI'], ['offers', 'Offers'], ['financing', 'Financing'], ['closing', 'Closing'], ['transition', 'Transition'], ['activity', 'Activity']];
const cr = (n: number) => '₹' + Number(n).toFixed(2) + ' Cr';

export default async function DealPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; cat?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await currentUser();
  let r: { deal: any; side: ViewSide } | null = user ? await loadDeal(id, user) : null;
  // Admin console (passphrase session) gets a read-only view. Server actions still require a deal party.
  if (!r && (await isAdmin())) r = await loadDealForAdmin(id);
  if (!r && !user) redirect('/sign-in?next=' + encodeURIComponent('/deals/' + id));
  if (!r) notFound();
  const { deal: d, side } = r;
  const party = side === 'owner' || side === 'buyer';
  const tab = TABS.some((t) => t[0] === sp.tab) ? sp.tab! : 'overview';
  const nda = ndaDone(d);
  const seller = side !== 'buyer';
  const health = await dealHealth(d);
  const buyer = await one(`SELECT u.name, u.city, bp.* FROM users u LEFT JOIN buyer_profiles bp ON bp.user_id = u.id WHERE u.id = $1`, [d.buyer_id]);
  const owner = await one(`SELECT name FROM users WHERE id = $1`, [d.owner_id]);
  const title = seller ? (d.biz_name || 'Your business') : nda ? (d.biz_name || d.listing_title) : (d.listing_title || 'Confidential business');
  const counterpart = seller ? `With acquirer · ${buyer?.name || buyer?.buyer_type || 'Verified acquirer'}` : nda ? 'Business · identity shared under NDA' : 'Business · identity revealed after NDA';
  const backHref = side === 'owner' ? '/dashboard?view=opportunities' : side === 'buyer' ? '/acquirer?view=deals' : side === 'admin' ? '/admin?tab=deals' : '/advisor';
  const scoreRow = await one(`SELECT transferability, value_low, value_high, labels, score_version FROM scores WHERE business_id = $1 ORDER BY created_at DESC LIMIT 1`, [d.business_id]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="rule-b">
        <div className="wrap row between" style={{ padding: '14px 28px', gap: '12px 24px' }}>
          <div className="row" style={{ alignItems: 'baseline', gap: 16 }}><Wordmark size={22} /><span className="small muted">Deal workspace · {d.ref}</span></div>
          <div className="row gap12"><span className="xs muted">Viewing as {side === 'owner' ? 'Owner' : side === 'buyer' ? 'Acquirer' : side === 'admin' ? 'Admin (read only)' : 'Owner’s advisor'}</span><Link href={backHref} className="link-u" style={{ fontSize: 13.5 }}>← Back to {side === 'admin' ? 'admin' : 'dashboard'}</Link></div>
        </div>
      </header>
      <section className="rule-b">
        <div className="wrap col gap20" style={{ paddingTop: 28 }}>
          <div className="row between" style={{ alignItems: 'flex-end', gap: 20 }}>
            <div className="col gap6"><span className="eyebrow">{counterpart}</span><h1 className="page-title" style={{ fontSize: 'clamp(28px,3.4vw,42px)' }}>{title}</h1></div>
            <div className="row gap10"><span className={'pill ' + HEALTH_PILL[health.status]} style={{ padding: '6px 12px' }}>Deal health · {health.status}</span><span className="pill p-line" style={{ padding: '6px 12px' }}>Stage · {DEAL_STAGES[d.stage]}</span></div>
          </div>
          <nav className="tabs" style={{ margin: '0 -28px', padding: '0 28px' }}>{TABS.map(([k, l]) => <Link key={k} href={`/deals/${d.id}?tab=${k}`} className={tab === k ? 'on' : ''}>{l}</Link>)}</nav>
        </div>
      </section>
      <main className="wrap col" style={{ paddingTop: 32, paddingBottom: 96, width: '100%', gap: 28 }}>
        {side === 'admin' && <div className="notice">Admin read-only view. Nothing can be changed from here, and documents cannot be opened.</div>}
        {tab === 'overview' && <>
          <div className="col gap12">
            <span className="eyebrow">Deal lifecycle</span>
            <div className="row" style={{ gap: 3, overflowX: 'auto', paddingBottom: 4, flexWrap: 'nowrap', alignItems: 'flex-start' }}>
              {DEAL_STAGES.map((s, i) => <div key={s} className="col gap6" style={{ flex: '1 0 82px' }}><div style={{ height: 6, background: i < d.stage ? 'var(--green)' : i === d.stage ? 'var(--gold)' : 'var(--rule-l)' }} /><span style={{ fontSize: 11, lineHeight: 1.3, color: i <= d.stage ? 'var(--ink)' : 'var(--dis)' }}>{s}</span></div>)}
            </div>
            <div className="row between"><span className="xs muted">Platform workflow stages are not a legal completion of the transaction.</span>{side === 'owner' && <StagePicker dealId={d.id} stage={d.stage} />}</div>
          </div>
          <div className="grid g-auto-300">
            <div className="panel-green col gap14">
              <span className="eyebrow" style={{ color: 'var(--gold-d)' }}>Next step</span>
              <span className="serif" style={{ fontSize: 24, lineHeight: 1.25 }}>{nextStep(d, side, nda)}</span>
            </div>
            <div className="card col gap12" style={{ padding: 26 }}>
              <span style={{ fontWeight: 600 }}>Deal health factors</span>
              {health.factors.map(([k, v, ok]) => <div key={k} className="row between rule-tl" style={{ fontSize: 14, paddingTop: 9 }}><span>{k}</span><span style={{ color: ok ? 'var(--green)' : 'var(--warn)' }}>{v}</span></div>)}
            </div>
            <div className="card col gap12" style={{ padding: 26 }}>
              <span style={{ fontWeight: 600 }}>At a glance</span>
              {[['Industry', scoreRow?.labels?.industry || d.biz_industry], ['Revenue band', scoreRow?.labels?.revenue], ['Transferability', scoreRow ? `${scoreRow.transferability} · ${scoreRow.score_version}` : '—'], ['Indicative range', scoreRow?.value_low ? `₹${Number(scoreRow.value_low)}–${Number(scoreRow.value_high)} Cr` : '—'], ['Workspace opened', fmtDate(d.created_at)]].map(([k, v]) => <div key={k} className="row between rule-tl" style={{ fontSize: 14, paddingTop: 9 }}><span className="muted">{k}</span><span>{v || '—'}</span></div>)}
              <span className="xs muted">Owner-supplied and platform-calculated. Verify in diligence.</span>
            </div>
          </div>
        </>}

        {tab === 'parties' && <PartiesTab d={d} buyer={buyer} owner={owner} nda={nda} side={side} />}

        {tab === 'nda' && (
          <div className="grid g-auto-420" style={{ gap: 20 }}>
            <div className="card col gap14" style={{ padding: 28 }}>
              <div className="row between"><span className="serif" style={{ fontSize: 24 }}>Mutual NDA · template v2.1</span><span className={'pill ' + (nda ? 'p-green' : 'p-gold')}>{nda ? 'Fully executed' : d.nda_owner_at ? 'Awaiting acquirer' : d.nda_buyer_at ? 'Awaiting owner' : 'Awaiting signatures'}</span></div>
              <div className="t2" style={{ background: 'var(--paper)', padding: 18, fontSize: 13.5, lineHeight: 1.7, maxHeight: 260, overflow: 'auto' }}>
                This Mutual Non-Disclosure Agreement is entered into between the Owner of the business referenced as {d.ref} (&ldquo;Disclosing Party&rdquo;) and the Acquirer named in this workspace (&ldquo;Receiving Party&rdquo;). The Receiving Party shall use Confidential Information solely to evaluate a potential transaction; shall not contact employees, customers, suppliers or lenders of the business without the Owner&rsquo;s written consent; shall not disclose Confidential Information except to its professional advisors and financiers bound by equivalent obligations; and shall return or destroy all materials on request. Confidential Information excludes information that is public, already known to the Receiving Party, or independently developed. Neither party is obliged to proceed with any transaction. This agreement is governed by the laws of India and remains in force for 24 months from the date of the last signature. This template is provided for convenience; parties should have it reviewed by their own counsel.
              </div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13.5 }}>
                {[['Owner', d.nda_owner_at ? 'Signed · ' + fmtDate(d.nda_owner_at) : 'Pending'], ['Acquirer', d.nda_buyer_at ? 'Signed · ' + fmtDate(d.nda_buyer_at) : 'Pending'], ['Expires', nda ? fmtDate(new Date(new Date(d.nda_buyer_at > d.nda_owner_at ? d.nda_buyer_at : d.nda_owner_at).getTime() + 730 * 864e5)) : '24 months after signing'], ['Unlocks', 'Level 3 data room']].map(([k, v]) => <div key={k} className="col gap4"><span className="muted">{k}</span><span>{v}</span></div>)}
              </div>
              {((side === 'owner' && !d.nda_owner_at) || (side === 'buyer' && !d.nda_buyer_at)) && <SignNda dealId={d.id} label="Sign electronically" />}
              <span className="xs muted">Electronic acceptance is recorded with your account and time. Aadhaar eSign can be added when an e-sign provider is connected.</span>
            </div>
            <div className="col gap12">
              <span className="eyebrow">What the NDA unlocks</span>
              {['Business name and location', 'Level 3 documents in the data room', 'Direct questions to the owner', 'Ability to request Level 4 access'].map((t) => <div key={t} className="row" style={{ gap: 12, padding: '14px 16px', border: '1px solid var(--rule-l)', background: 'var(--card)', fontSize: 14, flexWrap: 'nowrap' }}><span style={{ width: 18, color: nda ? 'var(--green)' : 'var(--dis)' }}>{nda ? '✓' : '○'}</span>{t}</div>)}
              {side === 'owner' && nda && d.buyer_max_level < 4 && <div className="card col gap10"><span className="small">The acquirer can currently see Level {d.buyer_max_level} documents.</span><GrantDiligence dealId={d.id} /></div>}
            </div>
          </div>
        )}

        {tab === 'room' && <RoomTab d={d} side={side} cat={sp.cat} />}

        {tab === 'qa' && <QaTab d={d} side={side} />}

        {tab === 'offers' && <OffersTab d={d} side={side} nda={nda} />}

        {tab === 'financing' && <FinancingTab d={d} side={side} />}

        {tab === 'closing' && <ClosingTab d={d} side={side} />}

        {tab === 'transition' && <TransitionTab d={d} side={side} />}

        {tab === 'activity' && <ActivityTab d={d} />}
      </main>
    </div>
  );
}

async function PartiesTab({ d, buyer, owner, nda, side }: any) {
  const advisors = await q(`SELECT u.name, u.firm, al.invited_contact FROM advisor_links al LEFT JOIN users u ON u.id = al.advisor_user_id WHERE al.business_id = $1 AND al.status = 'active'`, [d.business_id]);
  const rows: [string, string, string, string][] = [
    ['Owner', side === 'buyer' && !nda ? 'Owner (identity after NDA)' : owner?.name || 'Owner', 'Founder / shareholder', 'Full'],
    ...advisors.map((a: any) => ['Owner side', side === 'buyer' && !nda ? 'Advisor' : a.name || a.invited_contact, a.firm || 'Advisor', 'Scores, tasks, documents (view)'] as [string, string, string, string]),
    ['Acquirer', buyer?.name || buyer?.buyer_type || 'Verified acquirer', `${buyer?.buyer_type || 'Acquirer'} · ${['Registered', 'Profile complete', 'Identity verified', 'Financially verified', 'Qualified'][buyer?.verification_stage ?? 1]}`, `Level ${d.buyer_max_level}${d.buyer_max_level >= 4 ? ' · diligence' : ''}`]
  ];
  return <>
    <div className="grid g-auto-260" style={{ gap: 12 }}>
      {rows.map(([s, n, r, a], i) => <div key={i} className="card col gap8" style={{ padding: 20 }}><span className="eyebrow">{s}</span><span className="serif" style={{ fontSize: 21 }}>{n}</span><span className="t2" style={{ fontSize: 13.5 }}>{r}</span><span className="xs muted rule-tl" style={{ paddingTop: 8 }}>Access: {a}</span></div>)}
    </div>
    <Link href="/professionals" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>+ Add a professional from the directory</Link>
  </>;
}

type DocRow = { id: string; category: string; name: string; ext: string; version: number; level: number; permission: string; views: number; downloads: number };

async function RoomTab({ d, side, cat }: { d: any; side: string; cat?: string }) {
  const c = DOC_CATEGORIES.includes(cat || '') ? cat! : 'Financial';
  const all: DocRow[] = await q(`SELECT id, category, name, ext, version, level, permission, views, downloads FROM documents WHERE business_id = $1 ORDER BY category, name, version DESC`, [d.business_id]);
  const isBuyer = side === 'buyer';
  // Buyers never receive names of hidden files or files above their access level; they get a count per category.
  const accessible = isBuyer ? all.filter((x) => x.permission !== 'Hidden' && x.level <= d.buyer_max_level) : all;
  const lockedCount = (k: string) => (isBuyer ? all.filter((x) => x.category === k && x.permission !== 'Hidden' && x.level > d.buyer_max_level).length : 0);
  // Group versions by name; the newest version is the row, older ones sit behind an expander.
  const groups = new Map<string, DocRow[]>();
  for (const x of accessible.filter((x) => x.category === c)) { const key = x.name; groups.set(key, [...(groups.get(key) || []), x]); }
  const rows = [...groups.values()].map((vs) => vs.sort((a, b) => b.version - a.version));
  const latestCount = (k: string) => new Set(accessible.filter((x) => x.category === k).map((x) => x.name)).size;
  const locked = lockedCount(c);
  const unlockHint = d.buyer_max_level < 3 ? 'after the NDA is signed by both parties' : 'when the owner grants due diligence access';
  const cols = 'minmax(200px,2fr) 60px minmax(110px,1fr) minmax(130px,1fr) minmax(110px,1fr)';
  const docCell = (x: DocRow) => side === 'admin' ? <span>{x.name}</span> : <a href={`/api/documents/${x.id}`} target="_blank" rel="noopener">{x.name}</a>;
  const ai = false; // observations below are computed from the index, not by a model
  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: 24 }}>
      <div className="col gap4" style={{ flex: '1 1 220px', maxWidth: '100%' }}>
        {DOC_CATEGORIES.map((k) => <Link key={k} href={`/deals/${d.id}?tab=room&cat=${k}`} className="row between" style={{ padding: '11px 14px', fontSize: 14, background: k === c ? 'var(--ink)' : 'transparent', color: k === c ? 'var(--paper)' : 'var(--ink)' }}>{k}<span className="xs" style={{ opacity: .75 }}>{latestCount(k)}{lockedCount(k) ? ` + ${lockedCount(k)} locked` : ''}</span></Link>)}
        <div className="t2" style={{ marginTop: 16, padding: 14, border: '1px solid var(--rule-l)', fontSize: 12.5, lineHeight: 1.7 }}>Views and downloads are logged with the viewer&rsquo;s account. The owner controls each file&rsquo;s permission and can revoke access instantly.</div>
      </div>
      <div className="col gap12" style={{ flex: '999 1 min(100%,520px)', minWidth: 0 }}>
        <div className="table">
          <div className="trow head" style={{ gridTemplateColumns: cols, minWidth: 720 }}><span>Document</span><span>Ver.</span><span>Level</span><span>Permission</span><span>Activity</span></div>
          {rows.length === 0 && !locked && <div className="trow muted" style={{ minWidth: 720 }}>No documents in {c} yet.</div>}
          {rows.map(([x, ...older]) => (
            <div key={x.id} className="col" style={{ borderBottom: '1px solid var(--rule-l)' }}>
              <div className="trow" style={{ gridTemplateColumns: cols, minWidth: 720, borderBottom: 0 }}>
                <span className="row gap8" style={{ flexWrap: 'nowrap' }}><span className="xs muted" style={{ border: '1px solid var(--rule-l)', padding: '2px 5px' }}>{x.ext}</span>{docCell(x)}</span>
                <span className="muted">v{x.version}</span>
                <span className="xs">L{x.level} · {x.level === 4 ? 'Diligence' : x.level === 3 ? 'NDA' : 'Verified'}</span>
                {side === 'owner' ? <PermButton id={x.id} perm={x.permission} /> : <span className="xs">{x.permission}{x.permission === 'View + download' && isBuyer ? <> · <a href={`/api/documents/${x.id}?download=1`} className="link-u">Download</a></> : null}</span>}
                <span className="xs muted">{x.views} views · {x.downloads} dl</span>
              </div>
              {older.length > 0 && (
                <details style={{ padding: '0 16px 10px', minWidth: 720 }}>
                  <summary className="xs muted" style={{ cursor: 'pointer' }}>{older.length} earlier version{older.length > 1 ? 's' : ''}</summary>
                  {older.map((o) => <div key={o.id} className="row gap10 xs" style={{ padding: '6px 0 0 30px' }}><span className="muted">v{o.version}</span>{docCell(o)}<span className="muted">L{o.level} · {o.permission} · {o.views} views</span></div>)}
                </details>
              )}
            </div>
          ))}
          {locked > 0 && <div className="trow muted" style={{ minWidth: 720 }}>{locked} more document{locked > 1 ? 's' : ''} in {c} unlock {unlockHint}.</div>}
        </div>
        {side === 'owner' && <div style={{ maxWidth: 420 }}><DocUpload category={c} dealId={d.id} /></div>}
        <div className="col gap10" style={{ background: 'var(--gold-t)', padding: 20 }}>
          <span className="eyebrow">Data room observations</span>
          {(() => {
            const obs: [string, string][] = [];
            for (const k of DOC_CATEGORIES) if (!accessible.some((x) => x.category === k)) obs.push(['Low', isBuyer ? `No ${k.toLowerCase()} documents available to you yet` : `No ${k.toLowerCase()} documents uploaded yet`]);
            if (!accessible.some((x) => /audit|p&l|profit|balance/i.test(x.name))) obs.push(['Medium', 'No audited statements identified by file name']);
            return obs.length ? obs.map(([sev, t]) => <div key={t} className="row" style={{ gap: 12, fontSize: 14, flexWrap: 'nowrap' }}><span className="xs" style={{ minWidth: 60, color: sev === 'Medium' ? 'var(--gold)' : 'var(--muted)' }}>{sev}</span><span>{t} <span className="xs muted">· Data room index</span></span></div>) : <span className="small">No index-level gaps found.</span>;
          })()}
          <span className="xs" style={{ color: 'var(--gold)', fontWeight: 500 }}>{ai ? AI_OBS_LABEL : RULES_OBS_LABEL}</span>
        </div>
      </div>
    </div>
  );
}

async function QaTab({ d, side }: { d: any; side: string }) {
  const qs = await q(`SELECT * FROM deal_questions WHERE deal_id = $1 ORDER BY created_at`, [d.id]);
  return (
    <div className="grid g-auto-420" style={{ gap: 20, alignItems: 'start' }}>
      <div className="col gap12">
        <span className="eyebrow">Questions between parties</span>
        {qs.length === 0 && <div className="card small muted">No questions yet.</div>}
        {qs.map((x) => {
          const mine = (x.author_side === 'Acquirer') === (side === 'buyer');
          return (
            <div key={x.id} className="card col gap10" style={{ padding: 18 }}>
              <div className="row between xs muted"><span>{x.author_side} · {fmtDate(x.created_at)}</span><span style={{ color: x.answer ? 'var(--green)' : 'var(--warn)' }}>{x.answer ? 'Answered' : 'Awaiting ' + (x.author_side === 'Acquirer' ? 'owner' : 'acquirer')}</span></div>
              <span style={{ fontSize: 15 }}>{x.question}</span>
              {x.answer ? <span className="t2" style={{ fontSize: 14, borderLeft: '2px solid var(--green)', paddingLeft: 12 }}>{x.answer}</span> : !mine && side !== 'admin' && <AnswerForm dealId={d.id} qid={x.id} />}
            </div>
          );
        })}
        {side !== 'admin' && <AskForm dealId={d.id} />}
      </div>
      <div className="panel-dark col gap14">
        <div className="row between"><span className="serif" style={{ fontSize: 22 }}>Deal assistant</span><span className="xs" style={{ color: '#B8B2A5' }}>Reads only records you can access</span></div>
        {side === 'admin' ? <span className="small" style={{ color: '#B8B2A5' }}>The assistant answers for deal parties only.</span> : <Assistant dealId={d.id} prompts={[['summary', 'Summarise the business'], ['missing', 'Which documents are missing?'], ['questions', 'What questions should I ask?'], ['open', 'What is still unanswered?'], ['compare', 'Compare financial years'], ['risks', 'What are the major risk areas?']]} />}
      </div>
    </div>
  );
}

async function OffersTab({ d, side, nda }: { d: any; side: string; nda: boolean }) {
  const party = side === 'owner' || side === 'buyer';
  const offers = await q(`SELECT * FROM offers WHERE deal_id = $1 ORDER BY created_at DESC`, [d.id]);
  const latest = offers[0];
  const accepted = offers.some((o) => o.status === 'Accepted');
  const replies = await q(`SELECT detail, created_at FROM audit_logs WHERE deal_id = $1 AND kind = 'Clarification' ORDER BY created_at`, [d.id]);
  const myLabel = side === 'owner' ? 'Owner' : side === 'buyer' ? 'Acquirer' : '';
  const requestedByMe = (o: any) => o.status === 'Clarification requested' && !!myLabel && o.from_side !== myLabel;
  const tot = (o: any) => Number(o.equity) + Number(o.debt) + Number(o.seller_financing) + Number(o.earn_out);
  const pill = (s: string) => (s === 'Accepted' ? 'p-green' : s === 'Rejected' ? 'p-warn' : 'p-gold');
  const canAct = (o: any) => (o.status === 'Awaiting owner' && side === 'owner') || (o.status === 'Awaiting acquirer' && side === 'buyer') || (o.status === 'Clarification requested' && ((o.from_side === 'Acquirer' && side === 'owner') || (o.from_side === 'Owner' && side === 'buyer')));
  return (
    <div className="grid g-auto-420" style={{ gap: 20, alignItems: 'start' }}>
      <div className="col gap12">
        <span className="eyebrow">Offer history · all changes logged</span>
        {!nda && <div className="notice">Offers open once both parties have signed the NDA.</div>}
        {offers.length === 0 && nda && <div className="card small muted">No offers yet.</div>}
        {offers.map((o, i) => (
          <div key={o.id} className="col gap14" style={{ background: 'var(--card)', border: '1px solid ' + (i === 0 ? 'var(--ink)' : 'var(--rule-l)'), padding: 22 }}>
            <div className="row between"><span className="small muted">Offer {offers.length - i} · {o.from_side} · {fmtDate(o.created_at)}</span><span className={'pill ' + pill(o.status)}>{o.status}</span></div>
            <span className="big" style={{ fontSize: 40 }}>{cr(tot(o))}</span>
            <div className="grid rule-tl" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '10px 18px', fontSize: 13.5, paddingTop: 12 }}>
              {[['Equity', cr(o.equity)], ['Debt', cr(o.debt)], ['Seller financing', cr(o.seller_financing)], ['Earn-out', cr(o.earn_out)], ['Timeline', o.timeline_months + ' months']].map(([k, v]) => <div key={k} className="col gap4"><span className="xs muted">{k}</span><span>{v}</span></div>)}
            </div>
            {o.conditions && <span className="t2" style={{ fontSize: 13.5 }}>Conditions: {o.conditions}</span>}
            {replies.filter((r) => r.detail?.offerId === o.id).map((r, j) => <span key={j} className="t2" style={{ fontSize: 13.5, borderLeft: '2px solid var(--gold)', paddingLeft: 12 }}>Clarification from {o.from_side.toLowerCase()} · {fmtDate(r.created_at)}: {r.detail?.reply}</span>)}
            {i === 0 && canAct(o) && <OfferActions dealId={d.id} offerId={o.id} clarifying={requestedByMe(o)} />}
            {i === 0 && o.status === 'Clarification requested' && o.from_side === myLabel && <ClarifyReply dealId={d.id} offerId={o.id} />}
          </div>
        ))}
        <span className="xs muted">Offers here are indicative and non-binding until a definitive agreement is signed with your advisors.</span>
      </div>
      {accepted && <div className="card small t2">An offer has been accepted. Further changes go through the definitive agreement with your advisors.</div>}
      {nda && party && !accepted && <OfferForm dealId={d.id} title={side === 'owner' ? 'Draft a counter-offer' : 'Submit an offer'} submitLabel={side === 'owner' ? 'Send counter-offer' : 'Submit offer'} initial={latest ? { equity: Number(latest.equity), debt: Number(latest.debt), seller: Number(latest.seller_financing), earn: Number(latest.earn_out), months: latest.timeline_months, conditions: latest.conditions || '' } : { equity: 0, debt: 0, seller: 0, earn: 0, months: 6, conditions: 'Subject to diligence.' }} />}
    </div>
  );
}

async function FinancingTab({ d, side }: { d: any; side: string }) {
  const fin = (d.closing || {}).financing || {};
  const bp = await one(`SELECT financing, capital, verification_stage FROM buyer_profiles WHERE user_id = $1`, [d.buyer_id]);
  const o = await one(`SELECT * FROM offers WHERE deal_id = $1 ORDER BY (status = 'Accepted') DESC, created_at DESC LIMIT 1`, [d.id]);
  const s = await one(`SELECT profit FROM scores WHERE business_id = $1 ORDER BY created_at DESC LIMIT 1`, [d.business_id]);
  const parts: [string, number, string, string][] = o ? [['Buyer equity', Number(o.equity), 'var(--ink)', 'var(--paper)'], ['Bank / NBFC debt', Number(o.debt), 'var(--green)', 'var(--paper)'], ['Seller financing', Number(o.seller_financing), 'var(--gold-d)', 'var(--ink)'], ['Earn-out', Number(o.earn_out), 'var(--tint)', 'var(--ink)']] : [];
  const tot = parts.reduce((a, p) => a + p[1], 0);
  const ebitda = Number(s?.profit || 0);
  const debt = o ? Number(o.debt) : 0;
  const service = debt > 0 ? debt * 0.26 : 0; // ~5 yr amortisation at ~12%
  const dscr = service > 0 && ebitda > 0 ? ebitda / service : null;
  return (
    <div className="grid g-auto-380" style={{ gap: 20, alignItems: 'start' }}>
      <div className="card col gap16" style={{ padding: 24 }}>
        <span className="serif" style={{ fontSize: 22 }}>Proposed structure</span>
        {!o ? <span className="small muted">The structure appears once an offer is on the table.</span> : <>
          <div className="row" style={{ height: 44, border: '1px solid var(--ink)', gap: 0, flexWrap: 'nowrap' }}>{parts.filter((p) => p[1] > 0).map((p) => <div key={p[0]} style={{ flex: p[1], background: p[2], color: p[3], display: 'grid', placeItems: 'center', fontSize: 12.5, borderRight: '1px solid var(--ink)' }}>{Math.round((p[1] / tot) * 100)}%</div>)}</div>
          {parts.map((p) => <div key={p[0]} className="row between rule-tl" style={{ fontSize: 14, paddingTop: 9 }}><span className="row gap10"><span style={{ width: 10, height: 10, background: p[2], border: '1px solid var(--ink)' }} />{p[0]}</span><span>{cr(p[1])}</span></div>)}
          <div className="grid rule-t" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13.5, paddingTop: 12 }}>
            <div className="col gap4"><span className="muted">Business cash flow (est. EBITDA)</span><span>{ebitda ? cr(ebitda) + ' / yr' : '—'}</span></div>
            <div className="col gap4"><span className="muted">Debt service cover (indicative)</span><span style={{ color: dscr && dscr >= 1.5 ? 'var(--green)' : 'var(--warn)' }}>{dscr ? dscr.toFixed(1) + '× ' + (dscr >= 1.5 ? '· comfortable' : '· tight') : '—'}</span></div>
          </div>
          <span className="xs muted">DSCR assumes ~5-year amortisation at ~12% on the debt component. Lenders will run their own numbers.</span>
        </>}
        <div className="grid rule-t" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13.5, paddingTop: 12 }}>
          <div className="col gap4"><span className="muted">Collateral</span><span>{fin.collateral || 'Not recorded yet'}</span></div>
          <div className="col gap4"><span className="muted">Buyer credit profile</span><span>{fin.credit ? fin.credit + ' · self-reported' : bp?.financing ? `Financing ${bp.financing} · from acquirer profile` : 'Not recorded yet'}</span></div>
        </div>
        <span className="xs muted">Credit details are self-reported by the acquirer. Lenders verify them independently.</span>
        <FinancingFields dealId={d.id} collateral={fin.collateral || ''} credit={fin.credit || ''} side={side} />
      </div>
      <div className="col gap12">
        <span className="eyebrow">Financing partners · referral network</span>
        {LENDERS.map((l, i) => <div key={l[0]} className="card grid" style={{ gridTemplateColumns: 'minmax(0,1fr) auto', gap: 14, alignItems: 'center', padding: 18 }}><div className="col gap4"><span style={{ fontWeight: 500 }}>{l[0]}</span><span className="small muted">{l[1]} · {l[2]}</span></div>{side === 'owner' || side === 'buyer' ? <ReferralButton dealId={d.id} idx={i} done={!!(d.referrals || {})[i]} /> : <span className="xs muted">{(d.referrals || {})[i] ? 'Referral requested' : ''}</span>}</div>)}
        <span className="xs muted">Legacy Handover refers you to partners; it does not lend. Terms are indicative until sanctioned.</span>
      </div>
    </div>
  );
}

async function ClosingTab({ d, side }: { d: any; side: string }) {
  const cl = d.closing || {};
  const n = CLOSING_ITEMS.filter((_, i) => cl[String(i)]).length;
  const party = side === 'owner' || side === 'buyer';
  const o = await one(`SELECT * FROM offers WHERE deal_id = $1 AND status = 'Accepted' ORDER BY created_at DESC LIMIT 1`, [d.id]);
  const gate = !ndaDone(d) ? 'Closing is recorded only after both parties sign the NDA and an offer is accepted.' : !o ? 'Closing is recorded only after an offer is accepted.' : '';
  const ins = cl.instalments || {};
  const received = Array.from({ length: SELLER_INSTALMENTS }, (_, i) => !!ins[String(i)]);
  const earn: { id: string; title: string; amount: number; measure: string; progress: number }[] = Array.isArray(cl.earnout) ? cl.earnout : [];
  const earnUsed = earn.reduce((a, m) => a + Number(m.amount || 0), 0);
  return (
    <div className="grid g-auto-380" style={{ gap: 20, alignItems: 'start' }}>
      <div className="col gap12">
        <span className="eyebrow">Closing checklist</span>
        {gate && !d.closed_at && <div className="notice">{gate}</div>}
        <div style={{ border: '1px solid var(--ink)', background: 'var(--card)' }}>
          {CLOSING_ITEMS.map(([t, who], i) => <CheckItem key={t} dealId={d.id} kind="closing" k={String(i)} label={t} who={who} checked={!!cl[String(i)]} disabled={!party || !!d.closed_at} />)}
        </div>
        <span className="t2" style={{ fontSize: 13 }}>{n} of {CLOSING_ITEMS.length} conditions complete{d.closed_at ? ' · closing recorded ' + fmtDate(d.closed_at) : ''}</span>
      </div>
      <div className="col gap16">
        {o && Number(o.seller_financing) > 0 && (
          <div className="card col gap12">
            <span className="serif" style={{ fontSize: 21 }}>Seller financing · {cr(o.seller_financing)}</span>
            <span className="t2" style={{ fontSize: 13.5 }}>Tracked as {SELLER_INSTALMENTS} quarterly instalments from closing. Instalment receipts are recorded by the owner.</span>
            <Instalments dealId={d.id} received={received} total={SELLER_INSTALMENTS} canEdit={side === 'owner' && !!d.closed_at} />
            <div className="row between xs muted"><span>Starts {d.closed_at ? fmtDate(new Date(new Date(d.closed_at).getTime() + 90 * 864e5)) : 'after closing'}</span><span>{received.filter(Boolean).length} of {SELLER_INSTALMENTS} received</span></div>
          </div>
        )}
        {o && Number(o.earn_out) > 0 && (
          <div className="card col gap12">
            <span className="serif" style={{ fontSize: 21 }}>Earn-out · up to {cr(o.earn_out)}</span>
            {earn.length === 0 && <span className="t2" style={{ fontSize: 13.5 }}>Milestones and measurement dates are set in the definitive agreement. Record them here to track progress.</span>}
            {earn.map((m) => (
              <div key={m.id} className="col gap6 rule-tl" style={{ paddingTop: 10 }}>
                <div className="row between" style={{ fontSize: 14 }}><span>{m.title}</span><span>{cr(m.amount)}</span></div>
                <EarnoutProgress dealId={d.id} id={m.id} progress={Number(m.progress) || 0} canEdit={party} />
                {m.measure && <span className="xs muted">Measured {m.measure}</span>}
              </div>
            ))}
            {earn.length > 0 && <span className="xs muted">{cr(earnUsed)} of {cr(o.earn_out)} assigned to milestones. Progress is recorded by the parties, not verified by the platform.</span>}
            {party && earnUsed < Number(o.earn_out) && <EarnoutForm dealId={d.id} />}
          </div>
        )}
        {!o && <div className="card small muted">Seller financing and earn-out tracking appear once an offer is accepted.</div>}
        <span className="xs muted">Workflow completion here is not legal completion of the transaction.</span>
      </div>
    </div>
  );
}

async function TransitionTab({ d, side }: { d: any; side: string }) {
  const tr = d.transition || {};
  const total = TRANSITION_PHASES.reduce((a, p) => a + p[1].length, 0);
  const done = TRANSITION_KEYS.filter((k) => tr[k]).length;
  const ro = side !== 'owner' && side !== 'buyer';
  return (
    <div className="col gap20">
      {!d.closed_at && <div className="notice">The transition plan becomes the focus after closing. You can prepare it now.</div>}
      <div className="grid g-auto-260" style={{ gap: 0, borderTop: '1px solid var(--ink)', borderLeft: '1px solid var(--ink)' }}>
        {TRANSITION_PHASES.map(([ph, items], pi) => (
          <div key={ph} className="col gap12" style={{ borderRight: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)', padding: 22, background: pi === 0 ? 'var(--card)' : 'transparent' }}>
            <div className="row between" style={{ alignItems: 'baseline' }}><span className="serif" style={{ fontSize: 24 }}>{ph}</span><span className="xs muted">{items.filter((t) => tr[ph + ' · ' + t]).length}/{items.length}</span></div>
            {items.map((t) => <CheckItem key={t} dealId={d.id} kind="transition" k={ph + ' · ' + t} label={t} checked={!!tr[ph + ' · ' + t]} disabled={ro} />)}
          </div>
        ))}
      </div>
      <div className="col gap10">
        <span className="eyebrow">Handover by category</span>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8 }}>
          {HANDOVER_CATS.map((c) => { const k = 'Handover · ' + c; return <div key={c} className="card-l col gap8" style={{ padding: 14 }}><CheckItem dealId={d.id} kind="transition" k={k} label={c} checked={!!tr[k]} disabled={ro} /></div>; })}
        </div>
      </div>
      <div className="panel-green row between" style={{ gap: 16 }}>
        <div className="col gap6"><span className="eyebrow" style={{ color: 'var(--gold-d)' }}>Transition progress</span><span style={{ fontSize: 15, color: 'var(--on-green)' }}>{done} of {total + HANDOVER_CATS.length} items recorded complete</span></div>
        {(side === 'owner' || side === 'advisor') && <Link href="/passport" className="btn btn-paper">Open Succession Passport →</Link>}
      </div>
    </div>
  );
}

async function ActivityTab({ d }: { d: any }) {
  const rows = await q(`SELECT action, kind, created_at FROM audit_logs WHERE deal_id = $1 ORDER BY created_at DESC LIMIT 200`, [d.id]);
  return <>
    <div style={{ border: '1px solid var(--ink)', background: 'var(--card)' }}>
      {rows.length === 0 && <div className="trow muted">No activity yet.</div>}
      {rows.map((a, i) => <div key={i} className="trow" style={{ gridTemplateColumns: 'minmax(110px,170px) minmax(0,1fr) minmax(90px,auto)' }}><span className="small muted">{fmtDate(a.created_at, true)}</span><span>{a.action}</span><span className="xs" style={{ color: 'var(--gold)' }}>{a.kind}</span></div>)}
    </div>
    <span className="xs muted">Append-only audit trail. {rows.length ? `Last activity ${ago(rows[0].created_at)}.` : ''}</span>
  </>;
}
