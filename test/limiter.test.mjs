import test from 'node:test';
import assert from 'node:assert/strict';

// Needs a real Postgres. Skipped unless DATABASE_URL is set (CI sets it with a service container).
const url = process.env.DATABASE_URL;

test('30 parallel requests with a limit of 5 let exactly 5 through', { skip: !url }, async () => {
  const { hit, limited } = await import('../lib/limiter.js');
  const key = `test:${Date.now()}:${Math.random()}`;
  const results = await Promise.all(Array.from({ length: 30 }, () => limited(key, 5, 15)));
  assert.equal(results.filter((blocked) => !blocked).length, 5);
  assert.equal(results.filter(Boolean).length, 25);
  assert.ok((await hit(key, 5, 15)).blocked);
});

test('a refund removes only its own attempt, even while other attempts run', { skip: !url }, async () => {
  const { hit, refund } = await import('../lib/limiter.js');
  const key = `mixed:${Date.now()}:${Math.random()}`;
  // 4 wrong guesses and 1 correct one arrive together, limit 10.
  const attempts = await Promise.all(Array.from({ length: 5 }, () => hit(key, 10, 15)));
  assert.ok(attempts.every((a) => !a.blocked && a.id));
  await refund(key, attempts[0].id); // the correct one is given back
  await refund(key, attempts[0].id); // giving it back twice does nothing more
  await refund(key + 'other', attempts[1].id); // a wrong key cannot delete it either
  // 4 failed guesses must still be on record, so only 6 more fit under the limit of 10.
  const more = await Promise.all(Array.from({ length: 10 }, () => hit(key, 10, 15)));
  assert.equal(more.filter((a) => !a.blocked).length, 6);
});

test('different keys do not affect each other', { skip: !url }, async () => {
  const { limited } = await import('../lib/limiter.js');
  const stamp = `${Date.now()}:${Math.random()}`;
  for (let i = 0; i < 3; i++) await limited(`a:${stamp}`, 3, 15);
  assert.equal(await limited(`a:${stamp}`, 3, 15), true);
  assert.equal(await limited(`b:${stamp}`, 3, 15), false);
});

test.after(async () => {
  if (url) (await import('../lib/db.js').catch(() => null)) && globalThis.__giftPool?.end();
});
