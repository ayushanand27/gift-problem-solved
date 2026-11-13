import test from 'node:test';
import assert from 'node:assert/strict';
import { UPI_ID, UTR, cleanText, inr, isRealDate, parseRupees } from '../lib/validate.js';
import { upiLink } from '../lib/upi.js';

test('parseRupees accepts only plain positive whole numbers', () => {
  assert.equal(parseRupees('5100'), 5100);
  for (const bad of ['0', '-5', '12.5', '1e5', '', ' ', 'abc', '1,000', '9999999999', null]) assert.equal(parseRupees(bad), null, String(bad));
});

test('UTR must be exactly 12 digits', () => {
  assert.ok(UTR.test('412345678901'));
  for (const bad of ['41234567890', '4123456789012', '41234567890a', '']) assert.ok(!UTR.test(bad), bad);
});

test('UPI id shape', () => {
  assert.ok(UPI_ID.test('riya.aman@okhdfcbank'));
  for (const bad of ['riya', '@bank', 'a b@bank', 'riya@', 'riya@1bank']) assert.ok(!UPI_ID.test(bad), bad);
});

test('isRealDate checks the calendar', () => {
  assert.ok(isRealDate('2027-02-14'));
  assert.ok(isRealDate('2028-02-29'));
  for (const bad of ['2027-02-30', '2027-13-01', '2027-2-1', '1999-01-01', '', 'tomorrow']) assert.ok(!isRealDate(bad), bad);
});

test('cleanText strips control characters and cuts length', () => {
  assert.equal(cleanText('  a\n\tb \u0000c  ', 50), 'a b c');
  assert.equal(cleanText('x'.repeat(100), 10).length, 10);
});

test('inr uses Indian digit grouping', () => {
  assert.equal(inr(150000), '₹1,50,000');
});

test('upiLink carries payee, amount and currency, and escapes the note', () => {
  const link = upiLink({ upiId: 'a@b', payeeName: 'Riya & Aman', amount: 5100, note: 'Gift #1' });
  assert.ok(link.startsWith('upi://pay?'));
  assert.ok(link.includes('pa=a%40b') && link.includes('am=5100.00') && link.includes('cu=INR'));
  assert.ok(!link.includes('Riya & Aman'));
});
