import { useState } from 'react';
import { MobileAccountActions } from '../components/MobileAccountActions';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, BedDouble, CalendarDays, Clock, House, LogOut, Phone, Settings, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { PageHeader } from '../components/PageHeader';
import { StatusPill } from '../components/StatusPill';
import { formatMoney } from '../services/hotelUtils';

export function MyStayPage() {
  const { user, logout } = useAuth();
  const { data } = useAppData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const ownGuestIds = new Set(data.guests.filter((guest) => guest.email.toLowerCase() === user?.email.toLowerCase()).map((guest) => guest.id));
  const bookings = data.bookings.filter((booking) => booking.userId ? booking.userId === user?.id : ownGuestIds.has(booking.guestId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const upcoming = bookings.filter((booking) => ['pending', 'confirmed'].includes(booking.status) && booking.checkOut >= today);
  const next = [...upcoming].sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0];
  const visible = bookings.filter((booking) => filter === 'all' || (filter === 'upcoming' ? upcoming.includes(booking) : !upcoming.includes(booking)));
  if (user?.role === 'admin' || user?.role === 'manager') return <Navigate to="/app" replace />;
  const actions = [
    { to: '/rooms', label: 'Bron qilish', hint: 'O‘zingizga mos xonani toping', icon: BedDouble },
    { to: '/app/bookings', label: 'Qilingan bronlar', hint: 'Holat va bron boshqaruvi', icon: CalendarDays },
    { to: '/app/settings', label: 'Sozlamalar', hint: 'Hisob sozlamalarini yangilang', icon: Settings },
    { to: '/app/settings', label: 'Mening profilim', hint: 'Shaxsiy ma’lumotlar', icon: UserRound },
  ];
  return <div className="space-y-6">
    <PageHeader eyebrow="Sizning mehmonlar portalingiz" title={`Salom, ${user?.name.split(' ')[0] ?? 'mehmon'}!`} description="Safaringiz, bronlaringiz va hisobingiz — barchasi bir joyda." action={<Link to="/" className="secondary-button gap-2"><House size={16} />Bosh sahifa</Link>} />
    <section className="guest-stay-hero rounded-3xl p-6 sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#e0c69c]">{next ? 'Navbatdagi safaringiz' : 'Keyingi safaringiz shu yerdan boshlanadi'}</p><h2 className="mt-3 font-display text-3xl">{next ? `${data.rooms.find((room) => room.id === next.roomId)?.type ?? 'Xona'} · ${next.checkIn}` : 'O‘zingizga vaqt ajrating.'}</h2><p className="mt-3 max-w-md text-sm leading-6 text-white/75">{next ? `${next.bookingNumber} · ${next.checkIn} — ${next.checkOut}` : 'Xonalarni ko‘ring, qulay sanalarni tanlang va dam olishingizni rejalashtiring.'}</p><Link to={next ? '/app/bookings' : '/rooms'} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e0c69c] px-5 py-3 text-xs font-bold text-ink">{next ? 'Bronimni ko‘rish' : 'Xona tanlash'}<ArrowRight size={15} /></Link></section>
    <nav aria-label="Mehmon kabineti amallari" className="grid grid-cols-2 gap-3">{actions.map(({ to, label, hint, icon: Icon }) => <Link key={to} to={to} className="surface rounded-3xl p-4 transition hover:border-champagne sm:p-5"><Icon size={22} className="text-champagne" /><span className="mt-4 block text-sm font-semibold">{label}</span><span className="mt-1 block text-[11px] leading-5 text-muted">{hint}</span></Link>)}</nav>
    <section aria-label="Mening bronlarim"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl">Mening bronlarim ({bookings.length})</h2><span className="text-xs text-muted">{upcoming.length} ta faol safar</span></div><div className="my-4 flex flex-wrap gap-2">{([['all', 'Barchasi'], ['upcoming', 'Kelgusi'], ['past', 'Tarix']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={filter === value ? 'primary-button' : 'secondary-button'}>{label}</button>)}</div><div className="space-y-4">{visible.map((booking) => { const room = data.rooms.find((item) => item.id === booking.roomId);return <article key={booking.id} className="surface rounded-3xl p-5"><div className="flex flex-wrap justify-between gap-3"><h3 className="font-semibold">{booking.bookingNumber}</h3><StatusPill status={booking.status}>{booking.status}</StatusPill></div><p className="mt-3 text-sm">{room?.type ?? 'Xona'} · {room?.number ?? '—'}</p><p className="mt-2 flex items-center gap-2 text-xs text-muted"><CalendarDays size={14} />{booking.checkIn} — {booking.checkOut}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted">Mehmonlar</dt><dd className="mt-1">{booking.adults} katta · {booking.children} bola</dd></div><div><dt className="text-muted">Jami summa</dt><dd className="mt-1 font-semibold">{formatMoney(booking.totalAmount, data.settings.currency)}</dd></div><div><dt className="text-muted">To‘langan</dt><dd className="mt-1">{formatMoney(booking.paidAmount, data.settings.currency)}</dd></div><div><dt className="text-muted">Qolgan summa</dt><dd className="mt-1">{formatMoney(Math.max(0, booking.totalAmount - booking.paidAmount), data.settings.currency)}</dd></div></dl><div className="mt-4 flex flex-wrap gap-2"><Link to="/app/bookings" className="secondary-button">Bronni boshqarish</Link>{room && <Link to={`/rooms/${room.id}`} className="secondary-button">Xona haqida</Link>}</div></article>; })}{!visible.length && <div className="surface rounded-3xl p-8 text-center"><CalendarDays size={28} className="mx-auto text-champagne" /><p className="mt-4 font-display text-2xl">{bookings.length ? 'Bu bo‘limda bron yo‘q' : 'Birinchi safaringizni rejalashtiring'}</p><Link to="/rooms" className="primary-button mt-5">Xonalarni ko‘rish</Link></div>}</div></section>
    <section className="surface rounded-3xl p-5"><h2 className="flex items-center gap-2 font-display text-2xl"><Clock size={20} className="text-champagne" />Mehmon uchun foydali</h2><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[var(--page)] p-4"><p className="text-xs text-muted">Kelish vaqti</p><p className="mt-2 text-xl font-semibold">{data.settings.checkInTime}</p></div><div className="rounded-2xl bg-[var(--page)] p-4"><p className="text-xs text-muted">Ketish vaqti</p><p className="mt-2 text-xl font-semibold">{data.settings.checkOutTime}</p></div></div><Link to="/contact" className="secondary-button mt-4 w-full gap-2"><Phone size={16} />Qabulxona bilan bog‘lanish</Link></section>
    <section aria-label="Kabinet sozlamalari" className="surface rounded-3xl p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl">Hisob va sozlamalar</h2><LanguageSwitcher /></div><MobileAccountActions /><div className="flex flex-wrap items-center justify-between gap-3"><Link to="/app/settings" className="secondary-button gap-2"><Settings size={16} />Sozlamalar</Link><button type="button" onClick={() => { logout(); navigate('/'); }} className="secondary-button gap-2 text-danger"><LogOut size={16} />Chiqish</button></div></section>
  </div>;
}
