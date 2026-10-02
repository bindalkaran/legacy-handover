// Deterministic acquirer ↔ business matching (PRD §24): hard filters, weighted factors, reasons.
export type BuyerProfile = { buyer_type?: string; experience?: string; capital?: string; financing?: string; industries?: string[]; involvement?: string; timeline?: string; international?: boolean };
export type Listing = { id: string; industry: string; title: string; revenue_band?: string; location?: string; deal_note?: string; transferability_band?: string; verification?: string; open_international?: boolean };

const CAP_CR: Record<string, number> = { 'Under ₹1 Cr': 0.7, '₹1–3 Cr': 2, '₹3–10 Cr': 6, '₹10 Cr+': 12 };
function revenueMid(band = '') {
  const nums = band.replace(/[^\d.–-]/g, ' ').split(/[\s–-]+/).map(Number).filter((n) => !isNaN(n) && n > 0);
  if (!nums.length) return 5;
  return nums.length > 1 ? (nums[0] + nums[1]) / 2 : nums[0];
}

export function matchScore(b: BuyerProfile, l: Listing) {
  const why: string[] = [];
  let s = 0;
  const inds = b.industries || [];
  if (inds.includes(l.industry)) { s += 35; why.push('Industry match'); }
  else if (inds.includes('Open') || !inds.length) { s += 18; why.push('Open to industry'); }
  else if ((l.industry === 'Distribution' && inds.includes('Wholesale')) || (l.industry === 'Wholesale' && inds.includes('Distribution'))) { s += 20; why.push('Adjacent industry'); }
  // Rough enterprise value ≈ 0.6× revenue for these SMEs; equity typically 30–40% of price.
  const ev = revenueMid(l.revenue_band) * 0.6;
  const cap = CAP_CR[b.capital || ''] ?? 2;
  const needsFin = b.financing === 'Yes' || b.financing === 'Partly';
  if (cap >= ev * 0.35) { s += 25; why.push(cap >= ev ? 'Capital fits' : 'Capital fits with financing'); }
  else if (needsFin && cap >= ev * 0.2) { s += 14; why.push('Financing feasible'); }
  else if (/partial|stake/i.test(l.deal_note || '')) { s += 12; why.push('Partial stake matches budget'); }
  if (b.involvement === 'Full-time operator' && /transition|handover|full/i.test(l.deal_note || '')) { s += 15; why.push('Owner wants an operator'); }
  else if (b.involvement === 'Either') s += 10;
  else s += 6;
  if (l.transferability_band === 'Strong') { s += 10; why.push('Strong transferability'); } else if (l.transferability_band === 'Developing') s += 5;
  if (l.verification === 'Financially verified') s += 10; else if (l.verification === 'Business verified') s += 6;
  if (b.international && !l.open_international) s -= 15;
  return { score: Math.max(0, Math.min(99, Math.round(s))), why: why.slice(0, 3) };
}
