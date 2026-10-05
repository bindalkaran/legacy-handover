import { COMPANY } from './company';

const ORG_ID = COMPANY.site + '/#organization';

/** Organization + WebSite graph, rendered once in the root layout. */
export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: COMPANY.brand,
        url: COMPANY.site,
        logo: COMPANY.site + '/logo.png',
        email: COMPANY.email,
        telephone: COMPANY.phone,
        description: 'Private succession planning for owners of established Indian businesses: a free assessment, a detailed succession report, and a confidential way to meet successors and acquirers.',
        founder: { '@type': 'Person', name: COMPANY.proprietor },
        parentOrganization: { '@type': 'Organization', name: COMPANY.legalName, address: postal() },
        address: postal(),
        areaServed: { '@type': 'Country', name: 'India' },
        contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', email: COMPANY.email, telephone: COMPANY.phone, areaServed: 'IN' }]
      },
      { '@type': 'WebSite', '@id': COMPANY.site + '/#website', url: COMPANY.site, name: COMPANY.brand, publisher: { '@id': ORG_ID }, inLanguage: 'en-IN' }
    ]
  };
}

function postal() {
  const a = COMPANY.address;
  return { '@type': 'PostalAddress', streetAddress: `${a.line1}, ${a.line2}`, addressLocality: a.city, addressRegion: a.state, postalCode: a.pin, addressCountry: 'IN' };
}

/** The two things a visitor can buy or use, with real prices. */
export function offersJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Business succession assessment and report',
    serviceType: 'Business succession planning',
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'India' },
    url: COMPANY.site + '/assessment',
    offers: [
      { '@type': 'Offer', name: 'Succession assessment with three scores', price: '0', priceCurrency: 'INR', url: COMPANY.site + '/assessment' },
      { '@type': 'Offer', name: 'Detailed Succession Report', price: '0', priceCurrency: 'INR', url: COMPANY.site + '/report/sample', description: 'Regular price ₹2,999, free for a limited time. Ten succession paths, indicative value range with factors, prioritised readiness plan.' }
    ]
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })) };
}

export function breadcrumbJsonLd(trail: [string, string][]) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: COMPANY.site + path })) };
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
