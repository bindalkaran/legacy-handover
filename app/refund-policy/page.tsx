import Link from 'next/link';
import LegalPage, { P, UL, ContactBlock } from '@/components/LegalPage';
import { COMPANY } from '@/lib/company';

export const metadata = {
  title: 'Refund and cancellation policy',
  description: 'Full refund within 7 days of buying the Legacy Handover Detailed Report (₹2,999). How to request a refund, timelines and cancellation.',
  alternates: { canonical: '/refund-policy' }
};

export default function RefundPolicy() {
  return <LegalPage
    title="Refund and cancellation policy"
    intro="We want the Detailed Report to be useful. If it is not, you can have your money back."
    sections={[
      ['What this covers', <UL key="w" items={[
        <><b>Free assessment:</b> no payment is taken, so nothing is refundable.</>,
        <><b>Detailed Report, ₹2,999 one-time:</b> covered by the 7-day refund below.</>,
        <><b>Readiness Program:</b> fees, cancellation and refunds are set out in its written engagement, agreed before any payment.</>
      ]} />],
      ['7-day refund on the Detailed Report', <>
        <P>If you are not satisfied, ask for a refund within 7 days of the payment date. You do not need to give a reason. We refund the full amount paid; there are no deductions or processing fees.</P>
        <P>One refund is available per business. After a refund, the detailed sections of that report are locked again.</P>
      </>],
      ['How to ask for a refund', <UL key="h" items={[
        <>Email <a className="link-u" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> from any address, or call {COMPANY.phone}.</>,
        <>Include the mobile number on your account and the receipt number shown in <Link className="link-u" href="/settings?tab=billing">Settings → Billing</Link> (it starts with LH-INV).</>
      ]} />],
      ['Refund timeline', <>
        <P>We confirm your request and initiate the refund within 5 working days. Refunds go back to the original payment method through Razorpay. Banks usually credit refunds within 5 to 7 working days after we initiate them; UPI refunds are often faster. If you have not received it after 10 working days, contact us with the receipt number and we will share the refund reference.</P>
        <P>If money was debited but your report did not unlock, the payment is matched to your account automatically once Razorpay confirms it. If that has not happened within 30 minutes, contact us and we will unlock the report or refund you in full.</P>
      </>],
      ['Cancellation', 'The Detailed Report is a one-time purchase, not a subscription, so there is nothing to cancel and no future charges. A payment started but not completed is not charged. You can delete your account at any time from Settings.'],
      ['Contact', <ContactBlock key="c" />]
    ]}
  />;
}
