import './fonts.css';
import './globals.css';
import { siteJsonLd, JsonLd } from '@/lib/seo';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://legacyhandover.com'),
  title: { default: 'Legacy Handover | Business succession planning for Indian owners', template: '%s | Legacy Handover' },
  description: 'A free, private succession assessment for owners of established Indian businesses. See how transferable your business is, which of ten succession paths fit, and what to fix first. No listing. No obligation to sell.',
  applicationName: 'Legacy Handover',
  authors: [{ name: 'Karan Bindal' }],
  publisher: 'Bindal Infotech',
  openGraph: { type: 'website', siteName: 'Legacy Handover', locale: 'en_IN' },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  formatDetection: { telephone: false }
};

export const viewport: Viewport = { themeColor: '#F4F0E8', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preload" href="/fonts/zodiak-300.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/switzer-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <JsonLd data={siteJsonLd()} />
        {children}
      </body>
    </html>
  );
}
