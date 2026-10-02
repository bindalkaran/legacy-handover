import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
export default function LegalPage({ title, sections }: { title: string; sections: [string, string][] }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <SiteHeader />
      <main className="wrap-m col gap24" style={{ paddingTop: 56, paddingBottom: 96, maxWidth: 820 }}>
        <h1 className="h1">{title}</h1>
        <div className="notice">Draft for review by your legal counsel before launch. Last updated October 2026.</div>
        {sections.map(([h, p]) => <section key={h} className="col gap8"><h2 className="serif" style={{ fontWeight: 400, fontSize: 24, margin: 0 }}>{h}</h2><p className="t2" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7 }}>{p}</p></section>)}
      </main>
      <SiteFooter />
    </div>
  );
}
