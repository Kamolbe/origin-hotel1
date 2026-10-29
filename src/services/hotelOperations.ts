import type { AppData, Booking, FinanceCategory, FinanceType, UserRole } from '../types';
import { isCalendarDate } from './bookingSearch.ts';
import { hotelToday } from './dashboardMetrics.ts';

export const financeCategoryLabels: Record<FinanceCategory, string> = {
  room_revenue: 'Xona haqi', food_and_beverage: 'Ovqatlanish', additional_services: 'Qo‘shimcha xizmatlar', rental: 'Ijara',
  payroll: 'Ish haqi', utilities: 'Kommunal to‘lovlar', supplies: 'Material va xaridlar', maintenance: 'Ta’mirlash', other: 'Boshqa',
  housekeeping: 'Tozalik xizmati (avvalgi)', marketing: 'Marketing (avvalgi)',
};
export const financeCategories: Record<FinanceType, FinanceCategory[]> = {
  income: ['room_revenue', 'food_and_beverage', 'additional_services', 'rental', 'other'],
  expense: ['payroll', 'utilities', 'supplies', 'maintenance', 'other'],
};
export function validStayDates(checkIn: string, checkOut: string) {
  return isCalendarDate(checkIn) && isCalendarDate(checkOut) && checkOut > checkIn;
}
export function stayAction(data: AppData, bookingId: string, action: 'check-in' | 'check-out', role: UserRole, now = new Date(), today = now.toISOString().slice(0, 10)): AppData {
  if (!['admin', 'manager'].includes(role)) throw new Error('Bu amal faqat mehmonxona xodimlari uchun.');
  const booking = data.bookings.find((item) => item.id === bookingId);
  const room = data.rooms.find((item) => item.id === booking?.roomId);
  if (!booking || !room || booking.status !== 'confirmed') throw new Error('Tasdiqlangan bron va uning xonasi topilmadi.');
  if (action === 'check-in') {
    if (booking.checkedInAt || booking.checkedOutAt) throw new Error('Bu mehmon avval joylashtirilgan.');
    if (today < booking.checkIn || today >= booking.checkOut) throw new Error('Check-in faqat bronning kelish-ketish oralig‘ida bajariladi.');
    if (room.status !== 'available' || data.bookings.some((item) => item.id !== bookingId && item.roomId === room.id && item.checkedInAt && !item.checkedOutAt && item.status === 'confirmed')) throw new Error('Xona hozir joylashtirishga tayyor emas.');
  } else if (!booking.checkedInAt || booking.checkedOutAt) throw new Error('Avval mehmon uchun check-in bajaring.');
  const updated: Booking = action === 'check-in' ? { ...booking, checkedInAt: now.toISOString() } : { ...booking, checkedOutAt: now.toISOString(), status: 'completed' };
  return { ...data, bookings: data.bookings.map((item) => item.id === bookingId ? updated : item), rooms: data.rooms.map((item) => item.id === room.id ? { ...item, status: action === 'check-in' ? 'occupied' : 'cleaning' } : item) };
}

/** Both endpoints are inclusive; checkout day consumes no room-night. Deduplicate room-days. */
export function periodSummary(data: AppData, from: string, to: string) {
  const valid = isCalendarDate(from) && isCalendarDate(to) && from <= to;
  const days = valid ? Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1 : 0;
  const finance = valid ? data.finance.filter((entry) => entry.date.slice(0, 10) >= from && entry.date.slice(0, 10) <= to) : [];
  const bookings = valid ? data.bookings.filter((booking) => booking.checkIn <= to && booking.checkOut > from && ['pending', 'confirmed', 'completed'].includes(booking.status)) : [];
  const roomDays = new Set<string>();
  const roomIds = new Set(data.rooms.map((room) => room.id));
  for (const booking of bookings) {
    if (!['confirmed', 'completed'].includes(booking.status) || !roomIds.has(booking.roomId)) continue;
    const actualEnd = booking.checkedOutAt ? hotelToday(data.settings?.timeZone, new Date(booking.checkedOutAt)) : booking.checkOut;
    const end = Math.min(Date.parse(to) + 86400000, Date.parse(booking.checkOut), Date.parse(actualEnd));
    const start = Math.max(Date.parse(from), Date.parse(booking.checkIn));
    for (let day = start; day < end; day += 86400000) roomDays.add(`${booking.roomId}:${day}`);
  }
  const income = finance.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0);
  const expense = finance.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0);
  return { valid, days, finance, bookings, income, expense, net: income - expense, roomNights: roomDays.size, occupancy: days && data.rooms.length ? Math.round(roomDays.size / (data.rooms.length * days) * 100) : 0 };
}
