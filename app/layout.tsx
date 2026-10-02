import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://legacy-handover.vercel.app'),
  title: { default: 'Legacy Handover — Plan the handover. Protect the legacy.', template: '%s — Legacy Handover' },
  description: 'A private, seven-minute succession assessment for owners of established Indian businesses. See how transferable your business is and which succession paths fit. No listing. No obligation to sell.',
  openGraph: { type: 'website', siteName: 'Legacy Handover', locale: 'en_IN' },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = { themeColor: '#F4F0E8', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=zodiak@300,301,400&f[]=switzer@400,500,600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
