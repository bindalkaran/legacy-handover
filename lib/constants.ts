export const LEVELS = [['Private', 'Only you and invited advisors'], ['Anonymous', 'Anonymised profile visible to qualified buyers'], ['Verified buyer', 'More detail for verified buyers you approve'], ['Under NDA', 'Sensitive information after NDA'], ['Due diligence', 'Full data room for approved parties']] as const;
export const DOC_CATEGORIES = ['Corporate', 'Financial', 'Operations', 'Legal', 'Assets'];
export const DOC_HINTS: Record<string, string> = { Corporate: 'Incorporation, shareholding, MOA/AOA, licences', Financial: 'P&L, balance sheet, GST, ITR, bank statements', Operations: 'Employee list, suppliers, customers, SOPs', Legal: 'Contracts, litigation, IP', Assets: 'Property, machinery, vehicles, inventory' };
export const DOC_TARGETS: Record<string, number> = { Corporate: 5, Financial: 6, Operations: 4, Legal: 3, Assets: 4 };
export const DEAL_STAGES = ['Interest', 'Access request', 'Approved', 'NDA', 'Initial discussion', 'Data room', 'Due diligence', 'Indicative offer', 'Negotiation', 'Term sheet', 'Definitive agreement', 'Closing', 'Transition'];
export const BUYER_STAGES = ['Interest', 'Approved', 'NDA', 'Data room', 'Diligence', 'Offer'];
export const CLOSING_ITEMS: [string, string][] = [['Term sheet signed', 'Both parties'], ['Valuation report from registered valuer', 'Owner’s CA'], ['Diligence findings resolved', 'Acquirer'], ['Lender sanction letter', 'Lender'], ['Definitive share purchase agreement', 'Lawyers'], ['Key third-party consents', 'Owner'], ['Board & shareholder resolutions', 'Owner’s CS'], ['Stamp duty & share transfer filings', 'Lawyers'], ['Funds received in escrow', 'Escrow agent']];
export const TRANSITION_PHASES: [string, string[]][] = [['Days 1–30', ['Introductions to key staff', 'Employee communication', 'Customer communication', 'Supplier communication', 'Banking & signatory transfer', 'Operational handover']], ['Days 31–60', ['Owner reduces involvement', 'New management takes control', 'Knowledge transfer sessions', 'Process verification']], ['Days 61–90', ['Final handover', 'Owner exit or advisory role begins', 'Performance review', 'Transition completion sign-off']]];
export const HANDOVER_CATS = ['Customers', 'Suppliers', 'Employees', 'Banking', 'Licences', 'Contracts', 'Systems', 'Access & passwords', 'Vendors', 'Physical assets'];
/** Every key the transition checklist accepts: phase items and handover categories. */
export const TRANSITION_KEYS: string[] = [...TRANSITION_PHASES.flatMap(([ph, items]) => items.map((t) => ph + ' · ' + t)), ...HANDOVER_CATS.map((c) => 'Handover · ' + c)];
export const CLOSING_KEYS: string[] = CLOSING_ITEMS.map((_, i) => String(i));
export const SELLER_INSTALMENTS = 20;
// Labels for automated output. Use the AI wording only when a model actually produced the text.
export const AI_OBS_LABEL = 'AI-generated observation. Verify with a qualified professional.';
export const RULES_OBS_LABEL = 'Rules-based observation from the document index. Verify with a qualified professional.';
export const AI_ASSIST_LABEL = 'AI-generated. Verify with a qualified professional. The assistant is not a lawyer, CA, valuer or investment advisor.';
export const RULES_ASSIST_LABEL = 'Rules-based answer from deal records, not an AI model. Verify with a qualified professional. The assistant is not a lawyer, CA, valuer or investment advisor.';
export const LENDERS: [string, string, string][] = [['Bank term loan', 'Bank · term loan', 'Typically 9.5–11% · 5–7 yrs · collateral'], ['NBFC acquisition finance', 'NBFC', 'Typically 11.5–14% · up to 5 yrs'], ['Private credit', 'Private credit', 'Typically 14–16% · flexible structures'], ['Family office co-investment', 'Investors · minority equity', 'Equity up to ~30%']];
