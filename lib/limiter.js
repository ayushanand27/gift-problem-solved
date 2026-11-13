import { createHmac } from 'node:crypto';
import { transaction } from './db.js';

// Counts one attempt and says whether the caller is over the limit, as a single locked step.
// Parallel requests with the same key line up behind the lock, so none can slip past the count.
// Keys are hashed before they are stored, so emails and IP addresses never sit in the table as plain text.
export async function limited(key, max, minutes) {
  const hashed = createHmac('sha256', process.env.SESSION_SECRET || 'dev-only-secret').update(key).digest('hex');
  return transaction(async (db) => {
    await db.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [hashed]);
    const { rows } = await db.query(
      `select count(*)::int as n from attempts where key = $1 and at > now() - make_interval(mins => $2)`,
      [hashed, minutes]
    );
    if (rows[0].n >= max) return true;
    await db.query('insert into attempts (key) values ($1)', [hashed]);
    if (Math.random() < 0.02) await db.query(`delete from attempts where at < now() - interval '1 day'`);
    return false;
  });
}

// Gives one attempt back. Used after a correct password or code, so only wrong guesses use up the allowance
// (a whole wedding hall on one wifi can then enter the right code freely).
export async function refund(key) {
  const hashed = createHmac('sha256', process.env.SESSION_SECRET || 'dev-only-secret').update(key).digest('hex');
  await transaction((db) =>
    db.query(
      `delete from attempts where ctid = (select ctid from attempts where key = $1 order by at desc limit 1)`,
      [hashed]
    )
  );
}
