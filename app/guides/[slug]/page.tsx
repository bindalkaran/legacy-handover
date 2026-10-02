import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import Photo from '@/components/Photo';
import { GUIDES } from '@/lib/guides';

export function generateStaticParams() { return GUIDES.map((g) => ({ slug: g.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  return g ? { title: g.title, description: g.intro, alternates: { canonical: '/guides/' + g.slug } } : {};
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) notFound();
  return (
    <div style={{ minHeight: '100vh' }}>
      <SiteHeader active="Guides" />
      <main className="wrap col" style={{ paddingTop: 48, paddingBottom: 96, gap: 56 }}>
        <nav className="row" style={{ gap: 0, border: '1px solid var(--ink)' }}>
          {GUIDES.map((x) => (
            <Link key={x.slug} href={'/guides/' + x.slug} style={{ flex: '1 1 180px', padding: '14px 16px', fontSize: 14, borderRight: '1px solid var(--ink)', background: x.slug === g.slug ? 'var(--ink)' : 'transparent', color: x.slug === g.slug ? 'var(--paper)' : 'var(--ink)', textAlign: 'center' }}>{x.title}</Link>
          ))}
        </nav>
        <section className="grid g-auto-420" style={{ gap: 56, alignItems: 'end' }}>
          <div className="col gap20">
            <span className="eyebrow">Guide · {g.read}</span>
            <h1 className="h1" style={{ fontSize: 'clamp(38px,4.8vw,64px)' }}>{g.title}</h1>
            <p className="t2" style={{ margin: 0, fontSize: 18, lineHeight: 1.6, maxWidth: 560 }}>{g.intro}</p>
          </div>
          <Photo caption={g.ph} style={{ minHeight: 380 }} />
        </section>
        <section className="col rule-t">
          {g.sections.map(([h, p], i) => (
            <article key={h} className="grid rule-bl" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: '24px 56px', padding: '36px 0' }}>
              <div className="row" style={{ gap: 20, alignItems: 'baseline', flexWrap: 'nowrap' }}><span className="serif" style={{ fontSize: 40, fontWeight: 300, color: 'var(--gold)', lineHeight: 1 }}>{i + 1}</span><h2 className="serif" style={{ fontWeight: 400, fontSize: 26, lineHeight: 1.2, margin: 0 }}>{h}</h2></div>
              <p className="t2" style={{ margin: 0, fontSize: 16, lineHeight: 1.65, gridColumn: 'span 2', maxWidth: 720 }}>{p}</p>
            </article>
          ))}
        </section>
        <section className="panel-green grid g-auto-380" style={{ padding: 40, gap: 32, alignItems: 'center' }}>
          <div className="col gap12"><span className="eyebrow" style={{ color: 'var(--gold-d)' }}>What the assessment shows you</span><p className="serif" style={{ margin: 0, fontWeight: 300, fontSize: 24, lineHeight: 1.3 }}>{g.assess}</p></div>
          <div className="col gap10" style={{ alignItems: 'flex-start' }}><Link href="/assessment" className="btn btn-paper btn-lg">Check my succession readiness →</Link><span className="small" style={{ color: 'var(--on-green-m)' }}>Free · 7 minutes · private by default</span></div>
        </section>
        <section className="col gap16">
          <span className="eyebrow">Other guides</span>
          <div className="grid g-auto-220" style={{ gap: 12 }}>
            {GUIDES.filter((x) => x.slug !== g.slug).map((x) => (
              <Link key={x.slug} href={'/guides/' + x.slug} className="card col gap8"><span className="serif" style={{ fontSize: 21, lineHeight: 1.2 }}>{x.title}</span><span className="muted" style={{ fontSize: 13.5 }}>{x.read} →</span></Link>
            ))}
          </div>
        </section>
      </main>
      <footer style={{ background: 'var(--dark)', color: '#B8B2A5', fontSize: 13 }}>
        <div className="wrap row between" style={{ padding: '28px 32px' }}><span><span className="serif" style={{ fontSize: 17, color: 'var(--paper)' }}>Legacy Handover</span> · Plan the handover. Protect the legacy.</span><span>Guides are general education, not legal, tax or investment advice.</span></div>
      </footer>
    </div>
  );
}
