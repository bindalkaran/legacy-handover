import { notFound } from 'next/navigation';
import { requireUser, fmtDate } from '@/lib/guard';
import { one } from '@/lib/db';
import Wordmark from '@/components/Wordmark';
import PrintButton from '@/components/PrintButton';
import { COMPANY, ADDRESS_LINE } from '@/lib/company';

export const metadata = { title: 'Payment receipt', robots: { index: false, follow: false } };
const rs = (p: number) => '₹' + (p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser('/settings?tab=billing');
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const p = await one(`SELECT * FROM payments WHERE id = $1 AND user_id = $2`, [id, user.id]);
  if (!p) notFound();
  return (
    <main className="wrap-m col gap24" style={{ maxWidth: 760, padding: '48px 24px 96px' }}>
      <div className="row between"><Wordmark /><PrintButton /></div>
      <div className="row between rule-b" style={{ paddingBottom: 18, alignItems: 'flex-end' }}>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 40, margin: 0 }}>{p.provider === 'test' ? 'Receipt (test mode)' : 'Payment receipt'}</h1>
        <div className="col gap4 small" style={{ textAlign: 'right' }}><span>{p.invoice_no}</span><span className="muted">{fmtDate(p.created_at)}</span></div>
      </div>
      <div className="grid g-auto-260 small" style={{ gap: 20 }}>
        <div className="col gap4"><span className="muted">Issued by</span><span>{COMPANY.legalName} ({COMPANY.entity})</span><span>{ADDRESS_LINE}</span><span>{COMPANY.email} · {COMPANY.phone}</span></div>
        <div className="col gap4"><span className="muted">Received from</span><span>{user.name || user.phone || user.email}</span></div>
      </div>
      <div className="table">
        {[[p.item + ' (' + COMPANY.brand + ')', rs(p.amount_paise)], ['Total paid', rs(p.amount_paise)]].map(([k, v], i) => (
          <div key={k} className="trow" style={{ gridTemplateColumns: '1fr auto', fontWeight: i === 1 ? 600 : 400 }}><span>{k}</span><span className="tab">{v}</span></div>
        ))}
      </div>
      <span className="small muted">Status: {p.status === 'paid' ? 'Paid' : p.status === 'refunded' ? 'Refunded' : p.status === 'created' ? 'Pending' : 'Failed'}{p.method ? ' · ' + p.method : ''}{p.provider_payment_id ? ' · Ref ' + p.provider_payment_id : ''}</span>
      {p.provider === 'test' && <span className="notice">Issued in test mode. No money was charged.</span>}
      <span className="xs muted" style={{ lineHeight: 1.6 }}>{COMPANY.legalName} is not registered under the Goods and Services Tax Act, so no GST has been charged and this is not a tax invoice. Refunds follow the policy at {COMPANY.site}/refund-policy.</span>
    </main>
  );
}
