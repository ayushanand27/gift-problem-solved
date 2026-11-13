import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, safeEqual, verifyPassword } from '../lib/password.js';

test('hash is salted, never contains the password, and verifies', () => {
  const a = hashPassword('hunter2hunter2');
  const b = hashPassword('hunter2hunter2');
  assert.notEqual(a, b);
  assert.ok(!a.includes('hunter2'));
  assert.ok(verifyPassword('hunter2hunter2', a));
  assert.ok(!verifyPassword('hunter2hunter3', a));
  assert.ok(!verifyPassword('anything', 'garbage'));
  assert.ok(!verifyPassword('anything', ''));
});

test('safeEqual handles different lengths without throwing', () => {
  assert.ok(safeEqual('123456', '123456'));
  assert.ok(!safeEqual('123456', '12345'));
  assert.ok(!safeEqual('123456', '654321'));
});
