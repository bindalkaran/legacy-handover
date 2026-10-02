import LegalPage from '@/components/LegalPage';
export const metadata = { title: 'Terms of use' };
export default function Terms() {
  return <LegalPage title="Terms of use" sections={[
    ['The service', 'Legacy Handover provides a succession assessment, readiness planning tools, a confidential marketplace and deal workflow software. We coordinate with professionals; we are not a law firm, CA firm, registered valuer, lender or investment advisor.'],
    ['Indicative values', 'This is an indicative estimate based on information provided and platform methodology. It is not a formal valuation, tax opinion, legal opinion or investment recommendation. A qualified professional should be engaged for a formal valuation where required.'],
    ['Automated and AI assistance', 'Scores are calculated by versioned, deterministic rules. Written interpretation and data-room observations may be automated and are labelled as such; verify them with a qualified professional.'],
    ['Deals', 'Offers in the platform are indicative and non-binding until a definitive agreement is signed. Platform workflow stages are not legal completion of a transaction.'],
    ['Payments', 'One-time purchases include GST where stated. Refund requests are accepted within 7 days of a one-time purchase.'],
    ['Acceptable use', 'Do not upload information you have no right to share, misrepresent your identity or funds, or contact a business’s employees, customers or suppliers in breach of an NDA. We may suspend accounts that do.']
  ]} />;
}
