export const UPI_ID = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;
export const UTR = /^\d{12}$/;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Plain string checks instead of one big regex, so a long hostile input cannot make it slow.
function looksLikeEmail(value) {
  const text = String(value);
  if (text.length > 254 || /\s/.test(text)) return false;
  const at = text.indexOf('@');
  if (at < 1 || at !== text.lastIndexOf('@')) return false;
  const domain = text.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  return dot > 0 && dot < domain.length - 1;
}
export const EMAIL = { test: looksLikeEmail };
export const SLUG = /^[a-z0-9]{6,20}$/;

// UPI allows up to Rs 1,00,000 per payment for most person-to-person transfers.
export const UPI_LIMIT = 100000;

// Trims, removes control characters and cuts to a maximum length.
export function cleanText(value, max) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

// Whole rupees only. Returns null for anything that is not a plain positive number.
export function parseRupees(value) {
  const s = String(value ?? '').trim();
  if (!/^\d{1,9}$/.test(s)) return null;
  const n = Number(s);
  return n > 0 ? n : null;
}

// True only for a real calendar date such as 2027-02-14. Rejects 2027-02-31.
export function isRealDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return y >= 2000 && y <= 2100 && date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

export function inr(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

export function niceDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}
