import type { AppData, AuditEntry, Booking, Currency, Room } from '../types';

import { validStayDates } from './hotelOperations.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === 'UZS' ? 'uz-UZ' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function dayDifference(start: string, end: string): number {
  if (!validStayDates(start.slice(0, 10), end.slice(0, 10))) return 0;
  const startDate = new Date(`${start.slice(0, 10)}T00:00:00`).getTime();
  const endDate = new Date(`${end.slice(0, 10)}T00:00:00`).getTime();
  if (!Number.isFinite(startDate) || !Number.isFinite(endDate)) return 0;
  return Math.max(0, Math.round((endDate - startDate) / DAY_MS));
}

export function availableRooms(data: AppData, checkIn: string, checkOut: string, guests = 1): Room[] {
  if (!checkIn || !checkOut || dayDifference(checkIn, checkOut) <= 0) return [];
  return data.rooms.filter((room) => {
    if (room.status !== 'available' || room.capacity < guests) return false;
    return !data.bookings.some((booking) =>
      booking.roomId === room.id
      && ['pending', 'confirmed'].includes(booking.status)
      && checkIn < booking.checkOut
      && checkOut > booking.checkIn,
    );
  });
}

export function recordAudit(
  data: AppData,
  action: string,
  entityType: AuditEntry['entityType'],
  entityId: string,
  userId?: string,
  details?: Record<string, unknown>,
): AuditEntry[] {
  const entry: AuditEntry = {
    id: `audit-${crypto.randomUUID()}`,
    action,
    entityType,
    entityId,
    userId,
    details,
    createdAt: new Date().toISOString(),
  };
  return [entry, ...data.auditLog];
}

export function roomBookingConflict(bookings: Booking[], roomId: string, checkIn: string, checkOut: string): boolean {
  return bookings.some((booking) =>
    booking.roomId === roomId
    && ['pending', 'confirmed'].includes(booking.status)
    && checkIn < booking.checkOut
    && checkOut > booking.checkIn,
  );
}
