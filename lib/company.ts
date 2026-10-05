// Single source of truth for who operates Legacy Handover. Every legal page,
// receipt, footer and structured-data block reads from here.
// Sources: Bindal Infotech's published privacy/terms/refund pages (address, phone,
// jurisdiction); owner confirmation on 2026-10-05 (proprietorship, not GST-registered,
// Karan Bindal as founder and Grievance Officer, hello@legacyhandover.com).
export const COMPANY = {
  brand: 'Legacy Handover',
  legalName: 'Bindal Infotech',
  entity: 'Sole proprietorship of Karan Bindal',
  proprietor: 'Karan Bindal',
  gstRegistered: false,
  address: { line1: '305A, Shyam Anukampa', line2: 'C Scheme, Ashok Nagar', city: 'Jaipur', state: 'Rajasthan', pin: '302007', country: 'India' },
  email: 'hello@legacyhandover.com',
  phone: '+91 96363 69360',
  phoneHref: 'tel:+919636369360',
  jurisdiction: 'Jaipur, Rajasthan',
  grievanceOfficer: 'Karan Bindal',
  site: 'https://legacyhandover.com'
} as const;

export const ADDRESS_LINE = `${COMPANY.address.line1}, ${COMPANY.address.line2}, ${COMPANY.address.city}, ${COMPANY.address.state} ${COMPANY.address.pin}, ${COMPANY.address.country}`;
export const POLICY_UPDATED = '5 October 2026';
