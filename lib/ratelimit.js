import { headers } from 'next/headers';
import { query } from './db';

export async function clientIp() {
  const h = await headers();
  return (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
}

// True when this key has already been used `max` times in the last `minutes`.
export async function tooMany(key, max, minutes) {
  const { rows } = await query(
    `select count(*)::int as n from attempts where key = $1 and at > now() - make_interval(mins => $2)`,
    [key, minutes]
  );
  return rows[0].n >= max;
}

export async function recordAttempt(key) {
  await query('insert into attempts (key) values ($1)', [key]);
  await query(`delete from attempts where at < now() - interval '1 day'`);
}
