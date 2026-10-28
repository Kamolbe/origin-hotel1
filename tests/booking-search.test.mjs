import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localBookingDate, isCalendarDate, isValidBookingSearch, readPendingSearch } from '../src/services/bookingSearch.ts';

test('Uzbekistan dates stay on their local day around midnight and month boundaries', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'Asia/Tashkent';
  try {
    const midnight = new Date('2026-10-28T00:30:00+05:00');
    assert.equal(localBookingDate(0, midnight), '2026-10-28');
    assert.equal(localBookingDate(1, midnight), '2026-10-29');
    assert.equal(localBookingDate(1, '2028-02-28'), '2028-02-29');
    assert.equal(localBookingDate(1, '2026-12-31'), '2027-01-01');
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});
test('invalid dates, zero-night stays, past arrivals and invalid guest counts are rejected', () => {
  const valid = { checkIn: '2030-01-02', checkOut: '2030-01-04', guests: '2' };
  assert.ok(isValidBookingSearch(valid, '2030-01-01'));
  assert.equal(isCalendarDate('2030-02-31'), false);
  assert.equal(isValidBookingSearch({ ...valid, checkOut: valid.checkIn }, '2030-01-01'), false);
  assert.equal(isValidBookingSearch(valid, '2030-01-03'), false);
  for (const guests of ['0', '5', '2.5', 2, null]) assert.equal(isValidBookingSearch({ ...valid, guests }, '2030-01-01'), false);
});
test('saved search reader handles blocked storage, corrupt payloads and missing guest defaults', () => {
  assert.equal(readPendingSearch({ getItem() { throw new Error('blocked'); }, removeItem() {} }), null);
  for (const value of ['null', '[]', '{}', 'invalid json', JSON.stringify({ checkIn: 17, checkOut: '2030-01-04' })]) {
    assert.equal(readPendingSearch({ getItem: () => value, removeItem() {} }), null);
  }
  assert.deepEqual(readPendingSearch({ getItem: () => JSON.stringify({ checkIn: '2099-01-01', checkOut: '2099-01-03' }), removeItem() {} }), { checkIn: '2099-01-01', checkOut: '2099-01-03', guests: '2' });
});
