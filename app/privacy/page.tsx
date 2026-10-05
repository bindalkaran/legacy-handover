import Link from 'next/link';
import LegalPage, { P, UL, ContactBlock } from '@/components/LegalPage';
import { COMPANY } from '@/lib/company';

export const metadata = {
  title: 'Privacy policy',
  description: 'How Legacy Handover, operated by Bindal Infotech, collects, uses, shares and protects personal data, in line with the Digital Personal Data Protection Act, 2023.',
  alternates: { canonical: '/privacy' }
};

export default function Privacy() {
  return <LegalPage
    title="Privacy policy"
    intro={<>This policy explains what personal data {COMPANY.brand} collects, why, who it is shared with, and the rights you have. {COMPANY.legalName} ({COMPANY.entity}) is the Data Fiduciary for this data under the Digital Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;).</>}
    sections={[
      ['Data we collect', <UL key="c" items={[
        <><b>Sign-in details:</b> your mobile number. Phone sign-in is handled by Google Firebase Authentication, which sends the one-time code by SMS.</>,
        <><b>Profile details you give us:</b> name, role (owner, acquirer or advisor), firm, city, and whether you agree to matching and to product news.</>,
        <><b>Assessment answers</b> about your business and your role in it, and the scores and report calculated from them.</>,
        <><b>Business information you add:</b> business name, legal name, city, state, GSTIN, tasks, and documents you upload to your account or a deal workspace.</>,
        <><b>Acquirer profile:</b> capital range, experience, sectors and regions of interest.</>,
        <><b>Deal workspace records:</b> access requests, NDA acceptances, questions and answers, offers, and checklist activity.</>,
        <><b>Callback requests:</b> the name and phone number you enter in the &ldquo;Prefer to talk first?&rdquo; form.</>,
        <><b>Payment records:</b> amount, status, method type and the payment reference returned by Razorpay. Card, UPI and bank credentials are entered on Razorpay&rsquo;s checkout and never reach our servers.</>,
        <><b>Activity and security logs:</b> sign-ins, views, downloads and permission changes on your account, and product events such as &ldquo;assessment completed&rdquo;, stored in our own database. We do not use third-party analytics or advertising trackers.</>
      ]} />],
      ['Why we use it', <>
        <P>We process personal data on the basis of your consent, which you give when you create an account or submit a form, and for the legitimate uses the DPDP Act allows, such as complying with law. We use it to:</P>
        <UL items={['sign you in and keep your account secure;', 'calculate your scores and write your report and readiness plan;', 'run the confidential marketplace and deal workspaces you choose to use;', 'process payments and refunds, and keep the records the law requires;', 'reply to callback requests and support messages;', 'prevent fraud and misuse.']} />
        <P>Scores are calculated by fixed, versioned rules. We do not use automated systems to make legal or similarly significant decisions about you. We do not sell personal data and we never contact your staff, customers, suppliers or family.</P>
      </>],
      ['Who can see your data', <UL key="w" items={[
        <><b>You</b> see everything in your account.</>,
        <><b>Advisors you invite</b> see your scores, tasks and documents until you revoke their access.</>,
        <><b>Acquirers</b> see nothing about your business until you move your visibility above Level 0, submit an anonymous profile, it passes our review, and you approve their individual request. More detail follows only after both sides accept the NDA, and data-room access is granted by you.</>,
        <><b>Our team</b> sees what is needed to review profiles, verify businesses and acquirers, and provide support.</>
      ]} />],
      ['Service providers we share data with', <>
        <P>We use these providers to run the service. Each receives only what it needs for that task:</P>
        <UL items={[
          <><b>Vercel Inc.</b> hosts the website and application.</>,
          <><b>Neon</b> provides the Postgres database where account data and uploaded documents are stored.</>,
          <><b>Google LLC (Firebase Authentication)</b> sends sign-in codes by SMS and verifies them; it uses Google reCAPTCHA to block automated abuse.</>,
          <><b>Razorpay Software Private Limited</b> processes payments and refunds.</>
        ]} />
        <P>Some of these providers may process data outside India. We will only transfer data to countries not restricted by the Government of India under section 16 of the DPDP Act. We may also disclose data where required by law, a court order or a government authority.</P>
      </>],
      ['Cookies and similar storage', <>
        <P>We use only cookies needed for the service to work:</P>
        <UL items={[<><code>lh_session</code> keeps you signed in for up to 30 days.</>, <><code>lh_draft</code> saves an assessment you started before signing in.</>, <><code>lh_invite</code> remembers an advisor invitation link you opened.</>]} />
        <P>On the sign-in page, Google reCAPTCHA (part of Firebase Authentication) may set its own cookies to tell people from bots. We do not use advertising or analytics cookies, so there is no cookie banner.</P>
      </>],
      ['How long we keep data', <UL key="r" items={[
        'Account data is kept while your account is open.',
        'When you delete your account in Settings, we delete your assessments, businesses without a deal history, acquirer profile, saved searches and advisor links, and remove your phone, email, name, firm and city from your user record.',
        'Records of a deal workspace are kept while the deal is active and afterwards for as long as the other party’s rights or the law require, so you cannot delete an account with an active deal until it is closed.',
        'Payment records are kept for the period required by Indian tax and accounting law.',
        'Security and audit logs are kept to protect both sides of a transaction and to answer disputes.'
      ]} />],
      ['Your rights', <>
        <P>Under the DPDP Act you can ask us to give you a summary of your data and how it is processed, correct or complete it, erase it, and withdraw consent. You can also nominate another person to exercise these rights if you die or become unable to. Most of this you can do yourself:</P>
        <UL items={[<>download all your data from <Link className="link-u" href="/settings">Settings</Link>;</>, 'edit your profile and business details in your dashboard;', 'revoke an advisor or acquirer’s access at any time;', 'delete your account from Settings (confirmed with a one-time code).']} />
        <P>Withdrawing consent does not affect processing that happened before you withdrew it. For anything else, write to the Grievance Officer below.</P>
      </>],
      ['Security', 'Connections to the site use HTTPS. Data is encrypted at rest by our database provider. Sign-in uses one-time codes rather than passwords, and every request for a document or deal record is checked against your permissions on our server and logged. No system is perfectly secure; if a breach affects your personal data we will inform you and the Data Protection Board of India as the law requires.'],
      ['Children', `${COMPANY.brand} is meant for business owners, acquirers and professional advisors. It is not directed at anyone under 18, and we do not knowingly collect children’s data. If you believe a child has given us data, contact us and we will delete it.`],
      ['Changes to this policy', 'If we change how we use personal data, we will update this page and the date above, and tell signed-in users about significant changes before they take effect.'],
      ['Grievance Officer and contact', <>
        <P>For questions, requests or complaints about personal data, contact our Grievance Officer. We will acknowledge your message and respond within the time required by applicable law. If you are not satisfied with our response, you may complain to the Data Protection Board of India.</P>
        <ContactBlock grievance />
      </>]
    ]}
  />;
}
