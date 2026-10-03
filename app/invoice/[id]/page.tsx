import { notFound } from 'next/navigation';
import { requireUser, fmtDate } from '@/lib/guard';
import { one } from '@/lib/db';
import Wordmark from '@/components/Wordmark';
import PrintButton from '@/components/PrintButton';

export const metadata = { title: 'Invoice' };
const rs = (p: number) => '₹' + (p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser('/settings?tab=billing');
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const p = await one(`SELECT * FROM payments WHERE id = $1 AND user_id = $2`, [id, user.id]);
  if (!p) notFound();
  const net = p.amount_paise - p.gst_paise;
  return (
    <main className="wrap-m col gap24" style={{ maxWidth: 760, padding: '48px 24px 96px' }}>
      <div className="row between"><Wordmark /><PrintButton /></div>
      <div className="row between rule-b" style={{ paddingBottom: 18, alignItems: 'flex-end' }}>
        <h1 className="serif" style={{ fontWeight: 300, fontSize: 40, margin: 0 }}>{p.provider === 'test' ? 'Receipt (test mode)' : 'Tax invoice'}</h1>
        <div className="col gap4 small" style={{ textAlign: 'right' }}><span>{p.invoice_no}</span><span className="muted">{fmtDate(p.created_at)}</span></div>
      </div>
      <div className="col gap4 small"><span className="muted">Billed to</span><span>{user.name || user.phone || user.email}</span></div>
      <div className="table">
        {[[p.item, rs(net)], ['GST (18%)', rs(p.gst_paise)], ['Total', rs(p.amount_paise)]].map(([k, v], i) => (
          <div key={k} className="trow" style={{ gridTemplateColumns: '1fr auto', fontWeight: i === 2 ? 600 : 400 }}><span>{k}</span><span className="tab">{v}</span></div>
        ))}
      </div>
      <span className="small muted">Status: {p.status === 'paid' ? 'Paid' : p.status === 'refunded' ? 'Refunded' : p.status === 'created' ? 'Pending' : 'Failed'}{p.method ? ' · ' + p.method : ''}{p.provider_payment_id ? ' · Ref ' + p.provider_payment_id : ''}</span>
      {p.provider === 'test' && <span className="notice">Issued in test mode. No money was charged.</span>}
      <span className="xs muted" style={{ lineHeight: 1.6 }}>Supplier GSTIN and registered address will appear here once configured. Refund requests within 7 days of a one-time purchase.</span>
    </main>
  );
}
