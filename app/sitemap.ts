import type { MetadataRoute } from 'next';
import { GUIDES } from '@/lib/guides';
import { COMPANY } from '@/lib/company';

const UPDATED = new Date('2026-10-05');

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || COMPANY.site;
  const pages: [string, number, MetadataRoute.Sitemap[number]['changeFrequency']][] = [
    ['', 1, 'weekly'], ['/assessment', 0.9, 'monthly'], ['/report/sample', 0.8, 'monthly'], ['/guides', 0.8, 'weekly'],
    ...GUIDES.map((g) => ['/guides/' + g.slug, 0.8, 'monthly'] as [string, number, 'monthly']),
    ['/faq', 0.7, 'monthly'], ['/about', 0.6, 'monthly'], ['/acquire', 0.6, 'daily'], ['/professionals', 0.5, 'weekly'], ['/advisor', 0.5, 'monthly'], ['/contact', 0.5, 'yearly'],
    ['/privacy', 0.3, 'yearly'], ['/terms', 0.3, 'yearly'], ['/refund-policy', 0.3, 'yearly'], ['/delivery-policy', 0.3, 'yearly']
  ];
  return pages.map(([p, priority, changeFrequency]) => ({ url: base + p, lastModified: UPDATED, changeFrequency, priority }));
}
