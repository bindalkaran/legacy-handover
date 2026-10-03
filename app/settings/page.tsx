import Link from 'next/link';
import { requireUser, fmtDate } from '@/lib/guard';
import { q } from '@/lib/db';
import Wordmark from '@/components/Wordmark';
import { NotifMatrix, Region, ProfileForm, DeleteAccount } from './SettingsClient';

export const metadata = { title: 'Settings', robots: { index: false } };
export const dynamic = 'force-dynamic';

const TABS = [['notif', 'Notifications'], ['billing', 'Billing & invoices'], ['security', 'Security & data'], ['region', 'Language & region'], ['profile', 'Profile']];
const rs = (p: number) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default async function Settings({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const u = await requireUser('/settings');
  const t = (await searchParams).tab;
  const tab = TABS.some((x) => x[0] === t) ? t! : 'notif';
  const home = u.role === 'buyer' ? '/acquirer' : u.role === 'advisor' ? '/advisor' : '/dashboard';
  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="rule-b"><div className="wrap-m row between" style={{ padding: '14px 28px' }}><Wordmark size={22} /><Link href={home} className="link-u" style={{ fontSize: 13.5 }}>← Dashboard</Link></div></header>
      <main className="wrap-m row" style={{ paddingTop: 40, paddingBottom: 96, alignItems: 'flex-start', gap: 32 }}>
        <nav className="col gap4" style={{ flex: '1 1 200px', maxWidth: '100%' }}>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 34, letterSpacing: '-.025em', margin: '0 0 16px' }}>Settings</h1>
          {TABS.map(([k, l]) => <Link key={k} href={'/settings?tab=' + k} style={{ fontSize: 14.5, padding: '10px 12px', background: tab === k ? 'var(--ink)' : 'transparent', color: tab === k ? 'var(--paper)' : 'var(--ink)' }}>{l}</Link>)}
          <form action="/api/sign-out" method="post"><button style={{ fontSize: 14.5, padding: '10px 12px', border: 0, background: 'none', color: 'var(--muted)' }}>Sign out</button></form>
        </nav>
        <div className="col gap20" style={{ flex: '999 1 min(100%,520px)', minWidth: 0 }}>
          {tab === 'notif' && <NotifMatrix prefs={u.notif_prefs || {}} />}
          {tab === 'billing' && <Billing userId={u.id} />}
          {tab === 'security' && <Security userId={u.id} />}
          {tab === 'region' && <Region language={u.language} country={u.country} />}
          {tab === 'profile' && <ProfileForm u={u} />}
        </div>
      </main>
    </div>
  );
}

async function Billing({ userId }: { userId: string }) {
  const pays = await q(`SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
  const paid = pays.some((p) => p.status === 'paid' && p.item === 'Detailed Report');
  return <>
    <div className="card row between" style={{ gap: 16 }}>
      <div className="col gap4"><span className="eyebrow">Current plan</span><span className="serif" style={{ fontSize: 26 }}>{paid ? 'Detailed Report' : 'Free assessment'}</span><span className="small muted">{paid ? 'One-time purchase · no subscription' : 'Scores, strengths and risks · upgrade any time from your report'}</span></div>
      <Link href="/#pricing" className="btn btn-ghost">See plans</Link>
    </div>
    <div className="table">
      <div className="trow head" style={{ gridTemplateColumns: '120px minmax(180px,1fr) 100px 90px 110px', minWidth: 640 }}><span>Invoice</span><span>Item</span><span>Amount</span><span>GST incl.</span><span>Status</span></div>
      {pays.length === 0 && <div className="trow muted" style={{ minWidth: 640 }}>No invoices yet.</div>}
      {pays.map((p) => <div key={p.id} className="trow" style={{ gridTemplateColumns: '120px minmax(180px,1fr) 100px 90px 110px', minWidth: 640 }}><span className="small muted">{p.invoice_no}</span><span>{p.item}<span className="xs muted" style={{ display: 'block' }}>{fmtDate(p.created_at)}{p.provider === 'test' ? ' · test mode, no charge' : ''}</span></span><span>{rs(p.amount_paise)}</span><span className="muted">{rs(p.gst_paise)}</span><span className="small col gap4" style={{ color: p.status === 'paid' ? 'var(--green)' : 'var(--gold)' }}>{p.status === 'paid' ? 'Paid' : p.status === 'refunded' ? 'Refunded' : p.status === 'created' ? 'Pending' : 'Failed'}<Link href={`/invoice/${p.id}`} className="link-u xs" style={{ color: 'var(--ink)' }}>View / PDF</Link></span></div>)}
    </div>
    <span className="xs muted">Payments via Razorpay. Refund requests within 7 days of a one-time purchase.</span>
  </>;
}

async function Security({ userId }: { userId: string }) {
  const log = await q(`SELECT action, created_at FROM audit_logs WHERE actor_id = $1 AND kind IN ('Security','Consent') ORDER BY created_at DESC LIMIT 8`, [userId]);
  return <>
    {[['Sign-in method', 'One-time code to your verified mobile or email on every new sign-in. Sessions last 30 days.', null], ['Download my data', 'Full export of answers, scores, tasks, document index and logs (JSON)', '/api/export']].map(([t, d, h]) => (
      <div key={t} className="card row between" style={{ gap: 12 }}><div className="col gap4"><span style={{ fontSize: 15 }}>{t}</span><span className="small muted">{d}</span></div>{h && <a href={h} className="btn btn-ghost btn-sm">Request export</a>}</div>
    ))}
    <div className="card col gap8"><span style={{ fontSize: 15 }}>Recent security & consent activity</span>{log.map((l, i) => <div key={i} className="row between small rule-tl" style={{ paddingTop: 6 }}><span>{l.action}</span><span className="muted">{fmtDate(l.created_at, true)}</span></div>)}</div>
    <DeleteAccount />
  </>;
}
