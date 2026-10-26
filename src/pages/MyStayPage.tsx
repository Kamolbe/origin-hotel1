import { MobileCabinetMenu } from '../components/MobileCabinetMenu';
import { AccountSummary } from '../components/AccountSummary';
import { Link, Navigate } from 'react-router-dom';
import { CalendarDays, House } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { PageHeader } from '../components/PageHeader';
import { StatusPill } from '../components/StatusPill';
import { formatMoney } from '../services/hotelUtils';

export function MyStayPage() {
  const { user } = useAuth();
  const { data } = useAppData();
  const ownGuestIds = new Set(data.guests.filter((guest) => guest.email.toLowerCase() === user?.email.toLowerCase()).map((guest) => guest.id));
  const bookings = data.bookings.filter((booking) => booking.userId ? booking.userId === user?.id : ownGuestIds.has(booking.guestId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (user?.role === 'admin' || user?.role === 'manager') return <Navigate to="/app" replace />;
  return <div><PageHeader eyebrow="Shaxsiy kabinet" title="Mening safarlarim" description="Shaxsiy ma’lumotlaringiz va faqat o‘zingizga tegishli bronlar." action={<Link to="/" className="secondary-button gap-2"><House size={16} />Bosh sahifa</Link>} /><MobileCabinetMenu /><AccountSummary /><div className="mb-4 mt-8 flex items-center justify-between gap-3"><h2 className="font-display text-2xl">Mening bronlarim ({bookings.length})</h2><Link to="/rooms" className="primary-button">Xona tanlash</Link></div><div className="space-y-4">{bookings.map((booking) => { const room = data.rooms.find((item) => item.id === booking.roomId);return <article key={booking.id} className="surface rounded-3xl p-5"><div className="flex flex-wrap justify-between gap-3"><h3 className="font-semibold">{booking.bookingNumber}</h3><StatusPill status={booking.status}>{booking.status}</StatusPill></div><p className="mt-3 text-sm">{room?.type ?? 'Xona'} · {room?.number ?? '—'}</p><p className="mt-2 flex items-center gap-2 text-xs text-muted"><CalendarDays size={14} />{booking.checkIn} — {booking.checkOut}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted">Mehmonlar</dt><dd className="mt-1">{booking.adults} katta · {booking.children} bola</dd></div><div><dt className="text-muted">Jami summa</dt><dd className="mt-1 font-semibold">{formatMoney(booking.totalAmount, data.settings.currency)}</dd></div><div><dt className="text-muted">To‘langan</dt><dd className="mt-1">{formatMoney(booking.paidAmount, data.settings.currency)}</dd></div><div><dt className="text-muted">Qolgan summa</dt><dd className="mt-1">{formatMoney(Math.max(0, booking.totalAmount - booking.paidAmount), data.settings.currency)}</dd></div></dl>{room && <Link to={`/rooms/${room.id}`} className="secondary-button mt-4">Xona haqida</Link>}</article>; })}{!bookings.length && <div className="surface rounded-3xl p-8 text-center"><CalendarDays size={28} className="mx-auto text-champagne" /><p className="mt-4 font-display text-2xl">Hali broningiz yo‘q</p><p className="mt-2 text-sm text-muted">Xonalarni ko‘rib, birinchi safaringizni rejalashtiring.</p></div>}</div></div>;
}
