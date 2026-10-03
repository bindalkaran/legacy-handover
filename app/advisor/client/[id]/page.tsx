import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { currentUser, hasRole } from '@/lib/auth';
import { q, one, audit } from '@/lib/db';
import { fmtDate } from '@/lib/guard';
import Shell from '@/components/Shell';
import { TaskList, type TaskRow } from '@/components/owner/OwnerClient';
import { NoteBox } from '@/components/AdvisorClient';
import { scopeOf, sharedText, ClientDocs } from '../../shared';

export const metadata = { title: 'Client view', robots: { index: false } };
export const dynamic = 'force-dynamic';

/** Read-only view of one client, limited to the scope the owner shared with this advisor. */
export default async function ClientView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect('/sign-in?role=advisor&next=' + encodeURIComponent('/advisor/client/' + id));
  if (!hasRole(user, 'advisor')) redirect('/advisor');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const link = await one(`SELECT al.scope, b.id AS business_id, b.name, b.industry, b.revenue_band, b.city, b.lifecycle, o.name AS owner_name
    FROM advisor_links al JOIN businesses b ON b.id = al.business_id LEFT JOIN users o ON o.id = b.owner_id
    WHERE al.advisor_user_id = $1 AND al.business_id = $2 AND al.status = 'active'`, [user.id, id]);
  if (!link) notFound();
  const scope = scopeOf(link);
  const score = scope.includes('scores') ? await one(`SELECT transferability, readiness, independence, score_version, created_at FROM scores WHERE business_id = $1 ORDER BY created_at DESC LIMIT 1`, [id]) : null;
  const tasks = scope.includes('tasks') ? await q(`SELECT * FROM tasks WHERE business_id = $1 ORDER BY (status = 'done'), due_date NULLS LAST`, [id]) : [];
  const deal = await one(`SELECT id FROM deals WHERE business_id = $1 ORDER BY created_at DESC LIMIT 1`, [id]);
  await audit({ actorId: user.id, businessId: id, action: `Advisor ${user.name || ''}${user.firm ? ' (' + user.firm + ')' : ''} opened the client view`.replace(/\s+/g, ' '), kind: 'View' });
  const name = link.name || (link.owner_name ? link.owner_name + '’s business' : 'Client');
  const nav = [{ href: '/advisor', label: 'Dashboard' }, { href: '/advisor?view=clients', label: 'Clients', on: true }, { href: '/advisor?view=tasks', label: 'Tasks' }, { href: '/advisor?view=referrals', label: 'Referrals' }];
  return (
    <Shell variant="line" nav={nav} extra={[{ href: '/professionals', label: 'Professional directory' }, { href: '/settings', label: 'Settings' }]}>
      <div className="row between rule-b" style={{ alignItems: 'flex-end', gap: 20, paddingBottom: 20 }}>
        <div className="col gap6"><span className="eyebrow">Client view · read only</span><h1 className="page-title">{name}</h1><span className="small muted">{[link.industry, link.revenue_band, link.city, link.lifecycle].filter(Boolean).join(' · ')}</span></div>
        <Link href={'/advisor?view=clients&client=' + id} className="link-u" style={{ fontSize: 13.5 }}>← Back to clients</Link>
      </div>
      <span className="t2" style={{ fontSize: 13.5 }}>{sharedText(scope)} This visit is logged in the client&rsquo;s access history.</span>
      {scope.includes('scores') && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 0, borderTop: '1px solid var(--ink)', borderLeft: '1px solid var(--ink)' }}>
          {[['Transferability', score?.transferability], ['Succession readiness', score?.readiness], ['Business independence', score?.independence]].map(([k, v]) => (
            <div key={k as string} className="col gap6" style={{ padding: 20, borderRight: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)' }}><span className="xs muted">{k}</span><span className="big" style={{ fontSize: 40 }}>{v ?? '—'}</span></div>
          ))}
        </div>
      )}
      {score && <span className="xs muted">Platform-calculated · {score.score_version} · {fmtDate(score.created_at)}</span>}
      <div className="grid g-auto-420" style={{ gap: 24, alignItems: 'start' }}>
        {scope.includes('tasks') ? (
          <div className="col gap12">
            <span className="eyebrow">Tasks</span>
            <TaskList readonly showFilter={false} tasks={tasks.map((t): TaskRow => ({ id: t.id, title: t.title, category: t.category, priority: t.priority, effort: t.effort, impact: t.impact, why: t.why, criteria: t.criteria, assignee: t.assignee, due: fmtDate(t.due_date), done: t.status === 'done' }))} />
            <span className="eyebrow">Note to client</span>
            <NoteBox businessId={id} />
          </div>
        ) : <div className="card small muted">Tasks are not shared with you.</div>}
        <div className="col gap12">
          {deal && <Link href={'/deals/' + deal.id} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>Deal workspace →</Link>}
          {scope.includes('documents') ? <ClientDocs businessId={id} userId={user.id} /> : <div className="card small muted">Documents are not shared with you.</div>}
        </div>
      </div>
    </Shell>
  );
}
