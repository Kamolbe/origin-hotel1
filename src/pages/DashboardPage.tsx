import { AccountSummary } from '../components/AccountSummary';
import { Activity, BedDouble, CalendarCheck2, CircleDollarSign, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusPill } from '../components/StatusPill';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../services/hotelUtils';

export function DashboardPage() {
  const { data } = useAppData();
  const { user } = useAuth();
  const staff = user?.role === 'admin' || user?.role === 'manager';
  const tools = [
    ['/app/rooms', 'Xonalarni boshqarish'], ['/app/bookings', 'Bronlarni boshqarish'], ['/app/guests', 'Mehmonlar'], ['/app/finance', 'Moliya'], ['/app/reports', 'Hisobotlar'], ...(user?.role === 'admin' ? [['/app/users', 'Foydalanuvchilar va faoliyat'], ['/app/settings', 'Sayt va aloqa sozlamalari']] : []), ['/app/profile', 'Mening profilim'],
  ];
  const ownGuestIds = new Set(data.guests.filter((guest) => guest.email.toLowerCase() === user?.email.toLowerCase()).map((guest) => guest.id));
  const visibleBookings = staff ? data.bookings : data.bookings.filter((booking) => booking.userId ? booking.userId === user?.id : ownGuestIds.has(booking.guestId));
  const recent = [...visibleBookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const todayKey = new Date().toISOString().slice(0, 10);
  const visitsToday = data.visits.filter((visit) => visit.at.slice(0, 10) === todayKey);
  const latestVisit = data.visits[0];
  const occupied = data.rooms.filter((room) => room.status === 'occupied').length;
  const available = data.rooms.filter((room) => room.status === 'available').length;
  const revenue = data.finance.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);

  return <div><PageHeader eyebrow="Origin Hotel · Boshqaruv" title={staff ? 'Boshqaruv paneli' : 'Mehmonlar paneli'} description={`Xush kelibsiz, ${user?.name}.`} action={<Link to="/app/bookings" className="rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white">Bron qilish</Link>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Jami xonalar" value={data.rooms.length} icon={BedDouble} accent /><StatCard label="Band xonalar" value={occupied} icon={CalendarCheck2} /><StatCard label="Bo‘sh xonalar" value={available} icon={BedDouble} /><StatCard label={staff ? 'Mehmonlar' : 'Mening bronlarim'} value={staff ? data.guests.length : visibleBookings.length} icon={staff ? Users : CircleDollarSign} /></div>
    {staff && <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.75fr]"><section className="surface rounded-3xl p-5 sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-champagne">Moliya</p><h2 className="mt-2 font-display text-3xl">{formatMoney(revenue, data.settings.currency)}</h2><p className="mt-2 text-xs text-muted">Jami tushum</p></section><section className="surface rounded-3xl p-5 sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-champagne">Tezkor havolalar</p><div className="mt-4 flex flex-col gap-2">{tools.map(([to, label]) => <Link key={to} className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm transition hover:border-champagne" to={to}>{label}</Link>)}</div></section></div>}
    <div className="mt-5"><AccountSummary /></div>
    {staff && <section className="surface mt-5 rounded-3xl p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-champagne"><Activity size={14} />Sayt faoliyati</p><h2 className="mt-2 font-display text-3xl">{visitsToday.length} tashrif</h2><p className="mt-2 text-xs text-muted">Bugun asosiy saytga kirgan mehmonlar{latestVisit ? ` · oxirgi: ${new Date(latestVisit.at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} (${latestVisit.userName ?? 'hisobsiz'})` : ''}</p></div>
        {user?.role === 'admin' && <Link to="/app/users" className="secondary-button">Tashriflar tarixi</Link>}
      </div>
    </section>}
    <section className="surface mt-5 overflow-hidden rounded-3xl"><div className="border-b border-[var(--line)] px-5 py-4"><h2 className="font-display text-2xl">So‘nggi bronlar</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead className="bg-[var(--page)] text-[10px] uppercase text-muted"><tr><th className="px-5 py-3">Bron</th><th className="px-4 py-3">Sana</th><th className="px-4 py-3">Holat</th><th className="px-5 py-3 text-right">Jami</th></tr></thead><tbody>{recent.map((booking) => { const room = data.rooms.find((item) => item.id === booking.roomId); return <tr key={booking.id} className="border-t border-[var(--line)] text-xs"><td className="px-5 py-4 font-semibold">{booking.bookingNumber}<span className="block text-[10px] font-normal text-muted">Xona {room?.number ?? '—'}</span></td><td className="px-4 py-4">{booking.checkIn} — {booking.checkOut}</td><td className="px-4 py-4"><StatusPill status={booking.status}>{booking.status}</StatusPill></td><td className="px-5 py-4 text-right font-semibold">{formatMoney(booking.totalAmount, data.settings.currency)}</td></tr>; })}</tbody></table></div></section>
  </div>;
}
