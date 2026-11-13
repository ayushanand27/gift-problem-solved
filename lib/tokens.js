import { createHash, randomBytes } from 'node:crypto';
import { query } from './db';

const hash = (raw) => createHash('sha256').update(String(raw)).digest('hex');

// Makes a one-time link token. Only a hash of it is stored, so a database leak cannot be used to log in.
export async function createToken(coupleId, kind, minutes) {
  const raw = randomBytes(32).toString('base64url');
  await query('delete from email_tokens where couple_id = $1 and kind = $2', [coupleId, kind]);
  await query(
    `insert into email_tokens (hash, couple_id, kind, expires_at)
     values ($1, $2, $3, now() + make_interval(mins => $4))`,
    [hash(raw), coupleId, kind, minutes]
  );
  return raw;
}

// Uses the token up. Returns the couple id once, and null if it is wrong, old or already used.
export async function consumeToken(raw, kind) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(String(raw ?? ''))) return null;
  const { rows } = await query(
    `update email_tokens set used_at = now()
      where hash = $1 and kind = $2 and used_at is null and expires_at > now()
      returning couple_id`,
    [hash(raw), kind]
  );
  return rows[0]?.couple_id || null;
}

// Looks without using it up, so a page can say "this link is dead" early.
export async function tokenIsLive(raw, kind) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(String(raw ?? ''))) return false;
  const { rows } = await query(
    'select 1 from email_tokens where hash = $1 and kind = $2 and used_at is null and expires_at > now()',
    [hash(raw), kind]
  );
  return rows.length > 0;
}
