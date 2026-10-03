import Link from 'next/link';
import { requireUser, fmtDate, ago } from '@/lib/guard';
import { ownerContext, toStored } from '@/lib/owner';
import { q } from '@/lib/db';
import { paths } from '@/lib/report';
import { LEVELS, DOC_CATEGORIES, DOC_HINTS, DOC_TARGETS } from '@/lib/constants';
import Shell from '@/components/Shell';
import { TaskList, MarkComplete, InviteAdvisor, RevokeAdvisor, LevelPicker, DocUpload, DeleteDoc, ListingForm, RequestDecision, BusinessForm, type TaskRow } from '@/components/owner/OwnerClient';

export const metadata = { title: 'Dashboard', robots: { index: false } };
export const dynamic = 'force-dynamic';

const VIEWS = { home: ['Dashboard', ''], tasks: ['Readiness plan', 'My tasks'], docs: ['Documents', 'My documents'], privacy: ['Privacy & sharing', 'Who can see what'], opportunities: ['Opportunities', 'Profile & acquirer interest'], business: ['My business', 'Private business details'] } as const;

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requireUser('/dashboard');
  const sp = await searchParams;
  const view = (sp.view && sp.view in VIEWS ? sp.view : 'home') as keyof typeof VIEWS;
  const ctx = await ownerContext(user);

  if (!ctx.business || !ctx.score) {
    return (
      <main className="wrap-m col gap24" style={{ padding: '80px 24px', maxWidth: 720 }}>
        <span className="eyebrow">Welcome</span>
        <h1 className="h1">Start with the seven-minute assessment.</h1>
        <p className="t2" style={{ fontSize: 16 }}>Your dashboard, readiness plan and documents appear once your first assessment is complete. Everything stays private.</p>
        <div className="row gap12"><Link href="/assessment" className="btn btn-green btn-lg">Begin the assessment →</Link><form action="/api/sign-out" method="post"><button className="btn btn-ghost">Sign out</button></form></div>
        <span className="small muted">Looking to acquire instead? <Link href="/sign-in?role=buyer" className="link-u">Sign in as an acquirer</Link>. Advising clients? <Link href="/sign-in?role=advisor" className="link-u">Advisor sign in</Link>.</span>
      </main>
    );
  }

  const b = ctx.business;
  const s = toStored(ctx.score);
  const tasksRaw = await q(`SELECT * FROM tasks WHERE business_id = $1 ORDER BY (status = 'done'), CASE priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 ELSE 2 END, impact DESC, sort`, [b.id]);
  const allTasks: TaskRow[] = tasksRaw.map((t) => ({ id: t.id, title: t.title, category: t.category, priority: t.priority, effort: t.effort, impact: t.impact, why: t.why, criteria: t.criteria, assignee: t.assignee, due: fmtDate(t.due_date), done: t.status === 'done' }));
  // Free plan (PRD §65): basic tasks only. The full prioritised plan is part of the detailed report.
  const FREE_TASKS = 3;
  const tasks = ctx.paid ? allTasks : allTasks.slice(0, FREE_TASKS);
  const lockedCount = allTasks.length - tasks.length;
  const boost = tasksRaw.filter((t) => t.status === 'done' && new Date(t.completed_at) > new Date(ctx.score!.created_at)).reduce((a, t) => a + t.impact, 0);
  const nDone = tasks.filter((t) => t.done).length;
  const next = tasksRaw.find((t) => t.status !== 'done' && tasks.some((x) => x.id === t.id));
  const deals = await q(`SELECT id, ref FROM deals WHERE business_id = $1 ORDER BY created_at DESC`, [b.id]);
  const pendingReq = await q(`SELECT ar.id, ar.created_at, ar.message, bp.buyer_type, bp.capital, bp.experience, bp.involvement, bp.timeline, bp.verification_stage FROM access_requests ar JOIN listings l ON l.id = ar.listing_id LEFT JOIN buyer_profiles bp ON bp.user_id = ar.buyer_id WHERE l.business_id = $1 AND ar.status = 'Owner reviewing' ORDER BY ar.created_at DESC`, [b.id]);

  const nav = [
    { href: '/dashboard', label: 'Dashboard', on: view === 'home' },
    { href: '/dashboard?view=tasks', label: 'My tasks', badge: tasks.length - nDone || undefined, on: view === 'tasks' },
    { href: '/dashboard?view=docs', label: 'My documents', on: view === 'docs' },
    { href: '/dashboard?view=privacy', label: 'Privacy & sharing', on: view === 'privacy' },
    { href: '/dashboard?view=opportunities', label: 'Opportunities', badge: pendingReq.length || undefined, on: view === 'opportunities' },
    { href: '/dashboard?view=business', label: 'My business', on: view === 'business' }
  ];
  const extra = [
    { href: '/report', label: 'My report' },
    { href: '/assessment?retake=1', label: 'Retake assessment' },
    ...(deals.length ? [{ href: '/deals/' + deals[0].id, label: 'Deal workspace', badge: deals.length }] : []),
    { href: '/passport', label: 'Succession Passport' },
    { href: '/professionals', label: 'Find a professional' },
    { href: '/settings', label: 'Settings' }
  ];
  const footer = (
    <div className="col gap6" style={{ background: 'var(--green-2)', padding: 16 }}>
      <span className="xs" style={{ color: 'var(--gold-d)' }}>Visibility</span>
      <span style={{ fontSize: 14, color: 'var(--paper)' }}>Level {b.confidentiality_level} · {LEVELS[b.confidentiality_level][0]}</span>
      <Link href="/dashboard?view=privacy" className="small" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>Manage sharing</Link>
    </div>
  );
  const first = user.name ? user.name.split(' ')[0] : null;
  const hour = Number(new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }));
  const greet = (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening') + (first ? ', ' + first : '');
  const P = paths(s).filter((p) => p.fit !== 'Low fit').slice(0, 5);

  return (
    <Shell nav={nav} extra={extra} footer={footer}>
      <div className="row between" style={{ alignItems: 'flex-end', gap: 20 }}>
        <div className="col gap6"><span className="small" style={{ color: 'var(--gold)', fontWeight: 500 }}>{VIEWS[view][1] || 'Dashboard'}</span><h1 className="page-title">{view === 'home' ? greet : VIEWS[view][0]}</h1></div>
        <InviteAdvisor />
      </div>

      {view === 'home' && (
        <div className="col gap24">
          <div className="grid g-auto-160" style={{ gap: 12 }}>
            {([['Transferability', s.transferability, 'Target 85', Math.round(boost)], ['Succession Readiness', s.readiness, 'Target 80', Math.round(boost * 0.7)], ['Business Independence', s.independence, 'Target 70', Math.round(boost * 0.8)]] as const).map(([t, v, sub, add]) => (
              <div key={t} className="card col gap10" style={{ padding: 20 }}>
                <span className="small t2">{t}</span>
                <div className="row between" style={{ alignItems: 'baseline', flexWrap: 'nowrap' }}><span className="serif tab" style={{ fontSize: 44, lineHeight: 1, color: v < 55 ? 'var(--warn)' : 'var(--green)' }}>{v}</span><span className="xs muted">{sub}</span></div>
                <div className={'bar' + (v < 55 ? ' warn' : '')}><i style={{ width: v + '%' }} /></div>
                {add > 0 && <span className="xs" style={{ color: 'var(--green)' }}>+{add} projected from completed tasks · retake to confirm</span>}
              </div>
            ))}
            <div className="card col gap10" style={{ padding: 20 }}>
              <span className="small t2">Tasks complete</span>
              <div className="row between" style={{ alignItems: 'baseline' }}><span className="serif tab" style={{ fontSize: 44, lineHeight: 1, color: 'var(--green)' }}>{nDone}</span><span className="xs muted">of {tasks.length}</span></div>
              <div className="bar"><i style={{ width: (tasks.length ? (nDone / tasks.length) * 100 : 0) + '%' }} /></div>
            </div>
          </div>
          <div className="grid g-auto-380">
            {next ? (
              <div className="panel-green col gap14">
                <span className="small" style={{ color: 'var(--gold-d)' }}>Next best action</span>
                <span className="serif" style={{ fontSize: 26, lineHeight: 1.2 }}>{next.title}</span>
                <span style={{ fontSize: 14, color: '#C9D3CC' }}>{next.why}</span>
                <div className="row gap10" style={{ fontSize: 12.5 }}><span style={{ background: 'var(--green-2)', padding: '5px 10px' }}>Effort: {next.effort}</span><span style={{ background: 'var(--green-2)', padding: '5px 10px', color: 'var(--gold-d)' }}>Transferability +{next.impact}</span></div>
                <MarkComplete id={next.id} />
              </div>
            ) : (
              <div className="panel-green col gap14"><span className="small" style={{ color: 'var(--gold-d)' }}>Plan complete</span><span className="serif" style={{ fontSize: 26 }}>Every task on your plan is done.</span><Link href="/assessment?retake=1" className="btn btn-paper" style={{ alignSelf: 'flex-start' }}>Retake to update your scores</Link></div>
            )}
            <div className="card col gap16" style={{ padding: 26 }}>
              <div className="row between"><span style={{ fontWeight: 600 }}>Succession timeline</span><span className="small muted">Your timeline: {s.labels?.timeline || 'Not sure yet'}</span></div>
              <div className="row gap4" style={{ flexWrap: 'nowrap' }}>
                {['Prepare', 'Formalise', 'Search', 'Transact', 'Transition'].map((p, i) => {
                  const cur = deals.length ? 2 : nDone / Math.max(tasks.length, 1) > 0.6 ? 1 : 0;
                  return <div key={p} className="col gap8" style={{ flex: 1 }}><div style={{ height: 8, background: i < cur ? 'var(--green)' : i === cur ? 'var(--green)' : i === cur + 1 ? '#C9D3CC' : 'var(--tint)', opacity: i < cur ? .6 : 1 }} /><span className="xs" style={{ color: i === cur ? 'var(--ink)' : 'var(--muted)' }}>{p}</span></div>;
                })}
              </div>
              <div className="col gap8 rule-tl" style={{ paddingTop: 14 }}>
                <span className="small muted">Paths that fit (from your report)</span>
                {ctx.paid
                  ? <div className="row gap8">{P.map((p) => <span key={p.t} className={'pill ' + (p.fit === 'High fit' ? 'p-green' : 'p-grey')} style={{ fontSize: 13, padding: '6px 12px' }}>{p.t}</span>)}</div>
                  : <span className="small t2">Path fit is part of the detailed report. <Link href="/report#unlock" className="link-u">Unlock it</Link></span>}
              </div>
            </div>
          </div>
          <TaskList tasks={tasks.slice(0, 5)} />
          {lockedCount > 0 ? <LockedTasks n={lockedCount} /> : <Link href="/dashboard?view=tasks" className="link-u small" style={{ alignSelf: 'flex-start' }}>See all {tasks.length} tasks →</Link>}
        </div>
      )}

      {view === 'tasks' && <div className="col gap14"><TaskList tasks={tasks} />{lockedCount > 0 && <LockedTasks n={lockedCount} />}</div>}

      {view === 'docs' && <DocsView businessId={b.id} />}

      {view === 'privacy' && <PrivacyView businessId={b.id} level={b.confidentiality_level} />}

      {view === 'opportunities' && <OpportunitiesView b={b} requests={pendingReq} deals={deals} />}

      {view === 'business' && (
        <div className="col gap16" style={{ maxWidth: 760 }}>
          <span className="small muted">These details are private. They are never shown to acquirers unless you share them under NDA.</span>
          <BusinessForm b={b} />
        </div>
      )}
    </Shell>
  );
}

async function DocsView({ businessId }: { businessId: string }) {
  const docs = await q(`SELECT id, category, name, ext, version, level, size, created_at FROM documents WHERE business_id = $1 ORDER BY category, name, version DESC`, [businessId]);
  return (
    <div className="grid g-auto-260" style={{ gap: 12 }}>
      {DOC_CATEGORIES.map((c) => {
        const list = docs.filter((d) => d.category === c);
        const uniq = new Set(list.map((d) => d.name)).size;
        return (
          <div key={c} className="card col gap12" style={{ padding: 20 }}>
            <div className="row between"><span style={{ fontWeight: 600 }}>{c}</span><span className="xs muted">{uniq} / {DOC_TARGETS[c]}</span></div>
            <span className="t2" style={{ fontSize: 13.5 }}>{DOC_HINTS[c]}</span>
            <div className="bar"><i style={{ width: Math.min(100, (uniq / DOC_TARGETS[c]) * 100) + '%' }} /></div>
            {list.map((d) => (
              <div key={d.id} className="row between rule-tl" style={{ paddingTop: 8, fontSize: 13.5, flexWrap: 'nowrap', gap: 8 }}>
                <a href={`/api/documents/${d.id}`} className="row" style={{ gap: 8, minWidth: 0, flexWrap: 'nowrap' }}><span className="xs muted" style={{ border: '1px solid var(--rule-l)', padding: '1px 5px' }}>{d.ext}</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span></a>
                <span className="row gap8 xs muted" style={{ flexWrap: 'nowrap' }}>v{d.version} · L{d.level} <DeleteDoc id={d.id} /></span>
              </div>
            ))}
            <DocUpload category={c} />
          </div>
        );
      })}
    </div>
  );
}

async function PrivacyView({ businessId, level }: { businessId: string; level: number }) {
  const log = await q(`SELECT action, created_at FROM audit_logs WHERE business_id = $1 ORDER BY created_at DESC LIMIT 15`, [businessId]);
  const advisors = await q(`SELECT al.id, al.invited_contact, al.status, u.name, u.firm FROM advisor_links al LEFT JOIN users u ON u.id = al.advisor_user_id WHERE al.business_id = $1 AND al.status <> 'revoked' ORDER BY al.created_at`, [businessId]);
  return (
    <div className="grid g-auto-380" style={{ gap: 24 }}>
      <div className="col gap16">
        <LevelPicker level={level} />
        <div className="card col gap10">
          <span style={{ fontWeight: 600 }}>Advisors with access</span>
          {advisors.length === 0 && <span className="small muted">No advisors yet. Use &ldquo;+ Invite advisor&rdquo; above.</span>}
          {advisors.map((a) => <div key={a.id} className="row between rule-tl" style={{ paddingTop: 8, fontSize: 13.5 }}><span>{a.name || a.invited_contact}{a.firm ? ' · ' + a.firm : ''}</span><span className="row gap8"><span className={'pill ' + (a.status === 'active' ? 'p-green' : 'p-gold')}>{a.status === 'active' ? 'Active' : 'Invited'}</span><RevokeAdvisor id={a.id} /></span></div>)}
        </div>
      </div>
      <div className="card col gap12">
        <span style={{ fontWeight: 600 }}>Access log</span>
        {log.length === 0 && <span className="small muted">No activity yet.</span>}
        {log.map((g, i) => <div key={i} className="row between rule-tl" style={{ paddingTop: 10, fontSize: 13.5, flexWrap: 'nowrap', gap: 12 }}><span>{g.action}</span><span className="muted" style={{ whiteSpace: 'nowrap' }}>{ago(g.created_at)}</span></div>)}
        <div className="row rule-t" style={{ paddingTop: 14, gap: 18, fontSize: 13.5 }}><a href="/api/export" className="link-u">Download my data</a><Link href="/settings?tab=security" className="link-u" style={{ color: 'var(--warn)' }}>Delete my account</Link></div>
      </div>
    </div>
  );
}

async function OpportunitiesView({ b, requests, deals }: { b: any; requests: any[]; deals: any[] }) {
  const listing = (await q(`SELECT * FROM listings WHERE business_id = $1`, [b.id]))[0] || null;
  return (
    <div className="grid g-auto-420" style={{ gap: 24, alignItems: 'start' }}>
      <div className="col gap12">
        <div className="notice">Nothing is visible to acquirers until your profile is submitted, reviewed by our team, and your visibility is Level 1 or higher. You approve every request individually.</div>
        <ListingForm listing={listing} defaults={{ industry: b.industry || '', years: b.years_band ? b.years_band + ' yrs' : '', location: b.state || '' }} />
      </div>
      <div className="col gap12">
        <span className="eyebrow">Access requests</span>
        {requests.length === 0 && <div className="card small muted">No pending requests. When a verified acquirer asks to learn more, you&rsquo;ll see who they are here and decide.</div>}
        {requests.map((r) => (
          <div key={r.id} className="card col gap10">
            <div className="row between"><span className="serif" style={{ fontSize: 20 }}>{r.buyer_type || 'Acquirer'}</span><span className="xs muted">{ago(r.created_at)}</span></div>
            <span className="small t2">Capital {r.capital || '—'} · Experience {r.experience || '—'} · {r.involvement || '—'} · Timeline {r.timeline || '—'}</span>
            <span className="xs" style={{ color: r.verification_stage >= 2 ? 'var(--green)' : 'var(--muted)' }}>{['Registered', 'Profile complete', 'Identity verified', 'Financially verified', 'Qualified'][r.verification_stage ?? 1]}</span>
            {r.message && <span className="small" style={{ borderLeft: '2px solid var(--green)', paddingLeft: 10 }}>{r.message}</span>}
            <RequestDecision id={r.id} />
          </div>
        ))}
        {deals.length > 0 && <>
          <span className="eyebrow" style={{ marginTop: 12 }}>Active deal workspaces</span>
          {deals.map((d) => <Link key={d.id} href={'/deals/' + d.id} className="card row between"><span>Workspace {d.ref}</span><span>Open →</span></Link>)}
        </>}
      </div>
    </div>
  );
}

function LockedTasks({ n }: { n: number }) {
  return (
    <div className="row between" style={{ gap: 16, padding: '18px 20px', border: '1px dashed var(--ink)', background: 'var(--tint)' }}>
      <span className="t2" style={{ fontSize: 14.5 }}>{n} more tasks in your prioritised readiness plan, with due dates and score impact.</span>
      <Link href="/report#unlock" className="btn btn-green btn-sm">Unlock the full plan →</Link>
    </div>
  );
}
