import Link from 'next/link';
import LegalPage, { P, ContactBlock } from '@/components/LegalPage';
import { COMPANY } from '@/lib/company';

export const metadata = {
  title: 'Delivery policy',
  description: 'Legacy Handover is a digital service. Assessment results and the Detailed Report appear online in your account. Nothing is shipped.',
  alternates: { canonical: '/delivery-policy' }
};

export default function DeliveryPolicy() {
  return <LegalPage
    title="Delivery policy"
    intro={`${COMPANY.brand} is an online service. We do not sell or ship physical goods.`}
    sections={[
      ['How you receive your results', <>
        <P>Your three scores appear on screen as soon as you finish the assessment, and the Detailed Report opens in your account at <Link className="link-u" href="/report">legacyhandover.com/report</Link> at the same time. You can read it online, download it as a PDF and share it with your advisors.</P>
      </>],
      ['Readiness Program', 'Sessions and deliverables for the Readiness Program are scheduled and delivered online or by phone, on the timeline in its written engagement.'],
      ['Shipping', 'No physical shipping is involved, so there are no shipping charges, delivery addresses or shipping times.'],
      ['If something does not load', 'Refresh the page or sign in again. If your report still does not appear, contact us with the mobile number on your account and we will fix it.'],
      ['Contact', <ContactBlock key="c" />]
    ]}
  />;
}
