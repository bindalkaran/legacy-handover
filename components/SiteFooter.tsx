import Link from 'next/link';
import { COMPANY, ADDRESS_LINE } from '@/lib/company';

export default function SiteFooter() {
  const col = (title: string, links: [string, string][]) => (
    <div className="col gap10">
      <span style={{ color: 'var(--paper)' }}>{title}</span>
      {links.map(([h, t]) => <Link key={h} href={h} style={{ color: '#B8B2A5' }}>{t}</Link>)}
    </div>
  );
  return (
    <footer style={{ background: 'var(--dark)', color: '#B8B2A5' }}>
      <div className="wrap grid" style={{ padding: '56px 32px 32px', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 40, fontSize: 13.5 }}>
        <div className="col gap12" style={{ gridColumn: '1/-1' }}>
          <span className="serif" style={{ fontSize: 26, color: 'var(--paper)' }}>Legacy <em style={{ fontWeight: 300 }}>Handover</em></span>
          <span>Plan the handover. Protect the legacy.</span>
          <span style={{ fontSize: 12.5, lineHeight: 1.6, maxWidth: 520, color: '#7F7A6F' }}>Indicative values are estimates based on the information provided and our methodology. They are not a formal valuation, or tax, legal or investment advice.</span>
        </div>
        {col('Owners', [['/assessment', 'Succession assessment'], ['/report/sample', 'Sample report'], ['/#pricing', 'Pricing'], ['/guides', 'All guides'], ['/guides/family-business-succession', 'Family business succession'], ['/guides/management-buyout', 'Management buyout'], ['/guides/business-valuation', 'Business valuation'], ['/guides/preparing-to-step-back', 'Preparing to step back']])}
        {col('Acquirers & advisors', [['/acquire', 'Explore businesses'], ['/acquirer', 'Acquirer dashboard'], ['/professionals', 'Professional directory'], ['/advisor', 'Advisor portal']])}
        {col('Company', [['/about', 'About'], ['/contact', 'Contact'], ['/#privacy', 'Privacy & security'], ['/faq', 'Questions answered']])}
        {col('Legal', [['/terms', 'Terms of use'], ['/privacy', 'Privacy policy'], ['/refund-policy', 'Refund & cancellation'], ['/delivery-policy', 'Delivery policy']])}
      </div>
      <div className="wrap col gap6" style={{ padding: '20px 32px 40px', borderTop: '1px solid #2E2C28', fontSize: 12.5, color: '#8A8478', lineHeight: 1.6 }}>
        <span>© {new Date().getFullYear()} {COMPANY.legalName}. {COMPANY.brand} is operated by {COMPANY.legalName} ({COMPANY.entity}), {ADDRESS_LINE}.</span>
        <span><a href={`mailto:${COMPANY.email}`} style={{ color: '#B8B2A5' }}>{COMPANY.email}</a> · <a href={COMPANY.phoneHref} style={{ color: '#B8B2A5' }}>{COMPANY.phone}</a> · Grievance Officer: {COMPANY.grievanceOfficer}</span>
        <span>Photographs on this site are illustrative and do not show real clients.</span>
      </div>
    </footer>
  );
}
