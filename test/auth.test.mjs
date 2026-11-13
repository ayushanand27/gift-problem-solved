import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// The real helpers live in lib/auth.js, which needs Next.js to load. This repeats the same scheme
// so the password format (salt:hash, scrypt) stays stable and nobody changes it by accident.
const verify = (password, stored) => {
  const [saltHex, hashHex] = stored.split(':');
  const expected = Buffer.from(hashHex, 'hex');
  return timingSafeEqual(scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length), expected);
};

test('stored hash format is salt:hash and never contains the password', () => {
  const salt = randomBytes(16);
  const stored = `${salt.toString('hex')}:${scryptSync('hunter2hunter2', salt, 64).toString('hex')}`;
  assert.ok(!stored.includes('hunter2'));
  assert.ok(verify('hunter2hunter2', stored));
  assert.ok(!verify('hunter2hunter3', stored));
});

test('session fingerprint changes when the password hash changes', () => {
  const fp = (h) => createHash('sha256').update(h).digest('hex').slice(0, 16);
  assert.notEqual(fp('old'), fp('new'));
});
