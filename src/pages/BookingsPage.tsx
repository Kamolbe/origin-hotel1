import { useMemo, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarCheck2, CalendarClock, CalendarDays, Check, CircleDollarSign, Plus, Search, Users, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusPill } from '../components/StatusPill';
import { BookingRoomPreview } from '../components/BookingRoomPreview';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { availableRooms, dayDifference, formatMoney, recordAudit } from '../services/hotelUtils';
import { makeId } from '../services/storage';
import type { Booking, Guest } from '../types';

const statusNames = { pending: 'Kutilmoqda', confirmed: 'Tasdiqlangan', rejected: 'Rad etilgan', cancelled: 'Bekor qilingan', completed: 'Tugatilgan' } as const;
function localDateAfter(days: number, from?: string) {
  const date = from ? new Date(`${from.slice(0, 10)}T12:00:00`) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function BookingsPage() {
  const { user } = useAuth();
  const { data, updateData } = useAppData();
  const { success, error } = useToast();
  const location = useLocation();
  const staff = user?.role === 'admin' || user?.role === 'manager';
  const isAdmin = user?.role === 'admin';
  const routeState = location.state as { selectedRoomId?: string; bookingSearch?: { checkIn?: string; checkOut?: string; guests?: string } } | null;
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(Boolean(routeState?.selectedRoomId));
  const [form, setForm] = useState(() => ({ guestId: '', roomId: routeState?.selectedRoomId ?? '', checkIn: routeState?.bookingSearch?.checkIn || localDateAfter(1), checkOut: routeState?.bookingSearch?.checkOut || localDateAfter(2), adults: routeState?.bookingSearch?.guests || '1', children: '0', note: '' }));

  const visibleBookings = useMemo(() => [...data.bookings]
    .filter((booking) => staff || booking.userId === user?.id || booking.notes?.includes(user?.email ?? '__none__'))
    .filter((booking) => statusFilter === 'all' || booking.status === statusFilter)
    .filter((booking) => {
      const guest = data.guests.find((item) => item.id === booking.guestId);
      const room = data.rooms.find((item) => item.id === booking.roomId);
      return `${booking.bookingNumber} ${guest?.firstName ?? ''} ${guest?.lastName ?? ''} ${room?.number ?? ''}`.toLowerCase().includes(query.toLowerCase());
    }).sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [data.bookings, data.guests, data.rooms, staff, statusFilter, query, user?.email, user?.id]);
  const active = visibleBookings.filter((booking) => booking.status === 'confirmed' && booking.checkIn <= new Date().toISOString().slice(0,10) && booking.checkOut > new Date().toISOString().slice(0,10)).length;
  const pending = visibleBookings.filter((booking) => booking.status === 'pending').length;
  const confirmed = visibleBookings.filter((booking) => booking.status === 'confirmed').length;
  const completed = visibleBookings.filter((booking) => booking.status === 'completed').length;
  const cancelled = visibleBookings.filter((booking) => booking.status === 'cancelled').length;
  const available = useMemo(() => availableRooms(data, form.checkIn, form.checkOut, Number(form.adults) + Number(form.children)), [data, form.checkIn, form.checkOut, form.adults, form.children]);
  const selectedRoom = available.find((room) => room.id === form.roomId);
  const previewRoom = selectedRoom ?? available[0];
  const stayNights = dayDifference(form.checkIn, form.checkOut);
  const validStay = Boolean(form.checkIn && form.checkOut) && form.checkIn >= localDateAfter(0) && stayNights > 0;

  function getOrCreateGuest(): Guest | undefined {
    if (staff) return data.guests.find((guest) => guest.id === form.guestId);
    const existing = data.guests.find((guest) => guest.email.toLowerCase() === user?.email.toLowerCase());
    if (existing) return existing;
    if (!user) return undefined;
    const nameParts = user.name.split(' ');
    return { id: makeId('guest'), firstName: nameParts[0] || user.name, lastName: nameParts.slice(1).join(' '), email: user.email, phone: '', nationality: 'Uzbekistan', createdAt: new Date().toISOString() };
  }

  function createBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    if (!validStay) { error('Kelish va ketish sanalarini to‘g‘ri tanlang.'); return; }
    const room = data.rooms.find((item) => item.id === form.roomId);
    if (!room || !available.some((item) => item.id === room.id)) { error('Bizda bo‘sh o‘rinlar qolmagan'); return; }
    const guest = getOrCreateGuest();
    if (!guest) { error('Mehmon ma’lumotini topib bo‘lmadi.'); return; }
    const days = dayDifference(form.checkIn, form.checkOut);
    const booking: Booking = { id: makeId('booking'), bookingNumber: `OR-${new Date().getFullYear()}-${String(data.bookings.length + 1).padStart(4,'0')}`, userId: staff ? undefined : user.id, guestId: guest.id, roomId: room.id, checkIn: form.checkIn, checkOut: form.checkOut, status: staff ? 'confirmed' : 'pending', adults: Number(form.adults), children: Number(form.children), totalAmount: room.pricePerNight * days, paidAmount: 0, source: staff ? 'walk_in' : 'website', createdAt: new Date().toISOString(), notes: staff ? form.note : `user:${user.email}${form.note ? ` · ${form.note}` : ''}` };
    updateData((current) => ({ ...current, guests: current.guests.some((item) => item.id === guest.id) ? current.guests : [guest, ...current.guests], bookings: [booking, ...current.bookings], notifications: [{ id: makeId('notification'), userId: undefined, type: 'booking', title: 'Yangi bron so‘rovi', message: `${guest.firstName} ${guest.lastName} · ${room.number}-xona · ${form.checkIn}`, read: false, createdAt: new Date().toISOString() }, ...current.notifications], auditLog: recordAudit(current, staff ? 'Yangi bron yaratildi' : 'Foydalanuvchi bron so‘rovi yubordi', 'booking', booking.id, user.id) }));
    success(staff ? 'Yangi bron yaratildi.' : 'So‘rovingiz yuborildi. Admin tasdig‘i kutilmoqda.');
    setCreateOpen(false); setForm({ guestId: '', roomId: '', checkIn: localDateAfter(1), checkOut: localDateAfter(2), adults: '1', children: '0', note: '' });
    window.history.replaceState({}, document.title);
  }

  function changeStatus(booking: Booking, nextStatus: Booking['status']) {
    if (nextStatus === 'confirmed' && !isAdmin) return;
    if (nextStatus === 'confirmed') {
      const room = data.rooms.find((item) => item.id === booking.roomId);
      const conflict = data.bookings.some((item) => item.id !== booking.id && item.roomId === booking.roomId && ['pending','confirmed'].includes(item.status) && item.checkIn < booking.checkOut && item.checkOut > booking.checkIn);
      if (!room || room.status === 'cleaning' || room.status === 'maintenance' || conflict) { error('Bizda bo‘sh o‘rinlar qolmagan'); return; }
    }
    const ownerId = booking.userId ?? data.users.find((item) => booking.notes?.includes(item.email))?.id;
    updateData((current) => ({ ...current, bookings: current.bookings.map((item) => item.id === booking.id ? { ...item, status: nextStatus } : item), notifications: [{ id: makeId('notification'), userId: ownerId, type: 'booking', title: `Bron ${statusNames[nextStatus].toLowerCase()}`, message: `${booking.bookingNumber} bron holati yangilandi.`, read: false, createdAt: new Date().toISOString() }, ...current.notifications], auditLog: recordAudit(current, `Bron holati: ${statusNames[nextStatus]}`, 'booking', booking.id, user?.id), rooms: nextStatus === 'confirmed' && booking.checkIn <= new Date().toISOString().slice(0,10) ? current.rooms.map((room) => room.id === booking.roomId ? { ...room, status: 'occupied' } : room) : current.rooms }));
    success(`Bron ${statusNames[nextStatus].toLowerCase()}.`);
  }

  return <div className="animate-rise-in">
    <PageHeader eyebrow={staff ? 'Bronlarni boshqarish' : 'Mehmonlar portali'} title={staff ? 'Bronlar' : 'Mening bronlarim'} description={staff ? 'So‘rovlarni kuzating, mehmonlar joylashuvini boshqaring.' : 'Bron so‘rovlari, tasdiqlar va safarlaringiz tarixi.'} action={<button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white hover:bg-ink-soft"><Plus size={14} />Yangi bron</button>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><StatCard label="Mehmonxonada" value={active} icon={Users} detail="Hozir mehmonxonada" /><StatCard label="Tasdiqlangan" value={confirmed} icon={CalendarCheck2} detail="Tasdiq olgan" /><StatCard label="Kutilmoqda" value={pending} icon={CalendarClock} detail="Admin ko‘rib chiqadi" accent={isAdmin && pending > 0} /><StatCard label="Tugatilgan" value={completed} icon={Check} detail="Yakunlangan safar" /><StatCard label="Bekor qilingan" value={cancelled} icon={CircleDollarSign} detail="Bekor statusi" /></div>
    <div className="surface mt-6 overflow-hidden rounded-3xl">
      <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex flex-wrap gap-2">{[['all','Barchasi'],['pending','Kutilmoqda'],['confirmed','Tasdiqlangan'],['rejected','Rad etilgan'],['cancelled','Bekor qilingan'],['completed','Tugatilgan']].map(([value,label]) => <button key={value} onClick={() => setStatusFilter(value)} className={`rounded-full px-3 py-2 text-[10px] font-semibold ${statusFilter === value ? 'bg-ink text-white' : 'bg-[var(--page)] text-muted hover:text-[var(--text)]'}`}>{label}</button>)}</div><label className="relative block sm:w-56"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bron, mehmon, xona..." className="w-full rounded-full border border-[var(--line)] bg-[var(--page)] py-2.5 pl-9 pr-3 text-[10px] outline-none focus:border-champagne" /></label></div>
      {visibleBookings.length === 0 ? <div className="px-5 py-16 text-center"><CalendarDays className="mx-auto text-champagne" size={28} /><p className="mt-4 font-display text-xl">Bron topilmadi</p><p className="mt-1 text-xs text-muted">Filtrlarni o‘zgartiring yoki yangi bron so‘rovi yuboring.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-[var(--page)] text-[9px] uppercase tracking-[.11em] text-muted"><tr><th className="px-5 py-3">Bron / Mehmon</th><th className="px-4 py-3">Xona</th><th className="px-4 py-3">Kelish — ketish</th><th className="px-4 py-3">Mehmonlar</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3 text-right">Jami</th><th className="px-5 py-3 text-right">Amal</th></tr></thead><tbody>{visibleBookings.map((booking) => { const guest = data.guests.find((item) => item.id === booking.guestId); const room = data.rooms.find((item) => item.id === booking.roomId); const own = booking.notes?.includes(user?.email ?? '__none__'); return <tr key={booking.id} className="border-t border-[var(--line)] text-xs"><td className="px-5 py-3.5 font-semibold">{guest ? `${guest.firstName} ${guest.lastName}` : 'Mehmon'}<span className="mt-0.5 block text-[9px] font-normal text-muted">{booking.bookingNumber} · {guest?.email}</span></td><td className="px-4 py-3.5">{room?.number ?? '—'} <span className="text-[9px] text-muted">{room?.type}</span></td><td className="px-4 py-3.5 text-[10px] text-muted">{booking.checkIn} — {booking.checkOut}</td><td className="px-4 py-3.5">{booking.adults} katta{booking.children ? ` · ${booking.children} bola` : ''}</td><td className="px-4 py-3.5"><StatusPill status={booking.status}>{statusNames[booking.status]}</StatusPill></td><td className="px-4 py-3.5 text-right font-semibold">{formatMoney(booking.totalAmount,data.settings.currency)}</td><td className="px-5 py-3.5"><div className="flex justify-end gap-1">{isAdmin && booking.status === 'pending' && <><button title="Tasdiqlash" onClick={() => changeStatus(booking,'confirmed')} className="rounded-lg bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100"><Check size={14} /></button><button title="Rad etish" onClick={() => changeStatus(booking,'rejected')} className="rounded-lg bg-rose-50 p-2 text-rose-700 hover:bg-rose-100"><X size={14} /></button></>}{!staff && own && ['pending','confirmed'].includes(booking.status) && <button title="Bekor qilish" onClick={() => changeStatus(booking,'cancelled')} className="rounded-lg bg-rose-50 px-3 py-2 text-[9px] font-semibold text-rose-700">Bekor qilish</button>}{staff && !isAdmin && <span className="text-[9px] text-muted">Ko‘rish</span>}</div></td></tr>; })}</tbody></table></div>}
    </div>

    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Yangi bron so‘rovi" description={staff ? 'Mehmon nomidan bron yarating.' : 'Admin tasdiqlashidan so‘ng broningiz tasdiqlanadi.'} size="lg">
      <form onSubmit={createBooking} className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)]">
        <BookingRoomPreview room={previewRoom} selected={Boolean(selectedRoom)} currency={data.settings.currency} />
        <div className="grid min-w-0 content-start gap-4 sm:grid-cols-2">
          {staff && <label className="block min-w-0 sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold">Mehmon</span><select required value={form.guestId} onChange={(event) => setForm({ ...form, guestId: event.target.value })} className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs"><option value="">Mehmonni tanlang</option>{data.guests.map((guest) => <option key={guest.id} value={guest.id}>{guest.firstName} {guest.lastName} · {guest.email}</option>)}</select></label>}
          <label className="block min-w-0"><span className="mb-1.5 block text-[10px] font-semibold">Kelish sanasi</span><input required type="date" min={localDateAfter(0)} value={form.checkIn} onChange={(event) => { const checkIn = event.target.value; const checkOut = !checkIn ? '' : form.checkOut && form.checkOut > checkIn ? form.checkOut : localDateAfter(1, checkIn); setForm({ ...form, checkIn, checkOut, roomId: '' }); }} className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs" /></label>
          <label className="block min-w-0"><span className="mb-1.5 block text-[10px] font-semibold">Ketish sanasi</span><input required type="date" min={form.checkIn} value={form.checkOut} onChange={(event) => setForm({ ...form, checkOut: event.target.value, roomId: '' })} className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs" /></label>
          <label className="block min-w-0"><span className="mb-1.5 block text-[10px] font-semibold">Kattalar</span><select value={form.adults} onChange={(event) => setForm({ ...form, adults: event.target.value, roomId: '' })} className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs">{[1,2,3,4].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
          <label className="block min-w-0"><span className="mb-1.5 block text-[10px] font-semibold">Bolalar</span><select value={form.children} onChange={(event) => setForm({ ...form, children: event.target.value, roomId: '' })} className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs">{[0,1,2,3].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
          <label className="block min-w-0 sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold">Bo‘sh xona ({available.length})</span><select required value={form.roomId} onChange={(event) => setForm({ ...form, roomId: event.target.value })} className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs"><option value="">Xonani tanlang</option>{available.map((room) => <option key={room.id} value={room.id}>{room.number} · {room.type} · {formatMoney(room.pricePerNight,data.settings.currency)} / tun</option>)}</select>{available.length === 0 && <span className="mt-1 block text-[10px] text-danger">Bizda bo‘sh o‘rinlar qolmagan</span>}</label>
          {staff && <label className="block min-w-0 sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold">Izoh</span><textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} rows={2} className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs outline-none focus:border-champagne" /></label>}
          {selectedRoom && validStay && <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-[var(--page)] p-3 text-xs sm:col-span-2"><span className="text-muted">{stayNights} tun · taxminiy jami</span><b className="shrink-0">{formatMoney(selectedRoom.pricePerNight * stayNights,data.settings.currency)}</b></div>}
          <div className="sticky bottom-0 z-20 -mx-1 flex justify-end gap-2 border-t border-[var(--line)] bg-[var(--surface)]/95 px-1 py-3 backdrop-blur sm:col-span-2"><button type="button" onClick={() => setCreateOpen(false)} className="rounded-full border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Bekor qilish</button><button disabled={!selectedRoom || !available.length || !validStay} className="rounded-full bg-ink px-5 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{staff ? 'Bron yaratish' : 'So‘rov yuborish'}</button></div>
        </div>
      </form>
    </Modal>
  </div>;
}
