import Link from 'next/link';
import LegalPage, { P, ContactBlock } from '@/components/LegalPage';
import { COMPANY } from '@/lib/company';

export const metadata = {
  title: 'Delivery policy',
  description: 'Legacy Handover is a digital service. The Detailed Report is delivered online in your account as soon as payment is confirmed. Nothing is shipped.',
  alternates: { canonical: '/delivery-policy' }
};

export default function DeliveryPolicy() {
  return <LegalPage
    title="Delivery policy"
    intro={`${COMPANY.brand} is an online service. We do not sell or ship physical goods.`}
    sections={[
      ['How you receive what you buy', <>
        <P>The Detailed Report (₹2,999) is delivered digitally. As soon as Razorpay confirms your payment, the full report unlocks in your account at <Link className="link-u" href="/report">legacyhandover.com/report</Link>, usually within a minute. You can read it online, download it as a PDF and share it with your advisors.</P>
        <P>The free assessment results appear on screen as soon as you finish the questions.</P>
      </>],
      ['Readiness Program', 'Sessions and deliverables for the Readiness Program are scheduled and delivered online or by phone, on the timeline in its written engagement.'],
      ['Shipping', 'No physical shipping is involved, so there are no shipping charges, delivery addresses or shipping times.'],
      ['If your report does not unlock', <>
        <P>Refresh the report page. If it is still locked 30 minutes after payment, contact us with the mobile number on your account and the payment reference from Razorpay&rsquo;s confirmation, and we will unlock it or refund you in full under our <Link className="link-u" href="/refund-policy">refund policy</Link>.</P>
      </>],
      ['Contact', <ContactBlock key="c" />]
    ]}
  />;
}
