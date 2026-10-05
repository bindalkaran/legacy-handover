import Link from 'next/link';
import LegalPage, { P, UL, ContactBlock } from '@/components/LegalPage';
import { COMPANY } from '@/lib/company';

export const metadata = {
  title: 'Terms of use',
  description: 'The terms that apply when you use Legacy Handover, the succession assessment and confidential business-transfer platform operated by Bindal Infotech.',
  alternates: { canonical: '/terms' }
};

export default function Terms() {
  return <LegalPage
    title="Terms of use"
    intro={<>These terms are an agreement between you and {COMPANY.legalName} ({COMPANY.entity}, &ldquo;we&rdquo;), which operates {COMPANY.brand} at {COMPANY.site}. By creating an account or submitting a form, you accept these terms and our <Link className="link-u" href="/privacy">privacy policy</Link>.</>}
    sections={[
      ['Who can use the service', 'You must be at least 18 and able to enter a binding contract under Indian law. If you use the service on behalf of a business, you confirm you are authorised to do so. You are responsible for keeping your phone number current and for activity on your account.'],
      ['What the service is', <>
        <P>{COMPANY.brand} provides:</P>
        <UL items={['a free succession assessment of about 40 questions, with three scores calculated by fixed, published rules;', 'a Detailed Report (regular price ₹2,999, free for a limited time) covering ten succession paths, an indicative value range with its factors, and a prioritised readiness plan;', 'readiness planning tools, document storage and advisor access;', 'a confidential marketplace where owners can share an anonymous profile with verified acquirers, and deal workspaces for NDAs, questions, offers and closing checklists;', 'a Readiness Program delivered under a separate written engagement and quoted after a call.']} />
      </>],
      ['What we are not', <>
        <P>We are a software platform. We are not a law firm, chartered accountant, registered valuer, stock broker, merchant banker, investment adviser registered with SEBI, lender or business broker, and we do not act as an agent for either side of a transaction. We never collect, hold or transfer money for a sale, purchase or investment between users; the only payments made on the platform are for our own services, such as the Detailed Report. Nothing on the platform is legal, tax, accounting or investment advice.</P>
        <P><b>Indicative values</b> are estimates based on the information you provide and our methodology. They are not a formal valuation under the Companies Act, 2013 or any other law, and should not be relied on for a transaction, a tax filing or lending. Engage a qualified professional where a formal valuation or opinion is needed.</P>
        <P>We do not guarantee that a successor, buyer or financing will be found, that a transaction will close, or any outcome.</P>
      </>],
      ['Your information', 'You confirm that what you enter is accurate to the best of your knowledge and that you have the right to upload any document you share. You keep ownership of your information. You give us a limited licence to store, process and display it only as needed to provide the service and as you direct through the platform’s visibility levels and sharing controls.'],
      ['Marketplace and deal workspaces', <UL key="m" items={[
        'Owner profiles are anonymous and reviewed before acquirers can see them. Owners approve each acquirer request individually.',
        'Verification labels describe the checks we completed at the time. They are not a warranty about the business or the acquirer; each side must do its own due diligence.',
        'Both sides must accept the platform NDA before sensitive information is shared. You must keep information received through a deal workspace confidential and use it only to evaluate that transaction.',
        'You must not contact a business’s employees, customers, suppliers or lenders about a transaction without the owner’s written consent.',
        'Offers and stages recorded on the platform are indicative and non-binding. A transaction is legally complete only when the parties sign a definitive agreement outside the platform.'
      ]} />],
      ['Payments', <>
        <P>The assessment and scores are free. The Detailed Report has a regular price of ₹2,999 and is free for a limited time; no payment is taken on this website. When the offer ends, or if we introduce other paid features, the price will be shown clearly before you pay and these terms will be updated first.</P>
        <P>The Readiness Program is quoted after a call. Its fees, scope, payment and refunds are agreed in a written engagement before any work starts. {COMPANY.legalName} is not registered under GST, so no GST is charged.</P>
      </>],
      ['Acceptable use', <UL key="a" items={['Do not misrepresent your identity, your authority, your business or your funds.', 'Do not upload anything unlawful, or anything you do not have the right to share.', 'Do not scrape, copy or resell listings or reports, or try to identify an anonymous business.', 'Do not interfere with the service, other accounts, or its security.']} />],
      ['Intellectual property', `The platform, its scoring methodology, report formats, guides, text and design belong to ${COMPANY.legalName}. Your report is for your own use and for sharing with your family and advisors.`],
      ['Suspension and termination', 'You can stop using the service and delete your account at any time from Settings, subject to the retention rules in the privacy policy. We may suspend or close an account that breaches these terms, puts other users at risk, or where the law requires it. Sections on confidentiality, intellectual property, liability and disputes continue after termination.'],
      ['Liability', <>
        <P>The service is provided with reasonable skill and care but &ldquo;as is&rdquo;. To the extent the law allows, we are not liable for indirect or consequential loss, loss of profit or business opportunity, decisions you or others take based on a score, report or indicative value, or acts of other users.</P>
        <P>Our total liability for any claim relating to the service is limited to the amount you paid us in the 12 months before the claim. Nothing in these terms limits liability that cannot be limited by law.</P>
      </>],
      ['Indemnity', 'You agree to compensate us for losses and reasonable costs arising from your breach of these terms, including a breach of confidentiality in a deal workspace, or from information you uploaded without the right to do so.'],
      ['Changes', 'We may update these terms as the service changes. We will post the new version here with a new date and notify signed-in users of material changes. Continuing to use the service after the change takes effect means you accept the updated terms.'],
      ['Governing law and disputes', `These terms are governed by the laws of India. The courts at ${COMPANY.jurisdiction} have exclusive jurisdiction. Before going to court, please contact us so we can try to resolve the matter.`],
      ['Contact', <ContactBlock key="ct" />]
    ]}
  />;
}
