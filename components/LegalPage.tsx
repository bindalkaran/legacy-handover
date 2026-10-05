import type { ReactNode } from 'react';
import Link from 'next/link';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { COMPANY, ADDRESS_LINE, POLICY_UPDATED } from '@/lib/company';

export type Section = [string, ReactNode];

export const P = ({ children }: { children: ReactNode }) => <p className="t2" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7 }}>{children}</p>;
export const UL = ({ items }: { items: ReactNode[] }) => <ul className="t2" style={{ margin: 0, paddingLeft: 20, fontSize: 15.5, lineHeight: 1.7, display: 'grid', gap: 6 }}>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;

export function ContactBlock({ grievance }: { grievance?: boolean }) {
  return (
    <div className="card col gap6" style={{ fontSize: 15 }}>
      {grievance && <span><b>Grievance Officer:</b> {COMPANY.grievanceOfficer}</span>}
      <span><b>{COMPANY.legalName}</b> ({COMPANY.entity}), operator of {COMPANY.brand}</span>
      <span>{ADDRESS_LINE}</span>
      <span>Email: <a className="link-u" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></span>
      <span>Phone: <a className="link-u" href={COMPANY.phoneHref}>{COMPANY.phone}</a></span>
    </div>
  );
}

export default function LegalPage({ title, intro, sections }: { title: string; intro?: ReactNode; sections: Section[] }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <SiteHeader />
      <main className="wrap-m col gap28" style={{ paddingTop: 56, paddingBottom: 96, maxWidth: 820 }}>
        <div className="col gap12">
          <span className="eyebrow">Legal</span>
          <h1 className="h1">{title}</h1>
          <span className="small muted">Last updated {POLICY_UPDATED}. {COMPANY.brand} is operated by {COMPANY.legalName}, {COMPANY.address.city}.</span>
          {intro && <P>{intro}</P>}
        </div>
        <nav className="col gap4 small" aria-label="On this page" style={{ borderLeft: '1px solid var(--rule-l)', paddingLeft: 16 }}>
          {sections.map(([h], i) => <a key={h} href={`#s${i + 1}`} className="muted">{i + 1}. {h}</a>)}
        </nav>
        {sections.map(([h, body], i) => (
          <section key={h} id={`s${i + 1}`} className="col gap10" style={{ scrollMarginTop: 24 }}>
            <h2 className="serif" style={{ fontWeight: 400, fontSize: 24, margin: 0 }}>{i + 1}. {h}</h2>
            {typeof body === 'string' ? <P>{body}</P> : body}
          </section>
        ))}
        <div className="row gap16 small rule-t" style={{ paddingTop: 20 }}>
          {[['/terms', 'Terms of use'], ['/privacy', 'Privacy policy'], ['/refund-policy', 'Refund & cancellation'], ['/delivery-policy', 'Delivery policy'], ['/contact', 'Contact']].map(([h, t]) => <Link key={h} href={h} className="link-u">{t}</Link>)}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
