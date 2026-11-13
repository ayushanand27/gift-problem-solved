// Change the product name here and it changes everywhere.
export const SITE_NAME = 'ShagunGoals';
export const TAGLINE = 'Gift the couple what they actually want';

// Shown on the Privacy Policy and Terms pages.
export const OPERATOR = 'Ayush Anand';
export const LEGAL_UPDATED = '14 November 2026';

// Set CONTACT_EMAIL in the environment. Falls back to the address the site sends mail from.
export function contactEmail() {
  const fromEnv = process.env.CONTACT_EMAIL;
  if (fromEnv) return fromEnv;
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || '';
  const open = from.indexOf('<');
  const close = open === -1 ? -1 : from.indexOf('>', open);
  return (close === -1 ? from : from.slice(open + 1, close)) || null;
}
