import { notFound } from 'next/navigation';
import { q, one, audit } from '@/lib/db';
import { passportData } from '@/lib/passport';
import Wordmark from '@/components/Wordmark';
import PassportView from '@/components/PassportView';

export const metadata = { title: 'Succession Passport (shared)', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function SharedPassport({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[\w-]{10,40}$/.test(token)) notFound();
  const s = await one(`SELECT * FROM passport_shares WHERE token = $1 AND revoked_at IS NULL AND expires_at > now()`, [token]);
  if (!s) return <main className="wrap-m col gap16" style={{ padding: '96px 24px' }}><Wordmark size={22} /><h1 className="page-title">This link has expired or was revoked.</h1><p className="t2">Ask the owner for a new link.</p></main>;
  await q(`UPDATE passport_shares SET views = views + 1 WHERE id = $1`, [s.id]);
  await audit({ businessId: s.business_id, actorLabel: 'shared-link', action: 'Shared Passport link viewed', kind: 'View' });
  const data = await passportData(s.business_id);
  if (!data) notFound();
  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="rule-b"><div className="wrap-m row between" style={{ padding: '14px 28px' }}><Wordmark size={22} /><span className="xs muted">Read-only · shared by the owner · every view is logged</span></div></header>
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, opacity: 0.06, overflow: 'hidden', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: '90px 60px', padding: 40, transform: 'rotate(-18deg) scale(1.4)', fontSize: 18, whiteSpace: 'nowrap' }}>
        {Array.from({ length: 60 }, (_, i) => <span key={i}>Shared link · {s.id.slice(0, 8)} · {new Date().toLocaleDateString('en-IN')}</span>)}
      </div>
      <main className="wrap-m" style={{ paddingTop: 40, paddingBottom: 96 }}><PassportView data={data} sections={s.sections} /></main>
    </div>
  );
}
