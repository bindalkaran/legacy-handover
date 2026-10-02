// Idempotent reference + sample data. Sample rows are flagged is_sample and
// labelled "Sample" in the UI; admins can hide them from Configuration.

export const DEFAULT_WEIGHTS = {
  'Financial quality': 20,
  'Management depth': 15,
  'Owner independence': 15,
  'Customer concentration': 10,
  'Documentation': 10,
  'Operations': 10,
  'Legal readiness': 10,
  'Revenue quality': 5,
  'Employee stability': 5
};

const PROS = [
  ['Priya Sharma', 'Sharma & Associates', 'CA', 'Jaipur', 'Hindi, English', 'Succession-readiness programs, normalised financials, diligence prep for distributors.', 23, '4.9', '₹25k'],
  ['Vikram Desai', 'Desai Law', 'Lawyer', 'Mumbai', 'English, Marathi, Gujarati', 'SPAs, shareholder agreements and family settlements for owner-led businesses.', 41, '4.8', '₹60k'],
  ['Neha Iyer', 'Iyer Valuation Advisors', 'Valuer', 'Chennai', 'English, Tamil', 'Registered valuer; SME manufacturing and services valuations.', 67, '4.7', '₹40k'],
  ['Arjun Khanna', 'Northgate M&A', 'M&A advisor', 'Delhi NCR', 'Hindi, English', 'Sell-side mandates ₹5–50 Cr; strategic buyer outreach.', 18, '4.6', 'Success fee'],
  ['Kavita Rao', 'Rao Secretarial', 'CS', 'Bengaluru', 'English, Kannada', 'Share transfers, ROC filings, board and shareholder resolutions.', 52, '4.8', '₹15k'],
  ['Ascend Capital', 'NBFC', 'Financing', 'Pan-India', 'English, Hindi', 'Acquisition finance for individual operators and MBOs, ₹1–10 Cr.', 29, '4.5', '11.5% p.a.'],
  ['Rohit Bansal', 'Bansal Tax Advisory', 'Tax advisor', 'Delhi NCR', 'Hindi, English', 'Capital gains planning, slump sale vs share sale structuring.', 34, '4.7', '₹30k'],
  ['Meera Joshi', 'SME Banking Desk', 'Banker', 'Pune', 'English, Marathi', 'Working capital and term-loan transfer on change of ownership.', 15, '4.4', '—']
];

const LISTINGS = [
  ['Manufacturing', 'Precision Components Manufacturer', 'ISO-certified supplier to auto and industrial OEMs with a long-tenured shop-floor team.', '₹8–10 Cr', 'Gujarat', '22 yrs', 'Strong', 'Owner open to 12-month transition', 'Financially verified', true],
  ['Distribution', 'Profitable Industrial Distributor', 'Regional distributor with diversified customer base and experienced operating team.', '₹8–10 Cr', 'Rajasthan', '18 yrs', 'Strong', 'Full or majority sale', 'Business verified', false],
  ['B2B services', 'Facility Management Services', 'Contracted recurring revenue across 40+ commercial sites; second-line managers in place.', '₹5–7 Cr', 'Maharashtra', '12 yrs', 'Developing', 'Management partnership considered', 'Self-reported', true],
  ['Specialty retail', 'Heritage Sweets & Namkeen Brand', 'Four outlets and a growing packaged range; family successor not continuing.', '₹3–5 Cr', 'Madhya Pradesh', '35 yrs', 'Developing', 'Gradual handover, owner stays 2 yrs', 'Business verified', false],
  ['Wholesale', 'Agri-Inputs Wholesaler', 'Dealer network across three districts with stable supplier agreements.', '₹12–15 Cr', 'Punjab', '26 yrs', 'Strong', 'Strategic acquirer preferred', 'Financially verified', true],
  ['Manufacturing', 'Corrugated Packaging Unit', 'Owned facility, diversified FMCG customers, recent capacity upgrade.', '₹6–8 Cr', 'Tamil Nadu', '15 yrs', 'Developing', 'Partial stake sale', 'Self-reported', false]
];

export async function seed(run) {
  await run(`INSERT INTO score_versions (version, weights, created_by) VALUES ($1, $2::jsonb, 'system') ON CONFLICT (version) DO NOTHING`, ['score-v1.0', JSON.stringify(DEFAULT_WEIGHTS)]);
  await run(`INSERT INTO app_config (key, value) VALUES ('active_score_version', '"score-v1.0"'::jsonb) ON CONFLICT (key) DO NOTHING`, []);
  await run(`INSERT INTO app_config (key, value) VALUES ('show_samples', 'true'::jsonb) ON CONFLICT (key) DO NOTHING`, []);
  const seeded = await run(`SELECT value FROM app_config WHERE key = 'samples_seeded'`, []);
  if (seeded.length) return;
  for (const p of PROS) {
    await run(`INSERT INTO professionals (name, firm, pro_type, city, languages, expertise, transitions, rating, fees_from, is_sample) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)`, p);
  }
  for (const l of LISTINGS) {
    await run(`INSERT INTO listings (industry, title, description, revenue_band, location, years, transferability_band, deal_note, verification, open_international, status, is_sample) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'published',true)`, l);
  }
  await run(`INSERT INTO app_config (key, value) VALUES ('samples_seeded', 'true'::jsonb) ON CONFLICT (key) DO NOTHING`, []);
}
