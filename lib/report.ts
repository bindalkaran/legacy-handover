// Deterministic report content derived from scores (PRD §14–16).
// The "interpretation" text is template-based unless an AI narrative is stored.

export type StoredScore = {
  transferability: number; readiness: number; independence: number; dependency: number;
  components: { k: string; s: number; w: number }[];
  value_low: number | null; value_high: number | null; revenue_mid: number; profit: number;
  data_quality: string; inputs: Record<string, number>; labels: Record<string, string | null>;
  score_version: string; assessment_version: string; narrative?: string | null; created_at?: string;
};

export const TIPS: Record<string, string> = {
  'Owner independence': 'Delegate key customer and supplier relationships',
  'Management depth': 'Build and formalise second-line management',
  'Documentation': 'Organise financial and contract records',
  'Customer concentration': 'Reduce reliance on your largest customers',
  'Operations': 'Document core processes as SOPs',
  'Legal readiness': 'Put shareholder agreements and licences in order',
  'Financial quality': 'Clean up and audit three years of financials',
  'Revenue quality': 'Grow recurring or contracted revenue',
  'Employee stability': 'Introduce retention plans for key staff'
};

export const FIT = ['Low fit', 'Medium fit', 'High fit'] as const;

export function weakest(s: StoredScore, n = 3) {
  return [...s.components].sort((x, y) => x.s - y.s).slice(0, n).map((c) => c.k);
}

export function strongest(s: StoredScore, n = 3) {
  return [...s.components].sort((x, y) => y.s - x.s).slice(0, n);
}

export function headline(t: number) {
  return t >= 70 ? 'Your business looks transferable. The next step is making it independent of you.'
    : t >= 55 ? 'A solid foundation, with clear work to do before a smooth handover.'
    : 'There’s meaningful preparation ahead, and time to do it well.';
}

export function interpretation(s: StoredScore) {
  if (s.narrative) return s.narrative;
  const w = weakest(s, 2);
  return 'Your business appears ' + (s.transferability >= 60 ? 'economically established and potentially transferable' : 'established, with transferability still developing') +
    ', but ' + (s.independence < 55 ? 'its current level of owner dependency may make a transition difficult' : 'a few structural gaps could slow a transition') +
    '. Your strongest preparation opportunities are to ' + TIPS[w[0]].toLowerCase() + ' and ' + TIPS[w[1]].toLowerCase() + '.';
}

export function paths(s: StoredScore) {
  const a = s.inputs || {};
  const t = s.transferability;
  const mg = a.managers ?? 1, sl = a.secondLine ?? 1;
  const hasSucc = a.hasSucc;
  const list = [
    { t: 'Prepare first', lvl: t < 70 ? 2 : 1, why: t < 70 ? 'Improving independence and records now will widen every other option and likely raise value.' : 'Your fundamentals are solid; targeted preparation still adds value.' },
    { t: 'Family succession', lvl: hasSucc === 2 ? 0 : a.succWho === 0 ? 2 : 1, why: a.succWho === 0 ? 'A family successor is identified. Readiness depends on structured preparation and role clarity.' : 'No family successor confirmed yet; worth an open conversation before ruling it out.' },
    { t: 'Management buyout', lvl: mg >= 2 && sl >= 1 ? 2 : mg >= 1 ? 1 : 0, why: mg >= 2 ? 'You have decision-makers who could lead. Financing and structure would be the key questions.' : 'A thin management layer makes this harder today; building it is the first step.' },
    { t: 'External entrepreneur', lvl: t >= 65 ? 2 : t >= 50 ? 1 : 0, why: 'Individual acquirers look for transferable, well-documented businesses with steady cash flow.' },
    { t: 'Strategic acquisition', lvl: (a.revenue ?? 1) >= 2 && t >= 60 ? 2 : 1, why: 'Larger companies may value your customers, geography or capabilities beyond the financials.' },
    { t: 'Gradual retirement', lvl: (a.future ?? 1) >= 1 ? 2 : 1, why: 'You indicated you’d like to stay involved in some form; a phased handover can protect continuity.' },
    { t: 'Partial sale', lvl: a.exitType === 1 ? 2 : 1, why: 'Selling a stake can bring in capital or a partner while you remain an owner.' },
    { t: 'Employee ownership', lvl: (a.retention ?? 1) >= 2 && (a.employees ?? 1) >= 2 ? 1 : 0, why: 'Long-tenured teams sometimes suit this, though it needs careful structuring in India.' },
    { t: 'Merger', lvl: (a.revenue ?? 1) >= 2 ? 1 : 0, why: 'Combining with a peer can create scale and a shared succession, but needs aligned owners.' },
    { t: 'Orderly closure', lvl: t < 45 ? 1 : 0, why: 'Rarely the first choice. Planned well, it protects employees, creditors and your reputation.' }
  ];
  return list.sort((x, y) => y.lvl - x.lvl).map((p) => ({ ...p, fit: FIT[p.lvl] }));
}

export const TIMELINE = [
  ['24–36 mo', 'Identify successor, reduce owner dependency, document operations'],
  ['12–24 mo', 'Formalise management, clean financials, prepare valuation'],
  ['6–12 mo', 'Successor or buyer search, financing & diligence prep'],
  ['0–6 mo', 'Negotiation, transaction, handover'],
  ['First 90 days', 'Customer, supplier and employee transition']
];

export function nextActions(s: StoredScore) {
  return [...weakest(s, 3).map((k) => TIPS[k]), 'Identify a preferred succession pathway', 'Invite your CA to review this report'].slice(0, 5);
}

export function valueLabel(s: StoredScore) {
  return s.value_low != null && s.value_high != null ? `₹${Number(s.value_low)} – ${Number(s.value_high)} Cr` : 'Not estimable yet';
}

export function valueFactors(s: StoredScore) {
  return [
    ['Revenue (midpoint)', '₹' + Number(s.revenue_mid) + ' Cr'],
    ['Est. EBITDA', '₹' + Number(s.profit) + ' Cr'],
    ['Transferability adjustment', s.transferability >= 65 ? 'Positive' : 'Neutral to negative'],
    ['Owner dependency', s.independence < 55 ? 'Reduces range' : 'Limited effect']
  ];
}

export const VALUE_DISCLAIMER = 'This is an indicative estimate based on information provided and platform methodology. It is not a formal valuation, tax opinion, legal opinion or investment recommendation. A qualified professional should be engaged for a formal valuation where required.';

// ---------- Readiness task library (PRD §17) ----------
type TaskDef = { key: string; title: string; category: string; component: string; effort: string; impact: number; why: string; criteria: string; assignee: string; days: number };

export const TASK_LIBRARY: TaskDef[] = [
  { key: 'cust-doc', title: 'Document your top 10 customer relationships', category: 'Owner Dependency', component: 'Owner independence', effort: '3 hrs', impact: 4, why: 'Buyers and successors need to see relationships can transfer beyond you.', criteria: 'Contact, history, terms and relationship owner recorded for each.', assignee: 'You', days: 14 },
  { key: 'second-ops', title: 'Name a second-in-command for operations', category: 'Management', component: 'Management depth', effort: '2 weeks', impact: 5, why: 'The single biggest lever on Business Independence.', criteria: 'Role, authority limits and deputy announced to the team.', assignee: 'You', days: 30 },
  { key: 'audited-fin', title: 'Collect 3 years of audited financials', category: 'Financial Readiness', component: 'Financial quality', effort: '1 day', impact: 3, why: 'Every valuation and diligence process starts here.', criteria: 'P&L, balance sheet and audit reports uploaded to My documents.', assignee: 'Your CA', days: 21 },
  { key: 'sop-o2d', title: 'Write SOPs for order-to-delivery', category: 'Operations', component: 'Operations', effort: '1 week', impact: 3, why: 'Documented processes survive a change of leadership.', criteria: 'SOP reviewed and used by the team for 30 days.', assignee: 'Operations lead', days: 45 },
  { key: 'bank-handover', title: 'Hand over banking relationship to finance head', category: 'Owner Dependency', component: 'Owner independence', effort: '1 month', impact: 3, why: 'Banks are often tied personally to the owner.', criteria: 'Finance head is authorised signatory and primary contact.', assignee: 'You', days: 60 },
  { key: 'cust-conc', title: 'Reduce top customer below 25% of revenue', category: 'Customer Concentration', component: 'Customer concentration', effort: '6–12 months', impact: 4, why: 'Concentration is a leading cause of lower offers.', criteria: 'Top customer under 25% for two consecutive quarters.', assignee: 'Sales lead', days: 270 },
  { key: 'sha', title: 'Draft a shareholder agreement', category: 'Legal', component: 'Legal readiness', effort: '3 weeks', impact: 2, why: 'Clarifies what happens to ownership on transfer.', criteria: 'Agreement signed by all shareholders.', assignee: 'Lawyer', days: 75 },
  { key: 'trademark', title: 'Register your trademark', category: 'Legal', component: 'Legal readiness', effort: '2 hrs', impact: 1, why: 'Brand ownership should be clean and transferable.', criteria: 'Application filed with the registry.', assignee: 'Lawyer', days: 90 },
  { key: 'gst-rec', title: 'Reconcile GST filings with books', category: 'Financial Readiness', component: 'Documentation', effort: '2 days', impact: 1, why: 'Mismatches are a common diligence red flag.', criteria: 'Reconciliation signed off by CA.', assignee: 'Your CA', days: 60 },
  { key: 'contracts', title: 'Put written contracts in place with major customers', category: 'Customer Concentration', component: 'Customer concentration', effort: '2 months', impact: 3, why: 'Contracted revenue is valued higher and transfers more cleanly.', criteria: 'Top five customers on signed agreements.', assignee: 'Sales lead', days: 120 },
  { key: 'supplier-doc', title: 'Document supplier terms and alternates', category: 'Operations', component: 'Operations', effort: '1 week', impact: 2, why: 'A successor must be able to keep supply running without you.', criteria: 'Key suppliers, terms and backup suppliers recorded.', assignee: 'Purchase lead', days: 45 },
  { key: 'retention', title: 'Introduce a retention plan for key staff', category: 'Management', component: 'Employee stability', effort: '1 month', impact: 2, why: 'Buyers price in the risk of key people leaving after a transition.', criteria: 'Retention terms agreed with your top five people.', assignee: 'You', days: 90 },
  { key: 'recurring', title: 'Convert repeat customers to annual agreements', category: 'Customer Concentration', component: 'Revenue quality', effort: '3 months', impact: 2, why: 'Recurring revenue improves both value and predictability.', criteria: '30% of revenue under annual or rate agreements.', assignee: 'Sales lead', days: 150 },
  { key: 'emp-records', title: 'Complete employee records and agreements', category: 'Legal', component: 'Documentation', effort: '1 week', impact: 2, why: 'Missing appointment letters and PF/ESI records slow diligence.', criteria: 'Appointment letters and statutory records filed for all staff.', assignee: 'HR / CA', days: 60 },
  { key: 'licences', title: 'Check licences, registrations and property documents', category: 'Legal', component: 'Legal readiness', effort: '3 days', impact: 2, why: 'Expired licences or unclear property papers can stall a transfer.', criteria: 'All licences current; property documents organised.', assignee: 'You', days: 45 },
  { key: 'pricing-deleg', title: 'Delegate pricing within agreed limits', category: 'Owner Dependency', component: 'Owner independence', effort: '2 weeks', impact: 3, why: 'If every price goes through you, the business is you.', criteria: 'Written pricing authority matrix in use for a month.', assignee: 'Sales lead', days: 45 },
  { key: 'absence-test', title: 'Run a two-week absence test', category: 'Owner Dependency', component: 'Owner independence', effort: '2 weeks', impact: 3, why: 'The clearest proof that the business runs without you.', criteria: 'Two weeks away with issues logged and resolved by the team.', assignee: 'You', days: 120 }
];

export function generateTasks(s: StoredScore) {
  const compScore: Record<string, number> = Object.fromEntries(s.components.map((c) => [c.k, c.s]));
  const ranked = TASK_LIBRARY
    .map((t) => ({ t, need: 100 - (compScore[t.component] ?? 50) }))
    .filter((x) => x.need >= 25)
    .sort((x, y) => y.need * y.t.impact - x.need * x.t.impact);
  const chosen = ranked.length >= 6 ? ranked : TASK_LIBRARY.map((t) => ({ t, need: 100 - (compScore[t.component] ?? 50) })).sort((x, y) => y.need * y.t.impact - x.need * x.t.impact);
  return chosen.slice(0, 12).map((x, i) => ({
    ...x.t,
    priority: x.need >= 55 ? 'High' : x.need >= 35 ? 'Medium' : 'Low',
    sort: i
  }));
}
