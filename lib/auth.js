import { cookies } from 'next/headers';
import { createHash, createHmac } from 'node:crypto';
import { hashPassword, safeEqual, verifyPassword } from './password';
import { query } from './db';

const SESSION_DAYS = 7;
const GUEST_DAYS = 1;

export { hashPassword, safeEqual, verifyPassword };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set to a random string of at least 32 characters');
  }
  return 'dev-only-secret-do-not-use-in-production';
}

// A signed token: the data plus an HMAC, so the browser cannot edit it.
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function unsign(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = createHmac('sha256', secret()).update(body).digest('base64url');
  if (!safeEqual(mac, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieOptions(days) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: days * 24 * 60 * 60,
  };
}

// A short fingerprint of the current password. When the password changes, every older session stops working.
const fingerprint = (passwordHash) => createHash('sha256').update(String(passwordHash)).digest('hex').slice(0, 16);

export async function startSession(coupleId, passwordHash) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  (await cookies()).set('session', sign({ cid: coupleId, fp: fingerprint(passwordHash), exp }), cookieOptions(SESSION_DAYS));
}

export async function endSession() {
  (await cookies()).delete('session');
}

export async function currentCouple() {
  const payload = unsign((await cookies()).get('session')?.value);
  if (!payload?.cid) return null;
  const { rows } = await query(
    'select id, email, password_hash, email_verified_at from couples where id = $1',
    [payload.cid]
  );
  const couple = rows[0];
  if (!couple || payload.fp !== fingerprint(couple.password_hash)) return null;
  return couple;
}

// Guests get this cookie after typing the code printed on the wedding card.
// The cookie is tied to the code it was opened with, so changing the code locks everyone out again.
const codeTag = (cardCode) => createHash('sha256').update(`card:${cardCode}`).digest('hex').slice(0, 12);

export async function unlockWedding(slug, cardCode) {
  const exp = Date.now() + GUEST_DAYS * 24 * 60 * 60 * 1000;
  (await cookies()).set(`guest_${slug}`, sign({ slug, exp, c: codeTag(cardCode) }), cookieOptions(GUEST_DAYS));
}

export async function hasUnlocked(slug, cardCode) {
  const payload = unsign((await cookies()).get(`guest_${slug}`)?.value);
  return payload?.slug === slug && payload?.c === codeTag(cardCode);
}

// Used for the header and for redirects. It checks the database, so a stale cookie never counts as logged in.
export async function isLoggedIn() {
  if (!unsign((await cookies()).get('session')?.value)?.cid) return false;
  return Boolean(await currentCouple());
}
