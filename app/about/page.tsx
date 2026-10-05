import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { COMPANY, ADDRESS_LINE } from '@/lib/company';

export const metadata = {
  title: 'About',
  description: 'Legacy Handover helps owners of established Indian businesses plan succession privately: a free assessment, a detailed report and a confidential way to meet successors and acquirers. Operated by Bindal Infotech, Jaipur.',
  alternates: { canonical: '/about' }
};

const P = ({ children }: { children: React.ReactNode }) => <p className="t2" style={{ margin: 0, fontSize: 16.5, lineHeight: 1.75 }}>{children}</p>;
const H = ({ children }: { children: React.ReactNode }) => <h2 className="serif" style={{ fontWeight: 400, fontSize: 28, margin: '12px 0 0' }}>{children}</h2>;

export default function About() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <SiteHeader />
      <main className="wrap-m col gap20" style={{ paddingTop: 56, paddingBottom: 96, maxWidth: 760 }}>
        <span className="eyebrow">About</span>
        <h1 className="h1">Succession planning for the businesses India runs on.</h1>
        <P>{COMPANY.brand} is for owners of established Indian businesses, typically ten years or older with ₹1 to 25 crore in revenue, who want to know what happens to the business when they step back. It starts with a private, free assessment and stays private: nothing about your business is visible to anyone until you choose.</P>

        <H>What it does</H>
        <P>About 40 questions produce three scores: <b>Transferability</b> (could the business run under a new owner), <b>Succession Readiness</b> (how prepared you and the business are for a transition) and <b>Business Independence</b> (how well it runs without you). Scores are calculated by fixed, versioned rules, and every score shows its components and weights.</P>
        <P>The Detailed Report (₹2,999, one time) compares ten paths: preparing first, family succession, management buyout, an external entrepreneur, strategic acquisition, gradual retirement, partial sale, employee ownership, merger and orderly closure. It also gives an indicative value range with the factors behind it, and a prioritised readiness plan you can share with your CA.</P>
        <P>Owners who want to explore a transaction can publish an anonymous profile. Our team reviews every acquirer, owners approve every request, both sides accept an NDA before details are shared, and every view and download is logged.</P>

        <H>What it is not</H>
        <P>We are not a listing site, a broker or a registered valuer. Selling is one of ten outcomes and is never the default. Indicative values are estimates, not formal valuations. We work alongside your CA, lawyer and other advisors rather than replacing them; see our <Link className="link-u" href="/terms">terms</Link>.</P>

        <H>How we make money</H>
        <P>The assessment and scores are free. Owners pay ₹2,999 once for the Detailed Report, and the Readiness Program is quoted after a call. We do not sell data, and we do not charge acquirers to contact owners.</P>

        <H>Who runs it</H>
        <P>{COMPANY.brand} is built and operated by {COMPANY.legalName}, a sole proprietorship of {COMPANY.proprietor}, based at {ADDRESS_LINE}. {COMPANY.proprietor} is the founder and the Grievance Officer for personal data.</P>
        <div className="row gap12" style={{ marginTop: 12 }}>
          <Link href="/assessment" className="btn btn-green">Start the free assessment</Link>
          <Link href="/contact" className="btn btn-ghost">Contact us</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
