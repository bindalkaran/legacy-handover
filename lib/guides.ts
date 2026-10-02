export type Guide = { slug: string; title: string; read: string; ph: string; intro: string; assess: string; sections: [string, string][] };

export const GUIDES: Guide[] = [
  { slug: 'family-business-succession', title: 'Family business succession', read: '6 min read', ph: 'Two generations at the family business', intro: 'Handing the business to the next generation is the most common intention among Indian owners, and the most commonly unplanned.', assess: 'Successor readiness and owner dependency are scored separately, so you can see whether the gap is in the person, the business, or both.', sections: [
    ['Start with a real conversation, not an assumption', 'Many successors have never been asked directly. Ask what they want, what they fear and what they would change. Interest, capability and timing are three separate questions; a yes to one is not a yes to all.'],
    ['Separate ownership from management', 'A child can own shares without running the business, or run it without owning it yet. Decide both deliberately. A shareholder agreement and a short family charter prevent most later disputes.'],
    ['Prepare the business, not just the person', 'If customers, suppliers and the bank deal only with you, a successor inherits a title but not the relationships. Transfer them over 24–36 months, one at a time, while you are still there to repair mistakes.'],
    ['Fairness to family members outside the business', 'Equal is not always fair. Insurance, non-business assets or a staged buy-in can balance inheritance for children who are not involved, without splitting control of the company.']
  ] },
  { slug: 'management-buyout', title: 'Management buyout', read: '5 min read', ph: 'Management team around a table', intro: 'Selling to the people who already run the business keeps continuity for customers and staff, if the team and the financing are ready.', assess: 'Management depth and Business Independence scores show whether a buyout is realistic today or a 12–24 month project.', sections: [
    ['Who is really “management”?', 'A buyout needs two or three people who already make decisions without you. If every approval still passes your desk, build the team first. The buyout follows.'],
    ['How it is financed', 'Most Indian MBOs combine seller financing (you are paid over time from profits), bank or NBFC debt, and a modest equity contribution from managers. Expect to remain financially exposed for three to five years.'],
    ['Pricing it fairly', 'Managers know the business well and may under- or over-value it. An independent indicative valuation keeps the conversation factual and protects the relationship.'],
    ['Staying involved without staying in charge', 'A defined advisory role, a board seat or a consulting agreement protects your interests during the earn-out while giving the team real authority.']
  ] },
  { slug: 'business-valuation', title: 'What your business is worth, and why', read: '6 min read', ph: 'Ledgers and a calculator on a desk', intro: 'Owners usually hear a multiple from a friend. Buyers pay for transferable profit, and discount everything that depends on you.', assess: 'The detailed report shows your indicative range and the four factors moving it, so you know what to fix before anyone names a price.', sections: [
    ['Profit is the starting point, not the answer', 'Normalised EBITDA (adding back owner perks, removing one-offs) is multiplied by a factor. For ₹1–25 Cr Indian businesses that factor typically ranges from 2.5× to 6×.'],
    ['What moves the multiple', 'Recurring revenue, documented processes, a second line of management and low customer concentration raise it. Owner dependency, messy records and a single large customer lower it, often by a third.'],
    ['Indicative versus formal', 'Our range is an estimate from your inputs and methodology, useful for planning. A transaction needs a registered valuer and audited accounts.'],
    ['Raising value is mostly preparation', 'The same work that makes a business easier to hand over (records, delegation, contracts) is what buyers pay more for. Two years of preparation often outperforms two years of growth.']
  ] },
  { slug: 'preparing-to-step-back', title: 'Preparing to step back', read: '5 min read', ph: 'Owner handing a file to a colleague', intro: 'Whether the business goes to family, managers or a buyer, the preparation is the same, and it takes longer than most owners expect.', assess: 'Your readiness plan turns these into dated tasks with impact scores, shareable with your CA if you choose.', sections: [
    ['Make yourself unnecessary, deliberately', 'List everything only you do. Hand over one relationship or decision a month. Then test it: does the business run during a two-week absence?'],
    ['Get the paper in order', 'Three years of audited statements, GST reconciled, contracts signed and filed, licences current, employee agreements in place. Most diligence delays are documentation, not disagreement.'],
    ['Build the second line', 'Name a deputy for operations, sales and finance. Give them real authority and let them make mistakes while you are still there to absorb them.'],
    ['Decide what you want afterwards', 'Full exit, advisory role, part-time: your preference shapes which paths fit. Owners who decide this early negotiate better and regret less.']
  ] }
];
