import { q, config } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import SiteHeader from '@/components/SiteHeader';
import ProsClient from './ProsClient';

export const metadata = { title: 'Professional directory', description: 'CAs, lawyers, valuers and lenders who do succession work for owner-led Indian businesses.' };
export const dynamic = 'force-dynamic';

export default async function Professionals() {
  const showSamples = await config<boolean>('show_samples', true);
  const pros = await q(`SELECT id, name, firm, pro_type, city, languages, expertise, transitions, rating, fees_from, is_sample, contact FROM professionals WHERE status = 'listed' ${showSamples ? '' : 'AND NOT is_sample'} ORDER BY is_sample, transitions DESC`);
  const user = await currentUser();
  return (
    <div style={{ minHeight: '100vh' }}>
      <SiteHeader active="Professionals" />
      <ProsClient pros={pros.map((p) => ({ ...p, contact: undefined, invitable: !!p.contact }))} signedIn={!!user && user.role === 'owner'} />
    </div>
  );
}
