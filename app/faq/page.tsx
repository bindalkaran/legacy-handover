import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { FAQ, FAQ_FLAT } from '@/lib/faq';
import { faqJsonLd, breadcrumbJsonLd, JsonLd } from '@/lib/seo';

export const metadata = {
  title: 'Questions answered',
  description: 'How the Legacy Handover succession assessment works, how the three scores are calculated, what the free Detailed Report includes, privacy, and the main succession options for Indian family businesses.',
  alternates: { canonical: '/faq' }
};

export default function Faq() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <JsonLd data={faqJsonLd(FAQ_FLAT)} />
      <JsonLd data={breadcrumbJsonLd([['Home', '/'], ['Questions answered', '/faq']])} />
      <SiteHeader />
      <main className="wrap-m col gap48" style={{ paddingTop: 56, paddingBottom: 96, maxWidth: 860 }}>
        <div className="col gap12">
          <span className="eyebrow">Questions answered</span>
          <h1 className="h1">What owners ask before they start.</h1>
        </div>
        {FAQ.map((g) => (
          <section key={g.group} className="col gap4">
            <h2 className="serif" style={{ fontWeight: 400, fontSize: 28, margin: '0 0 8px' }}>{g.group}</h2>
            {g.items.map((i) => (
              <details key={i.q} className="rule-t" style={{ padding: '18px 0' }}>
                <summary style={{ cursor: 'pointer', fontSize: 17.5, fontWeight: 500, listStyle: 'none' }}>{i.q}</summary>
                <p className="t2" style={{ margin: '12px 0 0', fontSize: 16, lineHeight: 1.7 }}>{i.a}</p>
              </details>
            ))}
          </section>
        ))}
        <div className="row gap12">
          <Link href="/assessment" className="btn btn-green">Start the free assessment</Link>
          <Link href="/contact" className="btn btn-ghost">Ask us something else</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
