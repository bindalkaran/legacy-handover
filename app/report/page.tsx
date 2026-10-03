import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { ownerContext, toStored } from '@/lib/owner';
import { paymentMode } from '@/lib/payments';
import { track } from '@/lib/db';
import ReportView from '@/components/ReportView';

export const metadata = { title: 'Your Succession Report', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function ReportPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in?next=/report');
  const ctx = await ownerContext(user);
  if (!ctx.score) redirect('/assessment');
  await track('report_viewed', user.id);
  return <ReportView s={toStored(ctx.score)} unlocked={ctx.paid} testMode={paymentMode() === 'test'} level={ctx.business?.confidentiality_level ?? 0} />;
}
