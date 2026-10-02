import LegalPage from '@/components/LegalPage';
export const metadata = { title: 'Privacy policy' };
export default function Privacy() {
  return <LegalPage title="Privacy policy" sections={[
    ['What we collect', 'Your mobile number or email (to sign you in), your assessment answers, the scores calculated from them, tasks, documents you upload, and a log of activity on your account. Acquirers provide profile details about capital, experience and preferences.'],
    ['Private by default', 'Everything starts at Level 0: visible only to you and advisors you invite. Nothing about your business is shown to acquirers unless you move to a higher level, submit an anonymous profile, and approve each individual request.'],
    ['How we use it', 'To calculate your scores, write your report, build your readiness plan, and, only with your consent, match you with acquirers or advisors. We do not sell personal data. We never contact your staff, customers or family.'],
    ['Who can see what', 'Advisors you invite see scores, tasks and documents (view only). Acquirers see an anonymised profile, then more only after you approve them and both sides sign an NDA. Every view, download and permission change is logged and visible to you.'],
    ['Security', 'Data is encrypted in transit and at rest with our database provider. Sign-in uses one-time codes. Access is checked on our servers for every request.'],
    ['Your rights', 'You can download all your data and delete your account at any time from Settings. Records of active transactions may be retained where the law or the other party’s rights require it, in line with the Digital Personal Data Protection Act, 2023.'],
    ['Contact', 'For privacy requests, use the callback form on the home page or write to the grievance officer named in your engagement documents.']
  ]} />;
}
