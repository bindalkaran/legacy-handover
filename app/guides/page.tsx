import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Photo from '@/components/Photo';
import GuideHashRedirect from '@/components/GuideHashRedirect';
import { GUIDES } from '@/lib/guides';
import { breadcrumbJsonLd, JsonLd } from '@/lib/seo';

export const metadata = {
  title: 'Succession guides for Indian business owners',
  description: 'Plain-language guides on family business succession, management buyouts, business valuation and preparing to step back, written for owners of established Indian businesses.',
  alternates: { canonical: '/guides' }
};

export default function Guides() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <GuideHashRedirect />
      <JsonLd data={breadcrumbJsonLd([['Home', '/'], ['Guides', '/guides']])} />
      <SiteHeader active="Guides" />
      <main className="wrap col gap32" style={{ paddingTop: 56, paddingBottom: 96 }}>
        <div className="col gap12" style={{ maxWidth: 720 }}>
          <span className="eyebrow">Guides</span>
          <h1 className="h1">Succession, explained without jargon.</h1>
          <p className="t2" style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>Four short guides on the decisions owners face when they start thinking about who runs the business next. General education, not legal, tax or investment advice.</p>
        </div>
        <div className="grid g-auto-260" style={{ gap: 24 }}>
          {GUIDES.map((g) => (
            <Link key={g.slug} href={'/guides/' + g.slug} className="col gap12">
              <Photo src={g.img} caption={g.ph} sizes="(max-width: 760px) 100vw, 25vw" style={{ aspectRatio: '4/3' }} />
              <span className="eyebrow">{g.read}</span>
              <span className="serif" style={{ fontSize: 24, lineHeight: 1.2 }}>{g.title}</span>
              <span className="t2" style={{ fontSize: 15, lineHeight: 1.55 }}>{g.intro}</span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
