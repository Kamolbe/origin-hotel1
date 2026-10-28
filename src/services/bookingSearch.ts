export type BookingSearchValues = { checkIn: string; checkOut: string; guests: string };
export const PENDING_SEARCH_KEY = 'origin-hotel-pending-search';
const formatDate = (date: Date) => `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Calendar days must stay local; UTC conversion can move them to the previous day. */
export function localBookingDate(offset = 0, from: Date | string = new Date()): string {
  const date = typeof from === 'string' ? new Date(`${from}T12:00:00`) : new Date(from);
  date.setDate(date.getDate() + offset);
  return Number.isNaN(date.getTime()) ? '' : formatDate(date);
}
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return localBookingDate(0, value) === value;
}
export function isValidBookingSearch(value: unknown, today = localBookingDate()): value is BookingSearchValues {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BookingSearchValues>;
  return isCalendarDate(candidate.checkIn) && isCalendarDate(candidate.checkOut)
    && candidate.checkIn >= today && candidate.checkOut > candidate.checkIn
    && typeof candidate.guests === 'string' && /^[1-4]$/.test(candidate.guests);
}
export function readPendingSearch(storage?: Pick<Storage, 'getItem' | 'removeItem'>): BookingSearchValues | null {
  try {
    const source = storage ?? window.sessionStorage;
    const raw = source.getItem(PENDING_SEARCH_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') { source.removeItem(PENDING_SEARCH_KEY); return null; }
    const search = { ...parsed, guests: (parsed as Partial<BookingSearchValues>).guests ?? '2' };
    if (!isValidBookingSearch(search)) { source.removeItem(PENDING_SEARCH_KEY); return null; }
    return { checkIn: search.checkIn, checkOut: search.checkOut, guests: search.guests };
  } catch { return null; }
}
