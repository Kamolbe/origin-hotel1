import { stayAction, validStayDates } from '../services/hotelOperations';
import { hotelToday } from '../services/dashboardMetrics';
import { BookingNote } from '../components/BookingNote';
import { SearchField } from '../components/SearchField';
import { ownBookings } from '../services/dashboardMetrics';
import { legacyBookingEmail } from '../services/bookingNotes';
import { DatePicker } from '../components/DatePicker';
import { ResponsiveTable } from '../components/ResponsiveTable';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { Select } from '../components/Select';
import { useMemo, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarCheck2, CalendarClock, CalendarDays, Check, CircleDollarSign, Plus, Trash2, Users, X } from 'lucide-react';
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
  const { preferences } = useUserPreferences();
  const { user } = useAuth();
  const { data, updateData } = useAppData();
  const { success, error } = useToast();
  const location = useLocation();
  const staff = user?.role === 'admin' || user?.role === 'manager';
  const isAdmin = user?.role === 'admin';
  const routeState = location.state as { selectedRoomId?: string; createBooking?: boolean; bookingSearch?: { checkIn?: string; checkOut?: string; guests?: string } } | null;
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(Boolean(routeState?.selectedRoomId || routeState?.createBooking));
  const [form, setForm] = useState(() => ({ guestId: '', roomId: routeState?.selectedRoomId ?? '', checkIn: routeState?.bookingSearch?.checkIn || localDateAfter(1), checkOut: routeState?.bookingSearch?.checkOut || localDateAfter(2), adults: routeState?.bookingSearch?.guests || (staff ? '1' : String(preferences.defaultGuests)), children: '0', note: staff ? '' : preferences.bookingNote }));

  const matchingBookings = useMemo(() => [...(staff ? data.bookings : ownBookings(data, user))]
    .filter((booking) => {
      const guest = data.guests.find((item) => item.id === booking.guestId);
      const room = data.rooms.find((item) => item.id === booking.roomId);
      return `${booking.bookingNumber} ${guest?.firstName ?? ''} ${guest?.lastName ?? ''} ${room?.number ?? ''}`.toLowerCase().includes(query.toLowerCase());
    }).sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [data.bookings, data.guests, data.rooms, staff, query, user?.email, user?.id]);
  const visibleBookings = matchingBookings.filter((booking) => statusFilter === 'all' || booking.status === statusFilter);
  const showBulkDelete = isAdmin && ['completed', 'cancelled'].includes(statusFilter);
  const selectableBookings = showBulkDelete ? visibleBookings : [];
  const selectedVisibleIds = selectableBookings.filter((booking) => selectedIds.includes(booking.id)).map((booking) => booking.id);
  const deleteTargets = data.bookings.filter((booking) => deleteIds.includes(booking.id) && ['completed', 'cancelled'].includes(booking.status));
  const statusCounts = matchingBookings.reduce<Record<string, number>>((counts, booking) => { counts[booking.status] = (counts[booking.status] ?? 0) + 1; return counts; }, { all: matchingBookings.length });
  const active = visibleBookings.filter((booking) => booking.status === 'confirmed' && booking.checkedInAt && !booking.checkedOutAt).length;
  const pending = visibleBookings.filter((booking) => booking.status === 'pending').length;
  const confirmed = visibleBookings.filter((booking) => booking.status === 'confirmed').length;
  const completed = visibleBookings.filter((booking) => booking.status === 'completed').length;
  const cancelled = visibleBookings.filter((booking) => booking.status === 'cancelled').length;
  const available = useMemo(() => availableRooms(data, form.checkIn, form.checkOut, Number(form.adults) + Number(form.children)), [data, form.checkIn, form.checkOut, form.adults, form.children]);
  const selectedRoom = available.find((room) => room.id === form.roomId);
  const previewRoom = selectedRoom ?? available[0];
  const stayNights = dayDifference(form.checkIn, form.checkOut);
  const validStay = validStayDates(form.checkIn, form.checkOut) && form.checkIn >= localDateAfter(0) && stayNights > 0;

  function getOrCreateGuest(): Guest | undefined {
    if (staff) return data.guests.find((guest) => guest.id === form.guestId);
    const existing = data.guests.find((guest) => !guest.archived && guest.email.toLowerCase() === user?.email.toLowerCase());
    if (existing) return existing;
    if (!user) return undefined;
    const nameParts = user.name.split(' ');
    return { id: makeId('guest'), firstName: nameParts[0] || user.name, lastName: nameParts.slice(1).join(' '), email: user.email, phone: data.users.find((item) => item.id === user.id)?.phone ?? '', nationality: data.users.find((item) => item.id === user.id)?.nationality || 'Kiritilmagan', createdAt: new Date().toISOString() };
  }

  function createBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    if (!Number.isInteger(Number(form.adults)) || Number(form.adults) < 1 || !Number.isInteger(Number(form.children)) || Number(form.children) < 0) { error('Mehmonlar sonini to‘g‘ri kiriting.'); return; }
    if (!validStay) { error('Kelish va ketish sanalarini to‘g‘ri tanlang.'); return; }
    const room = data.rooms.find((item) => item.id === form.roomId);
    if (!room || !available.some((item) => item.id === room.id)) { error('Bizda bo‘sh o‘rinlar qolmagan'); return; }
    const guest = getOrCreateGuest();
    if (!guest) { error('Mehmon ma’lumotini topib bo‘lmadi.'); return; }
    const days = dayDifference(form.checkIn, form.checkOut);
    const booking: Booking = { id: makeId('booking'), bookingNumber: `OR-${new Date().getFullYear()}-${String(data.bookings.length + 1).padStart(4,'0')}`, userId: staff ? undefined : user.id, guestId: guest.id, roomId: room.id, checkIn: form.checkIn, checkOut: form.checkOut, status: staff ? 'confirmed' : 'pending', adults: Number(form.adults), children: Number(form.children), totalAmount: room.pricePerNight * days, paidAmount: 0, source: staff ? 'walk_in' : 'website', createdAt: new Date().toISOString(), notes: staff ? form.note.trim() : undefined, guestNote: staff ? undefined : form.note.trim() };
    updateData((current) => ({ ...current, guests: current.guests.some((item) => item.id === guest.id) ? current.guests : [guest, ...current.guests], bookings: [booking, ...current.bookings], notifications: [{ id: makeId('notification'), userId: undefined, type: 'booking', title: 'Yangi bron so‘rovi', message: `${guest.firstName} ${guest.lastName} · ${room.number}-xona · ${form.checkIn}`, read: false, createdAt: new Date().toISOString() }, ...current.notifications], auditLog: recordAudit(current, staff ? 'Yangi bron yaratildi' : 'Foydalanuvchi bron so‘rovi yubordi', 'booking', booking.id, user.id) }));
    success(staff ? 'Yangi bron yaratildi.' : 'So‘rovingiz yuborildi. Admin tasdig‘i kutilmoqda.');
    setCreateOpen(false); setForm({ guestId: '', roomId: '', checkIn: localDateAfter(1), checkOut: localDateAfter(2), adults: staff ? '1' : String(preferences.defaultGuests), children: '0', note: staff ? '' : preferences.bookingNote });
    window.history.replaceState({}, document.title);
  }

  function deleteFinishedBookings() {
    if (!isAdmin || !deleteTargets.length) return;
    const ids = new Set(deleteTargets.map((booking) => booking.id));
    updateData((current) => {
      const removable = new Set(current.bookings.filter((booking) => ids.has(booking.id) && ['completed', 'cancelled'].includes(booking.status)).map((booking) => booking.id));
      return { ...current, bookings: current.bookings.filter((booking) => !removable.has(booking.id)), finance: current.finance.map((entry) => entry.bookingId && removable.has(entry.bookingId) ? { ...entry, bookingId: undefined } : entry), auditLog: recordAudit(current, `Yakunlangan bronlar o‘chirildi: ${deleteTargets.map((booking) => booking.bookingNumber).join(', ')}`, 'booking', deleteTargets[0].id, user?.id) };
    });
    setSelectedIds([]); setDeleteIds([]);
    success(`${deleteTargets.length} ta bron o‘chirildi.`);
  }

  function handleStay(booking: Booking, action: 'check-in' | 'check-out') {
    if (!user || !staff) return;
    try {
      updateData((current) => {
        const next = stayAction(current, booking.id, action, user.role, new Date(), hotelToday(current.settings.timeZone));
        return { ...next, auditLog: recordAudit(next, action === 'check-in' ? 'Mehmon joylashtirildi (check-in)' : 'Mehmon chiqarildi (check-out)', 'booking', booking.id, user.id) };
      });
      success(action === 'check-in' ? 'Check-in bajarildi. Xona band qilindi.' : 'Check-out bajarildi. Xona tozalashga o‘tkazildi.');
    } catch (cause) { error(cause instanceof Error ? cause.message : 'Amal bajarilmadi.'); }
  }

  function changeStatus(booking: Booking, nextStatus: Booking['status']) {
    if (booking.checkedInAt && !booking.checkedOutAt) { error('Joylashtirilgan mehmon uchun Check-out tugmasidan foydalaning.'); return; }
    if (nextStatus === 'confirmed' && !isAdmin) return;
    if (nextStatus === 'completed' && (!isAdmin || !['confirmed', 'rejected'].includes(booking.status))) return;
    if (nextStatus === 'confirmed') {
      const room = data.rooms.find((item) => item.id === booking.roomId);
      const conflict = data.bookings.some((item) => item.id !== booking.id && item.roomId === booking.roomId && ['pending','confirmed'].includes(item.status) && item.checkIn < booking.checkOut && item.checkOut > booking.checkIn);
      if (!room || room.status === 'cleaning' || room.status === 'maintenance' || conflict) { error('Bizda bo‘sh o‘rinlar qolmagan'); return; }
    }
    const guestEmail = data.guests.find((guest) => guest.id === booking.guestId)?.email.toLowerCase();
    const ownerId = booking.userId ?? data.users.find((item) => item.email.toLowerCase() === (legacyBookingEmail(booking) ?? guestEmail))?.id;
    updateData((current) => ({ ...current, bookings: current.bookings.map((item) => item.id === booking.id ? { ...item, status: nextStatus } : item), notifications: [{ id: makeId('notification'), userId: ownerId, type: 'booking', title: `Bron ${statusNames[nextStatus].toLowerCase()}`, message: `${booking.bookingNumber} bron holati yangilandi.`, read: false, createdAt: new Date().toISOString() }, ...current.notifications], auditLog: recordAudit(current, `Bron holati: ${statusNames[nextStatus]}`, 'booking', booking.id, user?.id) }));
    success(`Bron ${statusNames[nextStatus].toLowerCase()}.`);
  }

  return <div className="animate-rise-in">
    <PageHeader eyebrow={staff ? 'Bronlarni boshqarish' : 'Mehmonlar portali'} title={staff ? 'Bronlar' : 'Mening bronlarim'} description={staff ? 'So‘rovlarni kuzating, mehmonlar joylashuvini boshqaring.' : 'Bron so‘rovlari, tasdiqlar va safarlaringiz tarixi.'} action={<button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white hover:bg-ink-soft"><Plus size={14} />Yangi bron</button>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><StatCard label="Mehmonxonada" value={active} icon={Users} detail="Hozir mehmonxonada" /><StatCard label="Tasdiqlangan" value={confirmed} icon={CalendarCheck2} detail="Tasdiq olgan" /><StatCard label="Kutilmoqda" value={pending} icon={CalendarClock} detail="Admin ko‘rib chiqadi" accent={isAdmin && pending > 0} /><StatCard label="Tugatilgan" value={completed} icon={Check} detail="Yakunlangan safar" /><StatCard label="Bekor qilingan" value={cancelled} icon={CircleDollarSign} detail="Bekor statusi" /></div>
    <div className="surface mt-6 overflow-hidden rounded-3xl">
      <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex flex-wrap gap-2">{[['all','Barchasi'],['pending','Kutilmoqda'],['confirmed','Tasdiqlangan'],['rejected','Rad etilgan'],['cancelled','Bekor qilingan'],['completed','Tugatilgan']].map(([value,label]) => <button key={value} onClick={() => { setStatusFilter(value); setSelectedIds([]); setDeleteIds([]); }} aria-pressed={statusFilter === value} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-semibold ${statusFilter === value ? 'bg-ink text-white' : 'bg-[var(--page)] text-muted hover:text-[var(--text)]'}`}>{label}<span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] tabular-nums ${statusFilter === value ? 'bg-white/15 text-white' : 'bg-champagne/15 text-[var(--text)]'}`}>{statusCounts[value] ?? 0}</span></button>)}</div><SearchField label="Bronlarni qidirish" value={query} onChange={(value) => { setQuery(value); setSelectedIds([]); setDeleteIds([]); }} placeholder="Bron, mehmon, xona..." className="w-full shrink-0 sm:w-64" /></div>
      {showBulkDelete && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--page)]/50 px-5 py-3"><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" aria-label={statusFilter === 'cancelled' ? 'Barcha bekor qilingan bronlarni belgilash' : 'Barcha tugatilgan bronlarni belgilash'} checked={selectableBookings.length > 0 && selectedVisibleIds.length === selectableBookings.length} disabled={!selectableBookings.length} onChange={(event) => { setSelectedIds(event.target.checked ? selectableBookings.map((booking) => booking.id) : []); setDeleteIds([]); }} className="h-4 w-4 accent-[var(--champagne)]" />Barchasini belgilash<span className="text-muted">({selectedVisibleIds.length} / {selectableBookings.length})</span></label><button type="button" disabled={!selectedVisibleIds.length} onClick={() => setDeleteIds(selectedVisibleIds)} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14} />Belgilanganlarni o‘chirish ({selectedVisibleIds.length})</button></div>}
      {isAdmin && deleteIds.length > 0 && <section aria-label="Bronlarni o‘chirishni tasdiqlash" className="m-4 rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4 sm:m-5">
      <h3 className="mb-2 text-sm font-semibold">{deleteTargets.length} ta bronni butunlay o‘chirmoqchimisiz?</h3>
      <p className="text-sm leading-7 text-muted">Bu amalni qaytarib bo‘lmaydi. Faqat tugatilgan yoki bekor qilingan bronlar o‘chiriladi. Moliyaviy yozuvlar va mehmon ma’lumotlari saqlanadi.</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setDeleteIds([])} className="secondary-button">Bekor qilish</button><button type="button" disabled={!deleteTargets.length} onClick={deleteFinishedBookings} className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-xs font-semibold text-white disabled:opacity-40"><Trash2 size={15} />Ha, o‘chirish ({deleteTargets.length})</button></div>
      </section>}
      {visibleBookings.length === 0 ? <div className="px-5 py-16 text-center"><CalendarDays className="mx-auto text-champagne" size={28} /><p className="mt-4 font-display text-xl">Bron topilmadi</p><p className="mt-1 text-xs text-muted">Filtrlarni o‘zgartiring yoki yangi bron so‘rovi yuboring.</p></div> : <ResponsiveTable><table className="w-full min-w-[1060px] text-left"><thead className="bg-[var(--page)] text-[9px] uppercase tracking-[.11em] text-muted"><tr>{showBulkDelete && <th className="w-12 px-4 py-3"><span className="sr-only">Belgilash</span></th>}<th className="px-5 py-3">Bron / Mehmon</th><th className="px-4 py-3">Xona</th><th className="px-4 py-3">Kelish — ketish</th><th className="px-4 py-3">Mehmonlar</th><th className="px-4 py-3">Izoh</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3 text-right">Jami</th><th className="px-5 py-3 text-right">Amal</th></tr></thead><tbody>{visibleBookings.map((booking) => { const guest = data.guests.find((item) => item.id === booking.guestId); const room = data.rooms.find((item) => item.id === booking.roomId); const own = !staff; return <tr key={booking.id} className="border-t border-[var(--line)] text-xs">{showBulkDelete && <td className="px-4 py-3.5"><input type="checkbox" aria-label={`${booking.bookingNumber} bronni belgilash`} checked={selectedIds.includes(booking.id)} onChange={(event) => { setSelectedIds((ids) => event.target.checked ? [...ids, booking.id] : ids.filter((id) => id !== booking.id)); setDeleteIds([]); }} className="h-4 w-4 accent-[var(--champagne)]" /></td>}<td className="px-5 py-3.5 font-semibold">{guest ? `${guest.firstName} ${guest.lastName}` : 'Mehmon'}<span className="mt-0.5 block text-[9px] font-normal text-muted">{booking.bookingNumber} · {guest?.email}</span></td><td className="px-4 py-3.5">{room?.number ?? '—'} <span className="text-[9px] text-muted">{room?.type}</span></td><td className="px-4 py-3.5 text-[10px] text-muted">{booking.checkIn} — {booking.checkOut}</td><td className="px-4 py-3.5">{booking.adults} katta{booking.children ? ` · ${booking.children} bola` : ''}</td><td className="px-4 py-3.5"><BookingNote booking={booking} /></td><td className="px-4 py-3.5"><StatusPill status={booking.status}>{statusNames[booking.status]}</StatusPill>{booking.checkedInAt && <span className="mt-2 block whitespace-nowrap text-[9px] text-muted">Kirdi: {new Date(booking.checkedInAt).toLocaleString('uz-UZ')}</span>}{booking.checkedOutAt && <span className="mt-1 block whitespace-nowrap text-[9px] text-muted">Chiqdi: {new Date(booking.checkedOutAt).toLocaleString('uz-UZ')}</span>}</td><td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold">{formatMoney(booking.totalAmount,data.settings.currency)}</td><td className="px-5 py-3.5"><div className="flex justify-end gap-1">{isAdmin && booking.status === 'pending' && <><button title="Tasdiqlash" onClick={() => changeStatus(booking,'confirmed')} className="rounded-lg bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100"><Check size={14} /></button><button title="Rad etish" onClick={() => changeStatus(booking,'rejected')} className="rounded-lg bg-rose-50 p-2 text-rose-700 hover:bg-rose-100"><X size={14} /></button></>}{isAdmin && ['completed', 'cancelled'].includes(booking.status) && <button type="button" onClick={() => setDeleteIds([booking.id])} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700 hover:bg-rose-100"><Trash2 size={14} />O‘chirish</button>}{isAdmin && !booking.checkedInAt && ['confirmed', 'rejected'].includes(booking.status) && <button type="button" onClick={() => changeStatus(booking, 'completed')} className="inline-flex items-center gap-1.5 rounded-lg bg-champagne/15 px-3 py-2 text-[10px] font-semibold text-[var(--text)] transition hover:bg-champagne/30"><Check size={14} />Tugatish</button>}{!staff && own && ['pending','confirmed'].includes(booking.status) && !booking.checkedInAt && <button title="Bekor qilish" onClick={() => changeStatus(booking,'cancelled')} className="rounded-lg bg-rose-50 px-3 py-2 text-[9px] font-semibold text-rose-700">Bekor qilish</button>}{staff && booking.status === 'confirmed' && <button type="button" onClick={() => handleStay(booking, booking.checkedInAt ? 'check-out' : 'check-in')} className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-lg bg-champagne/15 px-3 py-2 text-[10px] font-semibold text-[var(--text)] hover:bg-champagne/30">{booking.checkedInAt ? 'Check-out' : 'Check-in'}</button>}{staff && !isAdmin && booking.status !== 'confirmed' && <span className="text-[9px] text-muted">Ko‘rish</span>}</div></td></tr>; })}</tbody></table></ResponsiveTable>}
    </div>



    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Yangi bron so‘rovi" description={staff ? 'Mehmon nomidan bron yarating.' : 'Admin tasdiqlashidan so‘ng broningiz tasdiqlanadi.'} size="lg">
      <form onSubmit={createBooking} className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)]">
        <BookingRoomPreview room={previewRoom} selected={Boolean(selectedRoom)} currency={data.settings.currency} />
        <div className="grid min-w-0 content-start gap-4 sm:grid-cols-2">
          {staff && <label className="block min-w-0 sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold">Mehmon</span><Select required value={form.guestId} onChange={(event) => setForm({ ...form, guestId: event.target.value })} className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs"><option value="">Mehmonni tanlang</option>{data.guests.filter((guest) => !guest.archived).map((guest) => <option key={guest.id} value={guest.id}>{guest.firstName} {guest.lastName} · {guest.email}</option>)}</Select></label>}
          <label className="block min-w-0"><span className="mb-1.5 block text-[10px] font-semibold">Kelish sanasi</span><DatePicker label="Kelish sanasi" required min={localDateAfter(0)} value={form.checkIn} onChange={(checkIn) => { const checkOut = !checkIn ? '' : form.checkOut && form.checkOut > checkIn ? form.checkOut : localDateAfter(1, checkIn); setForm({ ...form, checkIn, checkOut, roomId: '' }); }} /></label>
          <label className="block min-w-0"><span className="mb-1.5 block text-[10px] font-semibold">Ketish sanasi</span><DatePicker label="Ketish sanasi" required min={form.checkIn ? localDateAfter(1, form.checkIn) : localDateAfter(1)} value={form.checkOut} onChange={(checkOut) => setForm({ ...form, checkOut, roomId: '' })} /></label>
          <label className="block min-w-0"><span className="mb-1.5 block text-[10px] font-semibold">Kattalar</span><Select value={form.adults} onChange={(event) => setForm({ ...form, adults: event.target.value, roomId: '' })} className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs">{[1,2,3,4].map((n) => <option key={n} value={n}>{n}</option>)}</Select></label>
          <label className="block min-w-0"><span className="mb-1.5 block text-[10px] font-semibold">Bolalar</span><Select value={form.children} onChange={(event) => setForm({ ...form, children: event.target.value, roomId: '' })} className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs">{[0,1,2,3].map((n) => <option key={n} value={n}>{n}</option>)}</Select></label>
          <label className="block min-w-0 sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold">Bo‘sh xona ({available.length})</span><Select required value={form.roomId} onChange={(event) => setForm({ ...form, roomId: event.target.value })} className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs"><option value="">Xonani tanlang</option>{available.map((room) => <option key={room.id} value={room.id}>{room.number} · {room.type} · {formatMoney(room.pricePerNight,data.settings.currency)} / tun</option>)}</Select>{available.length === 0 && <span className="mt-1 block text-[10px] text-danger">Bizda bo‘sh o‘rinlar qolmagan</span>}</label>
          <label className="block min-w-0 sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold">Izoh</span><textarea value={form.note} maxLength={500} onChange={(event) => setForm({ ...form, note: event.target.value })} rows={2} className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs outline-none focus:border-champagne" /></label>
          {selectedRoom && validStay && <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-[var(--page)] p-3 text-xs sm:col-span-2"><span className="text-muted">{stayNights} tun · taxminiy jami</span><b className="shrink-0">{formatMoney(selectedRoom.pricePerNight * stayNights,data.settings.currency)}</b></div>}
          <div className="sticky bottom-0 z-20 -mx-1 flex justify-end gap-2 border-t border-[var(--line)] bg-[var(--surface)]/95 px-1 py-3 backdrop-blur sm:col-span-2"><button type="button" onClick={() => setCreateOpen(false)} className="rounded-full border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Bekor qilish</button><button disabled={!selectedRoom || !available.length || !validStay} className="rounded-full bg-ink px-5 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{staff ? 'Bron yaratish' : 'So‘rov yuborish'}</button></div>
        </div>
      </form>
    </Modal>
  </div>;
}
