import { createHmac, randomInt } from 'node:crypto';
import { transaction } from './db.js';

const hash = (key) => createHmac('sha256', process.env.SESSION_SECRET || 'dev-only-secret').update(key).digest('hex');

// Counts one attempt and says whether the caller is over the limit, as a single locked step.
// Parallel requests with the same key line up behind the lock, so none can slip past the count.
// Keys are hashed before they are stored, so emails and IP addresses never sit in the table as plain text.
// Returns { blocked, id }. The id is this attempt's own row, so it can be handed back later with refund().
export async function hit(key, max, minutes) {
  const hashed = hash(key);
  return transaction(async (db) => {
    await db.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [hashed]);
    const { rows } = await db.query(
      `select count(*)::int as n from attempts where key = $1 and at > now() - make_interval(mins => $2)`,
      [hashed, minutes]
    );
    if (rows[0].n >= max) return { blocked: true, id: null };
    const inserted = await db.query('insert into attempts (key) values ($1) returning id', [hashed]);
    if (randomInt(0, 50) === 0) await db.query(`delete from attempts where at < now() - interval '1 day'`);
    return { blocked: false, id: inserted.rows[0].id };
  });
}

export async function limited(key, max, minutes) {
  return (await hit(key, max, minutes)).blocked;
}

// Gives back exactly one earlier attempt, under the same lock. Used after a correct password or code,
// so only wrong guesses use up the allowance (a hall full of guests on one wifi can still get in).
// It can only delete the row it was given, never someone else's failed attempt.
export async function refund(key, id) {
  if (!id) return;
  const hashed = hash(key);
  await transaction(async (db) => {
    await db.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [hashed]);
    await db.query('delete from attempts where id = $1 and key = $2', [id, hashed]);
  });
}
