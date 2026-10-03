// Assessment definition and deterministic scoring engine (PRD §10–13).
// Pure functions: imported by both the client (for UI) and the server (for scoring).

export type Answers = Record<string, number>; // option index, -1 = "I don't know"

export type Question = {
  id: string;
  label: string;
  options: string[];
  why?: string;
  optional?: boolean;
  showIf?: (a: Answers) => boolean;
};

export type Step = { key: string; title: string; intro: string; questions: Question[] };

const Y = ['Yes', 'Partly', 'No'];
const DEP = ['Only me', 'Shared', 'Team handles it'];
const hasSuccessor = (a: Answers) => a.hasSucc !== undefined && a.hasSucc < 2; // includes "I don't know", as in the design

export const ASSESSMENT_VERSION = 'assess-v1.0';
export const CALC_VERSION = 'calc-v1.0';

export const STEPS: Step[] = [
  { key: 'You', title: 'Let’s start with you.', intro: 'Your goals shape every recommendation. There are no wrong answers here.', questions: [
    { id: 'age', label: 'Your age', options: ['Under 45', '45–54', '55–64', '65+'] },
    { id: 'timeline', label: 'When would you ideally like to reduce your involvement?', options: ['Within 1 year', '1–3 years', '3–5 years', '5+ years', 'Not sure yet'] },
    { id: 'future', label: 'After the transition, how involved would you like to be?', options: ['Fully step away', 'Advisory role', 'Part-time', 'Stay involved'] },
    { id: 'exitType', label: 'Are you thinking of a full or partial transition?', options: ['Full', 'Partial', 'Undecided'] },
    { id: 'discussed', label: 'Have you discussed succession with family or partners?', options: ['In detail', 'Briefly', 'Not yet'], why: 'This tells us how far along the conversation is. It doesn’t affect your business scores.' }
  ] },
  { key: 'Business', title: 'Tell us about the business.', intro: 'Ranges are enough. We use them to estimate transferability and an indicative value.', questions: [
    { id: 'industry', label: 'Industry', options: ['Manufacturing', 'Distribution', 'Wholesale', 'B2B services', 'Specialty retail', 'Other'] },
    { id: 'years', label: 'Years operating', options: ['Under 5', '5–10', '10–20', '20+'] },
    { id: 'employees', label: 'Employees', options: ['Under 5', '5–20', '21–50', '51–100', '100+'] },
    { id: 'revenue', label: 'Annual revenue', options: ['Under ₹1 Cr', '₹1–5 Cr', '₹5–10 Cr', '₹10–25 Cr', '₹25 Cr+'], why: 'Revenue helps estimate an indicative value range. It’s never shown to anyone without your approval.' },
    { id: 'margin', label: 'Approximate profit margin (EBITDA)', options: ['Loss-making', 'Under 5%', '5–10%', '10–20%', '20%+'] },
    { id: 'recurring', label: 'How much revenue is recurring or repeat?', options: ['Under 25%', '25–50%', '50–75%', '75%+'] },
    { id: 'debt', label: 'Business debt relative to annual profit', options: ['None', 'Under 1 year', '1–3 years', '3+ years'], optional: true }
  ] },
  { key: 'Ownership', title: 'Who owns the business?', intro: 'Ownership structure affects which succession paths are practical.', questions: [
    { id: 'structure', label: 'Legal structure', options: ['Proprietorship', 'Partnership', 'LLP', 'Private limited'] },
    { id: 'owners', label: 'Ownership', options: ['Solely me', 'Me and family', 'Partners', 'Multiple shareholders'] },
    { id: 'agreement', label: 'Is there a shareholder or partnership agreement?', options: Y, optional: true }
  ] },
  { key: 'Successor', title: 'Is there someone who could take over?', intro: 'Many owners aren’t sure. That’s exactly what we help with.', questions: [
    { id: 'hasSucc', label: 'Is there a possible successor?', options: ['Yes', 'Possibly', 'No'] },
    { id: 'succWho', label: 'Who is it most likely to be?', options: ['Family member', 'Manager', 'Employee', 'Partner', 'External'], showIf: hasSuccessor },
    { id: 'succInterest', label: 'Are they interested in taking over?', options: ['Clearly yes', 'Maybe', 'Unclear'], showIf: hasSuccessor },
    { id: 'succReady', label: 'Are they currently involved and being prepared?', options: ['Actively', 'Somewhat', 'Not yet'], showIf: hasSuccessor }
  ] },
  { key: 'Your role', title: 'Who handles what today?', intro: 'The heart of transferability. Be honest; most owners find this eye-opening.', questions: [
    { id: 'd_sales', label: 'Sales & key customer relationships', options: DEP },
    { id: 'd_suppliers', label: 'Supplier relationships', options: DEP },
    { id: 'd_banking', label: 'Banking & finance', options: DEP },
    { id: 'd_ops', label: 'Day-to-day operations', options: DEP },
    { id: 'd_people', label: 'Hiring & managing staff', options: DEP },
    { id: 'd_pricing', label: 'Pricing & key negotiations', options: DEP },
    { id: 'd_strategy', label: 'Strategic decisions', options: DEP }
  ] },
  { key: 'Customers', title: 'Customers and suppliers.', intro: 'Concentration is one of the first things any successor or buyer looks at.', questions: [
    { id: 'topCust', label: 'Share of revenue from your largest customer', options: ['50%+', '25–50%', '10–25%', 'Under 10%'] },
    { id: 'top3', label: 'Share from your top three customers', options: ['75%+', '50–75%', '25–50%', 'Under 25%'] },
    { id: 'contracts', label: 'Are major customers under written contracts?', options: ['Mostly no', 'Some', 'Mostly yes'] },
    { id: 'topSupp', label: 'How hard would it be to replace your main supplier?', options: ['Very hard', 'Manageable', 'Easy'] }
  ] },
  { key: 'Team', title: 'Your management team.', intro: 'A capable second line is the biggest lever on succession readiness.', questions: [
    { id: 'managers', label: 'People who can make decisions without you', options: ['None', '1', '2–3', '4+'] },
    { id: 'secondLine', label: 'Is there a clear second-in-command?', options: ['No', 'Informally', 'Yes'] },
    { id: 'sops', label: 'Are key processes documented (SOPs)?', options: ['Not really', 'Some', 'Most'] },
    { id: 'retention', label: 'How long do key staff typically stay?', options: ['Under 2 years', '2–5 years', '5+ years'] }
  ] },
  { key: 'Records', title: 'Records and documentation.', intro: 'What’s written down transfers. What’s in your head doesn’t.', questions: [
    { id: 'r_fin', label: 'Audited financial statements (last 3 years)', options: Y },
    { id: 'r_tax', label: 'GST & tax filings up to date', options: Y },
    { id: 'r_contracts', label: 'Customer & supplier contracts organised', options: Y },
    { id: 'r_emp', label: 'Employee records & agreements', options: Y },
    { id: 'r_legal', label: 'Licences, registrations & property documents', options: Y },
    { id: 'r_ip', label: 'Trademarks / IP registered', options: Y, optional: true }
  ] }
];

export const ALL_QUESTIONS: Record<string, Question> = Object.fromEntries(STEPS.flatMap((s) => s.questions.map((qq) => [qq.id, qq])));

export function visibleQuestions(step: Step, a: Answers) {
  return step.questions.filter((qq) => !qq.showIf || qq.showIf(a));
}

export function sanitiseAnswers(raw: unknown): Answers {
  const out: Answers = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const qq = ALL_QUESTIONS[k];
    if (!qq || typeof v !== 'number' || !Number.isInteger(v)) continue;
    if (v === -1 || (v >= 0 && v < qq.options.length)) out[k] = v;
  }
  return out;
}

export const COMPONENT_KEYS = ['Financial quality', 'Management depth', 'Owner independence', 'Customer concentration', 'Documentation', 'Operations', 'Legal readiness', 'Revenue quality', 'Employee stability'] as const;

export type ScoreResult = {
  t: number; r: number; ind: number; dep: number;
  components: { k: string; s: number; w: number }[];
  value: [number, number] | null;
  revenue: number; profit: number;
  quality: string;
  labels: Record<string, string | null>;
  answers: Answers;
};

export function compute(a: Answers, weights: Record<string, number>): ScoreResult {
  const v = (id: string, rev = false) => {
    const x = a[id];
    if (x === undefined || x < 0) return 0.5;
    const n = ALL_QUESTIONS[id].options.length - 1;
    const r = x / n;
    return rev ? 1 - r : r;
  };
  const avg = (ids: string[], rev = false) => ids.reduce((s, i) => s + v(i, rev), 0) / ids.length;
  const dep = avg(['d_sales', 'd_suppliers', 'd_banking', 'd_ops', 'd_people', 'd_pricing', 'd_strategy']);
  const comp: Record<string, number> = {
    'Financial quality': v('margin') * 0.5 + v('r_fin', true) * 0.3 + v('debt', true) * 0.2,
    'Management depth': avg(['managers', 'secondLine']),
    'Owner independence': dep,
    'Customer concentration': avg(['topCust', 'top3', 'contracts']),
    'Documentation': avg(['r_fin', 'r_tax', 'r_contracts', 'r_emp'], true),
    'Operations': avg(['sops', 'topSupp']),
    'Legal readiness': avg(['r_legal', 'r_ip', 'agreement'], true),
    'Revenue quality': v('recurring'),
    'Employee stability': v('retention')
  };
  const totalW = COMPONENT_KEYS.reduce((s, k) => s + (weights[k] ?? 0), 0) || 100;
  const t = Math.round(COMPONENT_KEYS.reduce((s, k) => s + comp[k] * (weights[k] ?? 0), 0) * 100 / totalW);
  const succ = a.hasSucc === 2 ? 0.2 : ((v('succInterest', true) + v('succReady', true)) / 2) * (a.hasSucc === 0 ? 1 : 0.75);
  const tl = a.timeline;
  const ownerR = (v('discussed', true) + (tl !== undefined && tl >= 2 && tl <= 3 ? 1 : 0.5)) / 2;
  const r = Math.round((ownerR * 0.2 + succ * 0.2 + comp['Financial quality'] * 0.15 + comp['Legal readiness'] * 0.15 + comp['Documentation'] * 0.15 + comp['Management depth'] * 0.15) * 100);
  const ind = Math.round((dep * 0.6 + comp['Management depth'] * 0.25 + comp['Operations'] * 0.15) * 100);
  const revIdx = a.revenue !== undefined && a.revenue >= 0 ? a.revenue : 1;
  const marIdx = a.margin !== undefined && a.margin >= 0 ? a.margin : 2;
  const revMid = [0.7, 3, 7.5, 17, 32][revIdx];
  const mar = [0, 0.04, 0.08, 0.15, 0.22][marIdx];
  const profit = revMid * mar;
  const mult = 2.5 + (t / 100) * 3.5;
  const value: [number, number] | null = profit > 0 ? [+(profit * (mult - 0.6)).toFixed(1), +(profit * (mult + 0.6)).toFixed(1)] : null;
  const components = COMPONENT_KEYS.map((k) => ({ k, s: Math.round(comp[k] * 100), w: weights[k] ?? 0 }));
  const unknown = Object.entries(a).filter(([id, x]) => x < 0 && ALL_QUESTIONS[id] && (!ALL_QUESTIONS[id].showIf || ALL_QUESTIONS[id].showIf!(a))).length;
  const lbl = (id: string, fallback: string | null) => (a[id] !== undefined && a[id] >= 0 ? ALL_QUESTIONS[id].options[a[id]] : fallback);
  return {
    t, r, ind, dep: Math.round((1 - dep) * 100), components, value, revenue: revMid, profit: +profit.toFixed(2),
    quality: unknown > 6 ? 'Lower (several “I don’t know” answers)' : 'Good',
    answers: a,
    labels: {
      industry: lbl('industry', 'Business'), revenue: lbl('revenue', '—'), employees: lbl('employees', '—'), years: lbl('years', '—'),
      succWho: hasSuccessor(a) ? lbl('succWho', null) : null, timeline: lbl('timeline', 'Not sure yet'), structure: lbl('structure', null)
    }
  };
}

export const band = (v: number) => (v >= 75 ? 'Strong' : v >= 55 ? 'Developing' : 'Needs work');
