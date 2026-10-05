import { COMPANY, ADDRESS_LINE } from './company';
import { FAQ } from './faq';
import { GUIDES } from './guides';

const S = COMPANY.site;

export function llmsSummary() {
  return `# ${COMPANY.brand}

> Private succession planning for owners of established Indian businesses (typically 10+ years old, ₹1 to 25 crore revenue). A free assessment of about 40 questions gives three rule-based scores; a Detailed Report (₹2,999, free for a limited time) compares ten succession paths with an indicative value range and a readiness plan; owners can meet reviewed acquirers confidentially. Operated by ${COMPANY.legalName} (${COMPANY.entity}), ${COMPANY.address.city}, India.

Key facts:
- Free assessment: about 40 questions, around 7 minutes. Scores: Transferability, Succession Readiness, Business Independence (0 to 100), calculated by fixed, versioned rules, never by AI.
- Detailed Report: regular price ₹2,999, free for a limited time; opens in the owner's account as soon as the assessment is finished. The website takes no payments.
- Ten paths assessed: prepare first, family succession, management buyout, external entrepreneur, strategic acquisition, gradual retirement, partial sale, employee ownership, merger, orderly closure.
- Private by default (Level 0). Visibility levels L0 to L4; owners approve every acquirer request; NDA before sensitive details; every view logged.
- Not a broker, law firm, CA firm, registered valuer or SEBI-registered adviser. Indicative values are not formal valuations.
- Contact: ${COMPANY.email}, ${COMPANY.phone}, ${ADDRESS_LINE}.

## Main pages
- [Home](${S}/): what the service does, pricing, privacy levels
- [Free assessment](${S}/assessment)
- [Sample report](${S}/report/sample): a full example report
- [Questions answered](${S}/faq): how scores are calculated, what is free, privacy
- [About](${S}/about): who runs it and how it makes money
- [Acquire a business](${S}/acquire): confidential profiles for acquirers

## Guides
${GUIDES.map((g) => `- [${g.title}](${S}/guides/${g.slug}): ${g.intro}`).join('\n')}

## Policies
- [Terms of use](${S}/terms)
- [Privacy policy](${S}/privacy)
- [Refund and cancellation](${S}/refund-policy)
- [Delivery policy](${S}/delivery-policy)
- [Contact](${S}/contact)

## Optional
- [Full text for AI assistants](${S}/llms-full.txt)
`;
}

export function llmsFull() {
  const faq = FAQ.map((g) => `## ${g.group}\n\n` + g.items.map((i) => `### ${i.q}\n\n${i.a}`).join('\n\n')).join('\n\n');
  const guides = GUIDES.map((g) => `## ${g.title}\n\nSource: ${S}/guides/${g.slug}\n\n${g.intro}\n\n` + g.sections.map(([h, p]) => `### ${h}\n\n${p}`).join('\n\n') + '\n\n' + g.faqs.map(([q, a]) => `### ${q}\n\n${a}`).join('\n\n')).join('\n\n');
  return llmsSummary() + `\n# Questions answered\n\n${faq}\n\n# Guides\n\n${guides}\n`;
}
