import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { q, one, audit, track } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return new NextResponse('Sign in required', { status: 401 });
  const d = await one(`SELECT d.*, b.owner_id FROM documents d JOIN businesses b ON b.id = d.business_id WHERE d.id = $1`, [id]);
  if (!d) return new NextResponse('Not found', { status: 404 });
  const wantDownload = new URL(req.url).searchParams.get('download') === '1';
  let allowed = d.owner_id === user.id;
  let dealId: string | null = null;
  let canDownload = allowed;
  if (!allowed) {
    const adv = await one(`SELECT 1 FROM advisor_links WHERE business_id = $1 AND advisor_user_id = $2 AND status = 'active' AND scope ? 'documents'`, [d.business_id, user.id]);
    if (adv) { allowed = true; canDownload = false; }
  }
  if (!allowed) {
    const deal = await one(`SELECT id, buyer_max_level FROM deals WHERE business_id = $1 AND buyer_id = $2`, [d.business_id, user.id]);
    if (deal && d.level <= deal.buyer_max_level && d.permission !== 'Hidden') { allowed = true; dealId = deal.id; canDownload = d.permission === 'View + download'; }
  }
  if (!allowed) return new NextResponse('You do not have access to this document.', { status: 403 });
  if (wantDownload && !canDownload) return new NextResponse('Download is not permitted for this document.', { status: 403 });
  await q(`UPDATE documents SET ${wantDownload ? 'downloads = downloads + 1' : 'views = views + 1'} WHERE id = $1`, [id]);
  if (d.owner_id !== user.id) {
    await audit({ actorId: user.id, businessId: d.business_id, dealId, action: `${wantDownload ? 'Downloaded' : 'Viewed'} ${d.name} v${d.version}`, kind: wantDownload ? 'Download' : 'View' });
    await track(wantDownload ? 'document_downloaded' : 'document_viewed', user.id);
  }
  const buf = Buffer.from(d.data_b64 || '', 'base64');
  const safe = (d.name + '.' + String(d.ext).toLowerCase()).replace(/[^\w.\- ]/g, '_');
  return new NextResponse(buf, {
    headers: {
      'Content-Type': d.mime || 'application/octet-stream',
      'Content-Disposition': `${wantDownload ? 'attachment' : 'inline'}; filename="${safe}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox"
    }
  });
}
