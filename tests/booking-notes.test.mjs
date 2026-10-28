import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookingNote, legacyBookingEmail } from '../src/services/bookingNotes.ts';

test('new guest notes, legacy metadata and staff notes render only the intended message', () => {
  assert.equal(bookingNote({ guestNote: ' Tinchroq xona kerak.\nKechroq kelaman. ', notes: 'old text' }), 'Tinchroq xona kerak.\nKechroq kelaman.');
  assert.equal(bookingNote({ notes: 'user:guest@example.com · Tinchroq xona kerak.' }), 'Tinchroq xona kerak.');
  assert.equal(bookingNote({ notes: 'user:guest@example.com' }), '');
  assert.equal(legacyBookingEmail({ notes: 'user:GUEST@example.com · Xabar' }), 'guest@example.com');
  assert.equal(bookingNote({ notes: 'Qabulxona kiritgan izoh' }), 'Qabulxona kiritgan izoh');
  assert.equal(bookingNote({ guestNote: 'user: this is the literal text' }), 'user: this is the literal text');
  assert.equal(bookingNote({ guestNote: '', notes: 'user:guest@example.com' }), '');
  assert.equal(bookingNote({}), '');
});
