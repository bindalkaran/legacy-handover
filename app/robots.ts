import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://legacy-handover.vercel.app';
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/dashboard', '/acquirer', '/deals', '/settings', '/passport', '/report', '/api'] }], sitemap: base + '/sitemap.xml' };
}
