import type { AppData, Booking, User } from '../types';

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
const MONTH_NAMES = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
export function dashboardDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return year && month >= 1 && month <= 12 && day ? `${day}-${MONTH_NAMES[month - 1]}, ${year}` : '—';
}

export const BOOKING_LABELS = { pending: 'Kutilmoqda', confirmed: 'Tasdiqlangan', rejected: 'Rad etilgan', cancelled: 'Bekor qilingan', completed: 'Tugatilgan' } as const;
export function hotelToday(timeZone = 'Asia/Tashkent', now = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type)?.value).join('-');
  } catch { return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
}
export function ownBookings(data: AppData, user: Pick<User, 'id' | 'email'> | null): Booking[] {
  if (!user) return [];
  const guestIds = new Set(data.guests.filter((guest) => guest.email.toLowerCase() === user.email.toLowerCase()).map((guest) => guest.id));
  return data.bookings.filter((booking) => booking.userId ? booking.userId === user.id : guestIds.has(booking.guestId));
}
export function dashboardMetrics(data: AppData, today: string) {
  const active = data.bookings.filter((booking) => booking.status === 'confirmed' && booking.checkIn <= today && booking.checkOut > today);
  const occupiedIds = new Set(active.map((booking) => booking.roomId));
  const rooms = { available: 0, occupied: 0, cleaning: 0, maintenance: 0 };
  const availableIds: string[] = [];
  for (const room of data.rooms) {
    const status = room.status === 'maintenance' || room.status === 'cleaning' ? room.status : room.status === 'occupied' || occupiedIds.has(room.id) ? 'occupied' : 'available';
    rooms[status]++;
    if (status === 'available') availableIds.push(room.id);
  }
  const percent = (count: number) => data.rooms.length ? Math.round(count / data.rooms.length * 100) : 0;
  const month = today.slice(0, 7);
  const monthDate = new Date(`${month}-15T12:00:00`);
  monthDate.setMonth(monthDate.getMonth() - 1);
  const previousMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
  const income = (period: string) => data.finance.filter((entry) => entry.type === 'income' && entry.date.startsWith(period)).reduce((sum, entry) => sum + entry.amount, 0);
  return {
    today, rooms, availableIds, totalRooms: data.rooms.length, freePercent: percent(rooms.available), occupiedPercent: percent(rooms.occupied),
    pending: data.bookings.filter((booking) => booking.status === 'pending').length,
    arrivals: data.bookings.filter((booking) => booking.status === 'confirmed' && booking.checkIn === today),
    departures: data.bookings.filter((booking) => booking.status === 'confirmed' && booking.checkOut === today),
    stayingGuests: active.filter((booking) => data.rooms.some((room) => room.id === booking.roomId)).reduce((sum, booking) => sum + booking.adults + booking.children, 0),
    monthIncome: income(month), previousIncome: income(previousMonth),
    monthExpenses: data.finance.filter((entry) => entry.type === 'expense' && entry.date.startsWith(month)).reduce((sum, entry) => sum + entry.amount, 0),
    monthBookings: data.bookings.filter((booking) => booking.createdAt.startsWith(month)).length,
  };
}
export function bookingTimeline(data: AppData, today: string, months = 6) {
  const anchor = new Date(`${today.slice(0, 7)}-15T12:00:00`);
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(anchor); date.setMonth(date.getMonth() - months + index + 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { month: MONTHS[date.getMonth()], period: key, bronlar: data.bookings.filter((booking) => booking.createdAt.startsWith(key)).length };
  });
}
