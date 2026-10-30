import { DeleteConfirmation } from '../components/DeleteConfirmation';
import { SearchField } from '../components/SearchField';
import { ResponsiveTable } from '../components/ResponsiveTable';
import { useMemo, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, Edit3, History, Plus, Trash2, UserRound, Users, UserStar } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusPill } from '../components/StatusPill';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { formatMoney, recordAudit } from '../services/hotelUtils';
import { makeId } from '../services/storage';
import type { Guest } from '../types';

const PAGE_SIZE = 15;

const blankGuest = { firstName: '', lastName: '', email: '', phone: '+998 ', nationality: 'Uzbekistan', passportNumber: '', notes: '' };

export function GuestsPage() {
  const { user } = useAuth();
  const { data, updateData } = useAppData();
  const { success, error } = useToast();
  const canManage = user?.role === 'manager';
  const canAdd = canManage && (data.serverPermissions?.includes('hotel.add_guest') ?? true);
  const canEdit = canManage && (data.serverPermissions?.includes('hotel.change_guest') ?? true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteReview, setDeleteReview] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [historyGuest, setHistoryGuest] = useState<Guest | null>(null);
  const [deleteGuest, setDeleteGuest] = useState<Guest | null>(null);
  const [form, setForm] = useState(blankGuest);
  const vipGuests = data.guests.filter((guest) => guest.notes?.includes('[VIP]')).length;
  const activeStays = data.bookings.filter((booking) => booking.status === 'confirmed' && booking.checkedInAt && !booking.checkedOutAt).length;
  const returning = data.guests.filter((guest) => data.bookings.filter((booking) => booking.guestId === guest.id).length > 1).length;
  const rows = useMemo(() => data.guests.filter((guest) => !guest.archived && `${guest.firstName} ${guest.lastName} ${guest.email} ${guest.phone} ${guest.nationality}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => a.lastName.localeCompare(b.lastName)), [data.guests, query]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(pageStart, pageStart + PAGE_SIZE);

  const protectedGuestIds = new Set(data.bookings.filter((booking) => ['pending', 'confirmed'].includes(booking.status)).map((booking) => booking.guestId));
  const selectableIds = rows.filter((guest) => !protectedGuestIds.has(guest.id)).map((guest) => guest.id);
  const selected = selectableIds.filter((id) => selectedIds.includes(id));
  const allSelected = selectableIds.length > 0 && selected.length === selectableIds.length;

  function toggleSelection(id: string) {
    setSelectedIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
    setDeleteReview(false);
  }
  function removeSelectedGuests() {
    if (!canManage || !selected.length) return;
    updateData((current) => {
      const protectedIds = new Set(current.bookings.filter((booking) => ['pending', 'confirmed'].includes(booking.status)).map((booking) => booking.guestId));
      const removable = new Set(current.guests.filter((guest) => selected.includes(guest.id) && !protectedIds.has(guest.id)).map((guest) => guest.id));
      return { ...current, guests: current.guests.filter((guest) => !removable.has(guest.id)), auditLog: recordAudit(current, `${removable.size} ta mehmon guruhlab o‘chirildi`, 'guest', [...removable].join(','), user?.id) };
    });
    setSelectedIds([]); setDeleteReview(false);
    success('Belgilangan mehmonlar o‘chirildi.');
  }

  function changePage(nextPage: number) { setPage(Math.max(1, Math.min(nextPage, totalPages))); }

  function openNew() { setEditGuest(null); setForm(blankGuest); setNewOpen(true); }
  function openEdit(guest: Guest) { setEditGuest(guest); setForm({ firstName: guest.firstName, lastName: guest.lastName, email: guest.email, phone: guest.phone, nationality: guest.nationality, passportNumber: guest.passportNumber ?? '', notes: guest.notes?.replace('[VIP] ', '') ?? '' }); setNewOpen(true); }
  function saveGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editGuest ? !canEdit : !canAdd) return;
    if (!form.firstName.trim() || !form.lastName.trim()) { error('Ism va familiyani kiriting.'); return; }
    if (form.passportNumber.trim() && !/^TEST-[A-Z0-9-]{3,30}$/.test(form.passportNumber.trim())) { error('Faqat TEST- bilan boshlangan sun’iy pasport raqamini kiriting.'); return; }
    const email = form.email.trim().toLowerCase();
    const duplicate = data.guests.some((guest) => guest.email.toLowerCase() === email && guest.id !== editGuest?.id);
    if (duplicate) { error('Bu email avval ro‘yxatdan o‘tgan.'); return; }
    const record: Guest = { id: editGuest?.id ?? makeId('guest'), firstName: form.firstName.trim(), lastName: form.lastName.trim(), email, phone: form.phone.trim(), passportNumber: form.passportNumber.trim() || undefined, nationality: form.nationality.trim() || 'Uzbekistan', createdAt: editGuest?.createdAt ?? new Date().toISOString(), notes: form.notes.trim() || undefined };
    updateData((current) => ({ ...current, guests: editGuest ? current.guests.map((guest) => guest.id === editGuest.id ? record : guest) : [record, ...current.guests], auditLog: recordAudit(current, editGuest ? 'Mehmon ma’lumoti tahrirlandi' : 'Yangi mehmon qo‘shildi', 'guest', record.id, user?.id) }));
    success(editGuest ? 'Mehmon ma’lumoti yangilandi.' : 'Yangi mehmon qo‘shildi.'); setNewOpen(false); setEditGuest(null);
  }

  function toggleVip(guest: Guest) {
    if (!canEdit) return;
    const isVip = guest.notes?.includes('[VIP]');
    const cleanNotes = guest.notes?.replace('[VIP] ', '') || undefined;
    const notes = isVip ? cleanNotes : `[VIP] ${cleanNotes ?? 'Doimiy mehmon'}`;
    updateData((current) => ({ ...current, guests: current.guests.map((item) => item.id === guest.id ? { ...item, notes } : item), auditLog: recordAudit(current, isVip ? 'VIP belgisi olib tashlandi' : 'Mehmon VIP sifatida belgilandi', 'guest', guest.id, user?.id) }));
    success(isVip ? 'VIP belgisi olib tashlandi.' : 'Mehmon VIP sifatida belgilandi.');
  }

  function removeGuest() {
    if (!deleteGuest || !canManage) return;
    const activeBooking = data.bookings.some((booking) => booking.guestId === deleteGuest.id && ['pending','confirmed'].includes(booking.status));
    if (activeBooking) { error('Faol bronlari bor mehmonni o‘chirib bo‘lmaydi.'); setDeleteGuest(null); return; }
    updateData((current) => ({ ...current, guests: current.guests.filter((guest) => guest.id !== deleteGuest.id), auditLog: recordAudit(current, 'Mehmon o‘chirildi', 'guest', deleteGuest.id, user?.id) }));
    success('Mehmon o‘chirildi.'); setDeleteGuest(null);
  }

  const selectedBookings = historyGuest ? data.bookings.filter((booking) => booking.guestId === historyGuest.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt)) : [];

  return <div className="animate-rise-in">
    <PageHeader eyebrow="Mehmonlar bilan munosabat" title="Mehmonlar" description="Mehmon profillari, VIP belgisi va tashrif tarixini ko‘ring." action={canAdd ? <button onClick={openNew} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white hover:bg-ink-soft"><Plus size={14} />Mehmon qo‘shish</button> : undefined} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Jami mehmonlar" value={data.guests.filter((guest) => !guest.archived).length} icon={Users} detail="Ro‘yxatdan o‘tgan" accent /><StatCard label="Hozir yashayotganlar" value={activeStays} icon={UserRound} detail="Faol joylashuv" /><StatCard label="VIP mehmonlar" value={vipGuests} icon={UserStar} detail="Alohida e’tibor" /><StatCard label="Qaytib kelganlar" value={returning} icon={History} detail="Bir necha bron qilgan" /></div>

    <section className="surface mt-6 overflow-hidden rounded-3xl">
      <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-xs font-semibold">Mehmonlar ro‘yxati</p><p className="mt-1 text-[10px] text-muted">{rows.length} mehmon topildi</p></div><SearchField value={query} onChange={(value) => { setQuery(value); setPage(1); setSelectedIds([]); setDeleteReview(false); }} label="Mehmonlarni qidirish" placeholder="Ism, email yoki telefon..." className="w-full shrink-0 sm:w-64" /></div>
      {canManage && <div className="border-b border-[var(--line)] bg-[var(--page)]/50 p-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-xs font-semibold"><input type="checkbox" aria-label="Barcha mehmonlarni belgilash" checked={allSelected} ref={(element) => { if (element) element.indeterminate = selected.length > 0 && !allSelected; }} disabled={!selectableIds.length} onChange={() => { setSelectedIds(allSelected ? [] : selectableIds); setDeleteReview(false); }} className="h-5 w-5 shrink-0 accent-[var(--champagne)]" />Barchasini belgilash</label>
          <div className="flex flex-wrap items-center gap-3"><span aria-live="polite" className="text-xs text-muted">{selected.length} ta belgilangan</span><button type="button" disabled={!selected.length} onClick={() => setDeleteReview(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-500/25 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14} />Belgilanganlarni o‘chirish</button></div>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-muted">Barcha sahifalardagi qidiruv natijalari belgilanadi. Faol bronlari bor mehmonlar o‘chirilmaydi.</p>
        <DeleteConfirmation open={deleteReview && selected.length > 0} onClose={()=>setDeleteReview(false)} onConfirm={removeSelectedGuests} title="Mehmonlarni o‘chirish" description={`${selected.length} ta mehmon tanlangan. Faol broni bor mehmonlar o‘chirilmaydi.`} />
      </div>}
      <ResponsiveTable><table className="w-full min-w-[840px] text-left"><thead className="bg-[var(--page)] text-[9px] uppercase tracking-[.11em] text-muted"><tr><th className="px-5 py-3">Mehmon</th><th className="px-4 py-3">Aloqa</th><th className="px-4 py-3">Fuqarolik</th><th className="px-4 py-3">Tashriflar</th><th className="px-4 py-3">Belgisi</th><th className="px-5 py-3 text-right">Amallar</th></tr></thead><tbody>{pageRows.map((guest) => { const visits = data.bookings.filter((booking) => booking.guestId === guest.id); const isVip = guest.notes?.includes('[VIP]'); return <tr key={guest.id} className="border-t border-[var(--line)] text-xs"><td className="px-5 py-3.5"><div className="flex items-center gap-3">{canManage && <label title={protectedGuestIds.has(guest.id) ? 'Faol bronlari bor mehmonni o‘chirib bo‘lmaydi' : 'Mehmonni belgilash'} className="inline-flex min-h-11 items-center"><input type="checkbox" aria-label={`${guest.firstName} ${guest.lastName} ni belgilash`} disabled={protectedGuestIds.has(guest.id)} checked={selected.includes(guest.id)} onChange={() => toggleSelection(guest.id)} className="h-5 w-5 shrink-0 accent-[var(--champagne)] disabled:opacity-35" /></label>}<span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--page)] text-[10px] font-bold text-champagne">{guest.firstName[0]}{guest.lastName[0]}</span><span className="font-semibold">{guest.firstName} {guest.lastName}<span className="mt-0.5 block text-[9px] font-normal text-muted">{guest.notes?.replace('[VIP] ', '') || 'Mehmon'}{guest.passportNumber ? ` · ${guest.passportNumber}` : ''}</span></span></div></td><td className="px-4 py-3.5">{guest.email}<span className="mt-0.5 block text-[9px] text-muted">{guest.phone || 'Telefon kiritilmagan'}</span></td><td className="px-4 py-3.5">{guest.nationality}</td><td className="px-4 py-3.5">{visits.length} bron</td><td className="px-4 py-3.5">{isVip ? <StatusPill status="confirmed">VIP</StatusPill> : <span className="text-[10px] text-muted">Oddiy</span>}</td><td className="px-5 py-3.5"><div className="flex justify-end gap-1"><button title="Bron tarixi" onClick={() => setHistoryGuest(guest)} className="rounded-lg p-2 text-muted hover:bg-[var(--page)] hover:text-champagne"><History size={15} /></button>{canEdit && <><button title={isVip ? 'VIP belgisini olib tashlash' : 'VIP qilish'} onClick={() => toggleVip(guest)} className="rounded-lg p-2 text-muted hover:bg-champagne/10 hover:text-champagne"><UserStar size={15} /></button><button title="Tahrirlash" onClick={() => openEdit(guest)} className="rounded-lg p-2 text-muted hover:bg-[var(--page)]"><Edit3 size={15} /></button>{canManage && <button title="O‘chirish" onClick={() => setDeleteGuest(guest)} className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>}</>}</div></td></tr>; })}</tbody></table></ResponsiveTable>
      {rows.length === 0 && <p className="px-5 py-12 text-center text-sm text-muted">Mehmon topilmadi. Qidiruvni o‘zgartirib ko‘ring.</p>}
      <nav aria-label="Mehmonlar sahifalari" className="flex flex-col gap-4 border-t border-[var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p aria-live="polite" className="text-xs text-muted">{rows.length ? `${pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, rows.length)}` : '0'} / {rows.length} mehmon</p>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-[var(--line)] px-3 text-xs font-semibold hover:bg-[var(--page)] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={15} />Oldingisi</button>
          <span className="whitespace-nowrap text-xs text-muted" aria-label={`${currentPage}-sahifa, jami ${totalPages} sahifa`}>{currentPage} / {totalPages}</span>
          <button type="button" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-[var(--line)] px-3 text-xs font-semibold hover:bg-[var(--page)] disabled:cursor-not-allowed disabled:opacity-40">Keyingisi<ChevronRight size={15} /></button>
        </div>
      </nav>
    </section>
    <Modal open={newOpen} onClose={() => setNewOpen(false)} title={editGuest ? 'Mehmon ma’lumotini tahrirlash' : 'Yangi mehmon'} description="Aloqa ma’lumotlarini kiriting."><form onSubmit={saveGuest} className="grid gap-4 sm:grid-cols-2">{[['Ism','firstName'],['Familiya','lastName'],['Email','email'],['Telefon','phone'],['Fuqarolik','nationality'],['Test pasport raqami (TEST-...)','passportNumber']].map(([label,key]) => <label key={key} className="block"><span className="mb-1.5 block text-[10px] font-semibold">{label}</span><input required={key === 'firstName' || key === 'lastName' || key === 'email'} type={key === 'email' ? 'email' : 'text'} value={form[key as keyof typeof form]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs outline-none focus:border-champagne" /></label>)}<label className="block sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold">Izoh</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={2} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs outline-none focus:border-champagne" /></label><div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setNewOpen(false)} className="rounded-full border border-[var(--line)] px-4 py-2.5 text-xs">Bekor qilish</button><button className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white">Saqlash</button></div></form></Modal>
    <Modal open={!!historyGuest} onClose={() => setHistoryGuest(null)} title={`${historyGuest?.firstName ?? ''} ${historyGuest?.lastName ?? ''} · tashrif tarixi`} size="lg"><div className="space-y-2">{selectedBookings.length ? selectedBookings.map((booking) => { const room = data.rooms.find((item) => item.id === booking.roomId); return <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--page)] p-3 text-xs"><span><b>{booking.bookingNumber}</b><span className="mt-1 block text-[10px] text-muted">{booking.checkIn} — {booking.checkOut} · xona {room?.number ?? '—'}</span></span><span className="flex items-center gap-3"><StatusPill status={booking.status}>{booking.status}</StatusPill><b>{formatMoney(booking.totalAmount,data.settings.currency)}</b></span></div>; }) : <p className="py-8 text-center text-xs text-muted">Bron tarixi mavjud emas.</p>}</div></Modal>
    <Modal open={!!deleteGuest} onClose={() => setDeleteGuest(null)} title="Mehmonni o‘chirish" description={`${deleteGuest?.firstName ?? ''} ${deleteGuest?.lastName ?? ''} ma’lumotlari ro‘yxatdan o‘chiriladi.`}><div className="flex justify-end gap-2"><button onClick={() => setDeleteGuest(null)} className="rounded-full border border-[var(--line)] px-4 py-2.5 text-xs">Bekor qilish</button><button onClick={removeGuest} className="rounded-full bg-danger px-4 py-2.5 text-xs font-semibold text-white">O‘chirish</button></div></Modal>
  </div>;
}
