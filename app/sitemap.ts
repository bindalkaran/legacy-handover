import type { MetadataRoute } from 'next';
import { GUIDES } from '@/lib/guides';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://legacyhandover.com';
  return ['', '/assessment', '/acquire', '/professionals', '/advisor', '/report/sample', '/privacy', '/terms', ...GUIDES.map((g) => '/guides/' + g.slug)].map((p) => ({ url: base + p, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.7 }));
}
