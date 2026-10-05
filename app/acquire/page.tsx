import { q, config } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import AcquireClient from './AcquireClient';

export const metadata = { title: 'Acquire an established Indian business', description: 'Confidential profiles of established Indian businesses whose owners are planning succession. Profiles are reviewed, owners approve every request, and details unlock under NDA.', alternates: { canonical: '/acquire' } };
export const dynamic = 'force-dynamic';

export default async function Acquire() {
  const showSamples = await config<boolean>('show_samples', true);
  const listings = await q(`SELECT id, industry, title, description, revenue_band, location, years, transferability_band, deal_note, verification, open_international, is_sample FROM listings WHERE status = 'published' ${showSamples ? '' : 'AND NOT is_sample'} ORDER BY is_sample, updated_at DESC`);
  const user = await currentUser();
  const profile = user ? (await q(`SELECT 1 FROM buyer_profiles WHERE user_id = $1`, [user.id])).length > 0 : false;
  const requested = user ? (await q(`SELECT listing_id FROM access_requests WHERE buyer_id = $1`, [user.id])).map((r) => r.listing_id) : [];
  const savedLabels = user ? (await q(`SELECT label FROM saved_searches WHERE user_id = $1`, [user.id])).map((r) => r.label as string) : [];
  return <AcquireClient listings={listings as any} signedIn={!!user} hasProfile={profile} requested={requested} savedLabels={savedLabels} />;
}
