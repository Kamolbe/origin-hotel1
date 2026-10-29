import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dashboardMetrics, ownBookings, hotelToday, bookingTimeline } from '../src/services/dashboardMetrics.ts';

const blank = () => ({ rooms: [], bookings: [], guests: [], finance: [], users: [], notifications: [], auditLog: [], visits: [], settings: {} });
test('room percentages count each room once, respect cleaning and maintenance, and exclude checkout day', () => {
  const data = blank();
  data.rooms = ['available', 'occupied', 'cleaning', 'maintenance', 'available', 'available'].map((status, index) => ({ id: `r${index}`, status }));
  data.bookings = [
    { roomId: 'r0', status: 'confirmed', checkedInAt: '2026-10-28T08:00:00Z', checkIn: '2026-10-28', checkOut: '2026-10-30', adults: 2, children: 0, createdAt: '2026-10-01' },
    { roomId: 'r0', status: 'confirmed', checkedInAt: '2026-10-28T08:00:00Z', checkIn: '2026-10-28', checkOut: '2026-10-30', adults: 1, children: 0, createdAt: '2026-10-02' },
    { roomId: 'r4', status: 'confirmed', checkedInAt: '2026-10-27T08:00:00Z', checkedOutAt: '2026-10-28T08:00:00Z', checkIn: '2026-10-27', checkOut: '2026-10-28', adults: 1, children: 0, createdAt: '2026-10-03' },
    { roomId: 'r5', status: 'pending', checkIn: '2026-10-28', checkOut: '2026-10-30', adults: 1, children: 0, createdAt: '2026-10-04' },
  ];
  const stats = dashboardMetrics(data, '2026-10-28');
  assert.deepEqual(stats.rooms, { available: 2, occupied: 2, cleaning: 1, maintenance: 1 });
  assert.equal(stats.freePercent, 33);
  assert.equal(stats.occupiedPercent, 33);
  assert.equal(stats.departures.length, 1);
  assert.equal(stats.pending, 1);
  assert.deepEqual(stats.availableIds, ['r4', 'r5']);
});
test('guest booking ownership respects explicit owner before guest email; no account sees no bookings', () => {
  const data = blank();
  const user = { id: 'me', email: 'me@example.com' };
  data.guests = [{ id: 'guest-me', email: 'ME@example.com' }];
  data.bookings = [{ id: 'mine', userId: 'me' }, { id: 'legacy', guestId: 'guest-me' }, { id: 'other', userId: 'other', guestId: 'guest-me' }];
  assert.deepEqual(ownBookings(data, user).map((item) => item.id), ['mine', 'legacy']);
  assert.deepEqual(ownBookings(data, null), []);
});
test('financial periods, real monthly chart counts and empty-state percentages are deterministic', () => {
  const data = blank();
  data.finance = [{ type: 'income', amount: 200, date: '2026-10-28' }, { type: 'income', amount: 100, date: '2026-09-20' }, { type: 'expense', amount: 70, date: '2026-10-20' }];
  data.bookings = [{ status: 'pending', createdAt: '2026-10-01' }, { status: 'cancelled', createdAt: '2026-10-02' }, { status: 'completed', createdAt: '2026-09-02' }];
  const stats = dashboardMetrics(data, '2026-10-28');
  assert.equal(stats.monthIncome, 200); assert.equal(stats.previousIncome, 100); assert.equal(stats.monthExpenses, 70); assert.equal(stats.freePercent, 0);
  assert.equal(bookingTimeline(data, '2026-10-28', 6).at(-1).bronlar, 2);
  assert.equal(bookingTimeline(data, '2026-10-28', 12).length, 12);
  assert.equal(hotelToday('Asia/Tashkent', new Date('2026-10-27T20:30:00Z')), '2026-10-28');
});
