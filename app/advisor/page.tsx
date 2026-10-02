import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { q } from '@/lib/db';
import { fmtDate, ago } from '@/lib/guard';
import Shell from '@/components/Shell';
import SiteHeader from '@/components/SiteHeader';
import { TaskList, type TaskRow } from '@/components/owner/OwnerClient';
import { InviteClient, NoteBox, TakeTask, AdvisorProfile } from '@/components/AdvisorClient';

export const metadata = { title: 'Advisor portal', description: 'Help your clients plan beyond the present. A private portal for CAs, lawyers and advisors to track client succession readiness.' };
export const dynamic = 'force-dynamic';

const STAGE_PILL: Record<string, string> = { Preparing: 'p-gold', 'Assessment complete': 'p-grey', Ready: 'p-green', 'Exit exploration': 'p-solid', Invited: 'p-line' };

export default async function Advisor({ searchParams }: { searchParams: Promise<{ view?: string; client?: string }> }) {
  const user = await currentUser();
  if (!user || user.role !== 'advisor') return <AdvisorLanding signedIn={!!user} />;
  const sp = await searchParams;
  const view = ['home', 'clients', 'tasks', 'profile'].includes(sp.view || '') ? sp.view! : 'home';
  const links = await q(`SELECT al.*, b.name AS biz_name, b.industry, b.revenue_band, b.lifecycle, b.confidentiality_level, o.name AS owner_name
    FROM advisor_links al LEFT JOIN businesses b ON b.id = al.business_id LEFT JOIN users o ON o.id = b.owner_id
    WHERE al.advisor_user_id = $1 AND al.status <> 'revoked' ORDER BY al.created_at DESC`, [user.id]);
  const bizIds = links.filter((l) => l.status === 'active' && l.business_id).map((l) => l.business_id);
  const scores = bizIds.length ? await q(`SELECT DISTINCT ON (business_id) business_id, transferability, readiness, independence FROM scores WHERE business_id = ANY($1::uuid[]) ORDER BY business_id, created_at DESC`, [bizIds]) : [];
  const tasks = bizIds.length ? await q(`SELECT * FROM tasks WHERE business_id = ANY($1::uuid[]) ORDER BY (status = 'done'), due_date NULLS LAST`, [bizIds]) : [];
  const listings = bizIds.length ? await q(`SELECT business_id, status FROM listings WHERE business_id = ANY($1::uuid[])`, [bizIds]) : [];
  const deals = bizIds.length ? await q(`SELECT id, business_id FROM deals WHERE business_id = ANY($1::uuid[])`, [bizIds]) : [];
  const rows = links.map((l) => {
    const s = scores.find((x) => x.business_id === l.business_id);
    const open = tasks.filter((t) => t.business_id === l.business_id && t.status !== 'done');
    const mine = open.filter((t) => t.assignee_user_id === user.id || /\bCA\b|advisor|lawyer/i.test(t.assignee || ''));
    const listed = listings.some((x) => x.business_id === l.business_id && ['published', 'pending'].includes(x.status));
    const deal = deals.find((x) => x.business_id === l.business_id);
    const stage = l.status !== 'active' || !l.business_id ? 'Invited' : deal || listed ? 'Exit exploration' : s && s.transferability >= 75 && s.readiness >= 70 ? 'Ready' : open.length < tasks.filter((t) => t.business_id === l.business_id).length ? 'Preparing' : 'Assessment complete';
    return { l, s, open, mine, stage, deal, name: l.biz_name || (l.owner_name ? l.owner_name + '’s business' : l.direction === 'advisor_invited' ? l.client_name || l.invited_contact : (l.industry ? l.industry + ' client' : 'Client')), action: l.status !== 'active' ? 'Awaiting assessment' : mine[0]?.title || (open.length ? `${open.length} open tasks` : 'None') };
  });
  const sel = rows.find((r) => r.l.business_id && r.l.business_id === sp.client);
  const list = view === 'tasks' ? rows.filter((r) => r.mine.length) : rows;
  const nav = [['home', 'Dashboard', ''], ['clients', 'Clients', rows.length], ['tasks', 'Tasks', rows.reduce((a, r) => a + r.mine.length, 0)], ['profile', 'Profile', '']].map(([k, l, b]) => ({ href: '/advisor' + (k === 'home' ? '' : '?view=' + k), label: String(l), badge: b || undefined, on: view === k }));
  const count = (s: string) => rows.filter((r) => r.stage === s).length;
  return (
    <Shell variant="line" nav={nav} extra={[{ href: '/professionals', label: 'Professional directory' }, { href: '/settings', label: 'Settings' }]}
      top={<div className="col gap4 small muted" style={{ padding: '0 8px' }}><span style={{ color: 'var(--ink)', fontWeight: 500 }}>{user.firm || user.name || 'Your firm'}</span><span>{user.city || 'Advisor'}</span><Link href="/advisor?view=profile" className="link-u xs" style={{ alignSelf: 'flex-start' }}>Edit profile</Link></div>}>
      <div className="row between rule-b" style={{ alignItems: 'flex-end', gap: 20, paddingBottom: 20 }}>
        <h1 className="page-title">{view === 'home' ? 'Your clients at a glance' : view === 'tasks' ? 'Tasks assigned to you' : view === 'profile' ? 'Your profile' : 'Clients'}</h1>
        <span className="muted" style={{ fontSize: 13.5 }}>You see only what each client has shared with you.</span>
      </div>
      {view === 'profile' ? <AdvisorProfile name={user.name || ''} firm={user.firm || ''} city={user.city || ''} /> : <>
        <InviteClient />
        {view === 'home' && (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 0, borderTop: '1px solid var(--ink)', borderLeft: '1px solid var(--ink)' }}>
            {[['Clients', rows.length, 'var(--ink)'], ['Ready', count('Ready'), 'var(--green)'], ['Preparing', count('Preparing') + count('Assessment complete'), 'var(--ink)'], ['Exit exploration', count('Exit exploration'), 'var(--ink)'], ['Action required', rows.filter((r) => r.mine.length).length, 'var(--warn)']].map(([k, v, c]) => (
              <div key={k as string} className="col gap6" style={{ padding: 20, borderRight: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)' }}><span className="xs muted">{k}</span><span className="big" style={{ fontSize: 40, color: c as string }}>{v}</span></div>
            ))}
          </div>
        )}
        <div className="col gap12">
          <span className="eyebrow">{view === 'tasks' ? 'Clients with action required' : 'Clients'}</span>
          <div className="table">
            <div className="trow head" style={{ gridTemplateColumns: 'minmax(200px,2fr) repeat(3,minmax(70px,1fr)) minmax(140px,1.4fr) minmax(200px,2fr)', minWidth: 860 }}><span>Client</span><span>Transfer.</span><span>Readiness</span><span>Indep.</span><span>Stage</span><span>Action required</span></div>
            {list.length === 0 && <div className="trow muted" style={{ minWidth: 860 }}>No clients yet. Invite a client, or ask an owner to invite you from their dashboard using your mobile or email.</div>}
            {list.map((r) => (
              <Link key={r.l.id} href={r.l.business_id && r.l.status === 'active' ? `/advisor?view=${view}&client=${r.l.business_id}` : '#'} className="trow" style={{ gridTemplateColumns: 'minmax(200px,2fr) repeat(3,minmax(70px,1fr)) minmax(140px,1.4fr) minmax(200px,2fr)', minWidth: 860, background: sel?.l.id === r.l.id ? 'var(--tint)' : undefined }}>
                <div className="col gap4"><span style={{ fontWeight: 500 }}>{r.name}</span><span className="xs muted">{r.l.industry ? `${r.l.industry} · ${r.l.revenue_band}` : 'Invited ' + ago(r.l.created_at)}</span></div>
                <span className="tab">{r.s?.transferability ?? '—'}</span><span className="tab">{r.s?.readiness ?? '—'}</span><span className="tab" style={{ color: r.s && r.s.independence < 55 ? 'var(--warn)' : undefined }}>{r.s?.independence ?? '—'}</span>
                <span className={'pill ' + STAGE_PILL[r.stage]} style={{ justifySelf: 'start' }}>{r.stage}</span>
                <span className="small" style={{ color: r.mine.length ? 'var(--warn)' : 'var(--muted)' }}>{r.action}</span>
              </Link>
            ))}
          </div>
        </div>
        {sel && (
          <div className="card grid g-auto-300" style={{ padding: 24, gap: 28 }}>
            <div className="col gap14">
              <div className="row between"><span className="serif" style={{ fontSize: 24 }}>{sel.name}</span><Link href={`/advisor?view=${view}`} className="muted" style={{ fontSize: 18 }}>×</Link></div>
              <span className="t2" style={{ fontSize: 13.5 }}>Shared with you: scores, tasks, documents (view). Not shared: report narrative, valuation, deal terms.</span>
              <TaskList tasks={sel.open.concat(tasks.filter((t) => t.business_id === sel.l.business_id && t.status === 'done')).map((t): TaskRow => ({ id: t.id, title: t.title, category: t.category, priority: t.priority, effort: t.effort, impact: t.impact, why: t.why, criteria: t.criteria, assignee: t.assignee, due: fmtDate(t.due_date), done: t.status === 'done' }))} showFilter={false} />
              <div className="col gap6">{sel.open.filter((t) => t.assignee_user_id !== user.id).slice(0, 3).map((t) => <span key={t.id} className="row between xs"><span className="muted">{t.title}</span><TakeTask id={t.id} /></span>)}</div>
            </div>
            <div className="col gap12">
              <span className="eyebrow">Note to client</span>
              <NoteBox businessId={sel.l.business_id} />
              <div className="row gap8">{sel.deal && <Link href={'/deals/' + sel.deal.id} className="btn btn-ghost btn-sm">Deal workspace →</Link>}</div>
              <span className="xs muted">Notes are logged in the client&rsquo;s access history.</span>
              <ClientDocs businessId={sel.l.business_id} />
            </div>
          </div>
        )}
      </>}
    </Shell>
  );
}

async function ClientDocs({ businessId }: { businessId: string }) {
  const docs = await q(`SELECT id, category, name, ext, version FROM documents WHERE business_id = $1 ORDER BY category, name`, [businessId]);
  return (
    <div className="col gap6 rule-tl" style={{ paddingTop: 12 }}>
      <span className="eyebrow">Documents (view only)</span>
      {docs.length === 0 && <span className="small muted">Nothing uploaded yet.</span>}
      {docs.map((d) => <a key={d.id} href={'/api/documents/' + d.id} target="_blank" rel="noopener" className="small">{d.category} › {d.name} v{d.version}</a>)}
    </div>
  );
}

function AdvisorLanding({ signedIn }: { signedIn: boolean }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <SiteHeader active="For advisors" />
      <main className="wrap grid g-auto-420" style={{ paddingTop: 72, paddingBottom: 96, gap: 56, alignItems: 'start' }}>
        <div className="col gap24">
          <span className="eyebrow">For CAs, CSs, lawyers & advisors</span>
          <h1 className="h1">Help your clients plan beyond the present.</h1>
          <p className="t2" style={{ fontSize: 17, margin: 0 }}>Invite owner-clients to a private succession assessment, see the scores and tasks they choose to share, assign yourself the work that needs you, and coordinate with their lawyers and lenders when a transition begins.</p>
          <div className="row gap12"><Link href="/sign-in?role=advisor" className="btn btn-green btn-lg">{signedIn ? 'Switch to advisor sign in' : 'Advisor sign in'} →</Link><Link href="/professionals#join" className="link-u">Apply to the professional directory</Link></div>
        </div>
        <div className="col gap12">
          {[['Client dashboard', 'Transferability, readiness and independence for every client who shares with you, with the actions that need you.'], ['Neutral invitations', 'Pre-written, neutral wording. Nothing about selling, family or retirement is assumed.'], ['Permissioned access', 'You see only what each owner shares: scores, tasks, documents. Every view is logged in their access history.'], ['Deal coordination', 'When a client opens a deal workspace, you can follow it alongside them.']].map(([h, p]) => <div key={h} className="card col gap6"><span className="serif" style={{ fontSize: 21 }}>{h}</span><span className="t2" style={{ fontSize: 14 }}>{p}</span></div>)}
        </div>
      </main>
    </div>
  );
}
