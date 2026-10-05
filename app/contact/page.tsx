import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CallbackForm from '@/components/CallbackForm';
import { ContactBlock } from '@/components/LegalPage';
import { COMPANY } from '@/lib/company';

export const metadata = {
  title: 'Contact',
  description: 'Contact Legacy Handover, operated by Bindal Infotech, Jaipur. Email hello@legacyhandover.com, call +91 96363 69360, or request a private call.',
  alternates: { canonical: '/contact' }
};

export default function Contact() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <SiteHeader />
      <main className="wrap-m col gap32" style={{ paddingTop: 56, paddingBottom: 96, maxWidth: 820 }}>
        <div className="col gap12">
          <span className="eyebrow">Contact</span>
          <h1 className="h1">Talk to us privately.</h1>
          <p className="t2" style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>Questions about the assessment, your report, a payment, or your data. Write, call, or leave your number and we will call you back.</p>
        </div>
        <ContactBlock grievance />
        <section className="col gap12">
          <h2 className="serif" style={{ fontWeight: 400, fontSize: 26, margin: 0 }}>Request a call</h2>
          <CallbackForm />
        </section>
        <section className="col gap8">
          <h2 className="serif" style={{ fontWeight: 400, fontSize: 22, margin: 0 }}>Payments and refunds</h2>
          <p className="t2" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7 }}>Include the mobile number on your account and the receipt number (it starts with LH-INV) so we can find your payment quickly. The Detailed Report has a full refund within 7 days of purchase.</p>
        </section>
        <span className="small muted">{COMPANY.brand} is operated by {COMPANY.legalName}, a sole proprietorship of {COMPANY.proprietor}, in {COMPANY.address.city}, {COMPANY.address.state}.</span>
      </main>
      <SiteFooter />
    </div>
  );
}
