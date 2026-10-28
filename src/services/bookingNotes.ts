import type { Booking } from '../types';

// Older guest bookings embedded ownership metadata before the actual message.
const legacyNote = (booking: Pick<Booking, 'notes'>) => booking.notes?.match(/^user:([^\s·]+)(?:\s*·\s*([\s\S]*))?$/i);
export function legacyBookingEmail(booking: Pick<Booking, 'notes'>): string | undefined {
  return legacyNote(booking)?.[1]?.toLowerCase();
}
export function bookingNote(booking: Pick<Booking, 'notes' | 'guestNote'>): string {
  if (typeof booking.guestNote === 'string') return booking.guestNote.trim();
  const legacy = legacyNote(booking);
  return (legacy ? legacy[2] ?? '' : booking.notes ?? '').trim();
}
