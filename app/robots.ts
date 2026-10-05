import type { MetadataRoute } from 'next';
import { COMPANY } from '@/lib/company';

// Public pages are open to search engines and AI assistants (GPTBot, ClaudeBot,
// PerplexityBot, Google-Extended and others follow the '*' rule). Account areas stay out.
const PRIVATE = ['/admin', '/dashboard', '/acquirer', '/deals/', '/settings', '/passport', '/invoice/', '/api/', '/sign-in', '/advisor/client/'];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || COMPANY.site;
  return {
    rules: [{ userAgent: '*', allow: ['/', '/report/sample', '/llms.txt', '/llms-full.txt'], disallow: [...PRIVATE, '/report$'] }],
    sitemap: base + '/sitemap.xml',
    host: base
  };
}
