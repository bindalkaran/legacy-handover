import LegalPage, { ContactBlock } from '@/components/LegalPage';
import { COMPANY } from '@/lib/company';

export const metadata = {
  title: 'Refund and cancellation policy',
  description: 'Legacy Handover takes no payments on its website: the assessment and Detailed Report are free. How the Readiness Program handles fees and cancellation.',
  alternates: { canonical: '/refund-policy' }
};

export default function RefundPolicy() {
  return <LegalPage
    title="Refund and cancellation policy"
    intro={`${COMPANY.brand} does not currently take any payment on its website, so there is nothing to refund for online use.`}
    sections={[
      ['Free services', 'The assessment and three scores are free, and the Detailed Report (regular price ₹2,999) is free for a limited time. No card, UPI or bank details are asked for, and there are no subscriptions or automatic charges.'],
      ['Readiness Program', 'The Readiness Program is quoted after a call. Its fee, payment schedule, cancellation and any refund are agreed in a written engagement before any work starts or any payment is made, and that engagement governs.'],
      ['Cancelling your account', 'You can stop using the service at any time and delete your account from Settings, confirmed with a one-time code.'],
      ['If paid features are introduced', 'If we start charging for anything on the website, we will publish the price and the refund terms on this page before any payment is possible.'],
      ['Contact', <ContactBlock key="c" />]
    ]}
  />;
}
