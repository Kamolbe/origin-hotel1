import { ownBookings } from '../services/dashboardMetrics';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck2, Mail, Phone, Settings, ShieldCheck, UserRound } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatusPill } from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { formatMoney } from '../services/hotelUtils';

export function ProfilePage() {
  const { user } = useAuth();
  const { data } = useAppData();
  const account = data.users.find((item) => item.id === user?.id);
  const bookings = ownBookings(data, user).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  const initials = user?.name.split(' ').map((part) => part[0]).slice(0,2).join('').toUpperCase();
  return <div className="animate-rise-in"><PageHeader eyebrow="Hisob ma’lumotlari" title="Profil" description="Shaxsiy ma’lumotlaringiz va bronlar tarixi." action={<Link to="/app/settings" className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white"><Settings size={14} />Profilni tahrirlash</Link>} />
    <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <section className="surface rounded-3xl p-6 sm:p-8"><div className="flex flex-col items-center text-center"><div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-champagne/20 bg-ink text-2xl font-bold text-champagne">{account?.avatarUrl ? <img src={account.avatarUrl} alt="Profil rasmi" className="h-full w-full object-cover" /> : initials}</div><h2 className="mt-4 font-display text-3xl">{user?.name}</h2><span className="mt-2 rounded-full bg-champagne/15 px-3 py-1 text-[10px] font-semibold capitalize text-champagne">{user?.role}</span></div>
        <div className="mt-7 space-y-4 border-t border-[var(--line)] pt-5 text-xs"><p className="flex items-center gap-3"><Mail size={15} className="text-champagne" />{user?.email}</p><p className="flex items-center gap-3"><Phone size={15} className="text-champagne" />{account?.phone || 'Telefon raqami qo‘shilmagan'}</p><p className="flex items-center gap-3"><ShieldCheck size={15} className="text-champagne" />{account?.twoFactorEnabled ? 'Ikki bosqichli himoya yoqilgan' : 'Ikki bosqichli himoya o‘chiq'}</p></div>
        <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[var(--page)] p-4"><p className="text-[9px] uppercase tracking-wider text-muted">Jami bronlar</p><p className="mt-2 font-display text-3xl">{bookings.length}</p></div><div className="rounded-2xl bg-[var(--page)] p-4"><p className="text-[9px] uppercase tracking-wider text-muted">Tasdiqlangan</p><p className="mt-2 font-display text-3xl">{bookings.filter((item) => item.status === 'confirmed').length}</p></div></div>
      </section>
      <section className="surface overflow-hidden rounded-3xl"><div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-champagne">Safarlar</p><h2 className="mt-1 font-display text-xl">Bronlar tarixi</h2></div><CalendarCheck2 size={18} className="text-champagne" /></div>{bookings.length ? <div className="divide-y divide-[var(--line)]">{bookings.slice(0,8).map((booking) => { const room = data.rooms.find((item) => item.id === booking.roomId); return <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="text-xs font-semibold">{room?.type ?? 'Xona'} · №{room?.number ?? '—'}</p><p className="mt-1 text-[10px] text-muted">{booking.checkIn} — {booking.checkOut} · {booking.bookingNumber}</p></div><div className="flex items-center gap-3"><StatusPill status={booking.status}>{booking.status}</StatusPill><span className="text-xs font-semibold">{formatMoney(booking.totalAmount,data.settings.currency)}</span></div></div>; })}</div> : <div className="px-6 py-16 text-center"><UserRound size={24} className="mx-auto text-champagne" /><p className="mt-4 font-display text-xl">Hali bron yo‘q</p><p className="mt-1 text-xs text-muted">Sayohatingiz uchun xona tanlang.</p><Link to="/app/rooms" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-champagne">Xonalarni ko‘rish<ArrowRight size={13} /></Link></div>}</section>
    </div>
  </div>;
}
