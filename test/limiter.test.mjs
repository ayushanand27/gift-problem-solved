import test from 'node:test';
import assert from 'node:assert/strict';

// Needs a real Postgres. Skipped unless DATABASE_URL is set (CI sets it with a service container).
const url = process.env.DATABASE_URL;

test('30 parallel requests with a limit of 5 let exactly 5 through', { skip: !url }, async () => {
  const { limited, refund } = await import('../lib/limiter.js');
  const key = `test:${Date.now()}:${Math.random()}`;
  const results = await Promise.all(Array.from({ length: 30 }, () => limited(key, 5, 15)));
  assert.equal(results.filter((blocked) => !blocked).length, 5);
  assert.equal(results.filter(Boolean).length, 25);

  // A refunded attempt frees exactly one slot.
  await refund(key);
  assert.equal(await limited(key, 5, 15), false);
  assert.equal(await limited(key, 5, 15), true);
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
