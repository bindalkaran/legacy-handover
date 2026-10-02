import Link from 'next/link';

export default function SiteFooter() {
  const col = (title: string, links: [string, string][]) => (
    <div className="col gap10">
      <span style={{ color: 'var(--paper)' }}>{title}</span>
      {links.map(([h, t]) => <Link key={h} href={h} style={{ color: '#B8B2A5' }}>{t}</Link>)}
    </div>
  );
  return (
    <footer style={{ background: 'var(--dark)', color: '#B8B2A5' }}>
      <div className="wrap grid" style={{ padding: '56px 32px 40px', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 40, fontSize: 13.5 }}>
        <div className="col gap12" style={{ gridColumn: '1/-1' }}>
          <span className="serif" style={{ fontSize: 26, color: 'var(--paper)' }}>Legacy <em style={{ fontWeight: 300 }}>Handover</em></span>
          <span>Plan the handover. Protect the legacy.</span>
          <span style={{ fontSize: 12.5, lineHeight: 1.6, maxWidth: 460, color: '#7F7A6F' }}>Indicative values are estimates based on the information provided and our methodology. They are not a formal valuation, or tax, legal or investment advice.</span>
        </div>
        {col('Owners', [['/assessment', 'Succession assessment'], ['/guides/family-business-succession', 'Family business succession'], ['/guides/management-buyout', 'Management buyout'], ['/guides/business-valuation', 'Business valuation'], ['/guides/preparing-to-step-back', 'Preparing to step back']])}
        {col('Acquirers', [['/acquire', 'Explore businesses'], ['/acquirer', 'Acquirer dashboard'], ['/professionals', 'Professional directory']])}
        {col('Company', [['/#stories', 'Owner stories'], ['/#privacy', 'Privacy & security'], ['/advisor', 'Advisor portal'], ['/privacy', 'Privacy policy'], ['/terms', 'Terms']])}
      </div>
    </footer>
  );
}
