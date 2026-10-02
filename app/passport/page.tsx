import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser, fmtDate } from '@/lib/guard';
import { q, one } from '@/lib/db';
import { passportData, SECTIONS } from '@/lib/passport';
import Wordmark from '@/components/Wordmark';
import PassportView from '@/components/PassportView';
import { ShareBox, RevokeShare } from '@/components/PassportShare';

export const metadata = { title: 'Succession Passport', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function Passport() {
  const user = await requireUser('/passport');
  const b = await one(`SELECT id FROM businesses WHERE owner_id = $1 ORDER BY created_at LIMIT 1`, [user.id]);
  if (!b) redirect('/assessment');
  const data = await passportData(b.id);
  const shares = await q(`SELECT * FROM passport_shares WHERE business_id = $1 AND revoked_at IS NULL AND expires_at > now() ORDER BY created_at DESC`, [b.id]);
  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="rule-b noprint"><div className="wrap-m row between" style={{ padding: '14px 28px' }}><Wordmark size={22} /><Link href="/dashboard" className="link-u" style={{ fontSize: 13.5 }}>← Dashboard</Link></div></header>
      <main className="wrap-m col gap24" style={{ paddingTop: 40, paddingBottom: 96 }}>
        <ShareBox />
        {shares.length > 0 && <div className="card-l col gap6 noprint"><span className="small" style={{ fontWeight: 600 }}>Active links</span>{shares.map((s) => <div key={s.id} className="row between small"><span>{(s.sections as string[]).join(', ')} · expires {fmtDate(s.expires_at, true)} · {s.views} views</span><RevokeShare id={s.id} /></div>)}</div>}
        <PassportView data={data} sections={SECTIONS} />
      </main>
    </div>
  );
}
