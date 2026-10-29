import { SearchField } from '../components/SearchField';
import { BulkDeletePanel } from '../components/BulkDeletePanel';
import { PortalImage } from '../components/PortalImage';
import { ImageUploadField } from '../components/ImageUploadField';
import { isSupportedImage } from '../services/imageUtils';
import { DatePicker } from '../components/DatePicker';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useRoomPhotos } from '../hooks/useSiteContent';
import { Select } from '../components/Select';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BedDouble, CalendarDays, Check, ChevronDown, DoorOpen, Edit3, Filter, Plus, Search, Trash2, UserRoundPlus, Users } from 'lucide-react';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatusPill } from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { availableRooms, dayDifference, formatMoney, recordAudit } from '../services/hotelUtils';
import { optimizedUnsplashUrl, unsplashSrcSet } from '../services/imageUtils';
import { makeId } from '../services/storage';
import type { Booking, Room, RoomStatus, RoomType } from '../types';

const roomTypeOptions: RoomType[] = ['Standard', 'Deluxe', 'Suite', 'Family', 'Presidential'];
const statusLabel: Record<RoomStatus, string> = { available: 'Bo‘sh', occupied: 'Band', cleaning: 'Tozalanmoqda', maintenance: 'Ta’mirda' };
const blankForm = { number: '', floor: '1', type: 'Standard' as RoomType, status: 'available' as RoomStatus, capacity: '2', pricePerNight: '480000', imageUrl: '', description: '', amenities: 'Wi-Fi, Konditsioner, Ish stoli', guestId: '', checkIn: new Date().toISOString().slice(0, 10), checkOut: new Date(Date.now() + 86400000).toISOString().slice(0, 10) };

export function RoomsPage() {
  const getRoomPhoto = useRoomPhotos();
  const { preferences } = useUserPreferences();
  const { user } = useAuth();
  const { data, updateData } = useAppData();
  const { success, error } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const guestView = user?.role === 'user';
  const [query, setQuery] = useState('');
  const [floor, setFloor] = useState('all');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState((location.state as { selectedRoomType?: string } | null)?.selectedRoomType ?? preferences.roomType);
  const [maxPrice, setMaxPrice] = useState('');
  const [capacity, setCapacity] = useState(() => String(preferences.defaultGuests));
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [form, setForm] = useState(blankForm);
  const [mode, setMode] = useState<'add' | 'edit' | 'assign'>('add');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null);
  const searchState = (location.state as { bookingSearch?: { checkIn?: string; checkOut?: string; guests?: string } } | null)?.bookingSearch;

  useEffect(() => {
    if (!searchState) return;
    setCheckIn(searchState.checkIn ?? '');
    setCheckOut(searchState.checkOut ?? '');
    setCapacity(searchState.guests ?? '1');
  }, [searchState]);

  const available = useMemo(() => availableRooms(data, checkIn, checkOut, Number(capacity)), [data, checkIn, checkOut, capacity]);
  const guestCounts = useMemo(() => {
    const today = new Date().toISOString().slice(0,10);
    return data.bookings.reduce((counts, booking) => {
      if (booking.status === 'confirmed' && booking.checkIn <= today && booking.checkOut > today) counts.set(booking.roomId, (counts.get(booking.roomId) ?? 0) + booking.adults + booking.children);
      return counts;
    }, new Map<string,number>());
  }, [data.bookings]);
  const visibleRooms = useMemo(() => (guestView ? available : data.rooms).filter((room) => {
    const matchesQuery = `${room.number} ${room.type} ${room.amenities.join(' ')}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (floor === 'all' || room.floor === Number(floor)) && (status === 'all' || room.status === status) && (type === 'all' || room.type === type) && (!maxPrice || room.pricePerNight <= Number(maxPrice)) && (!guestView || room.capacity >= Number(capacity));
  }).sort((a, b) => a.floor - b.floor || a.number.localeCompare(b.number)), [data.rooms, guestView, query, floor, status, type, maxPrice, capacity, available]);

  function openAdd() { setActiveRoom(null); setForm(blankForm); setMode('add'); setModalOpen(true); }
  function openEdit(room: Room) { setActiveRoom(room); setMode('edit'); setForm({ ...blankForm, number: room.number, floor: String(room.floor), type: room.type, status: room.status, capacity: String(room.capacity), pricePerNight: String(room.pricePerNight), imageUrl: room.imageUrl ?? '', description: room.description ?? '', amenities: room.amenities.join(', ') }); setModalOpen(true); }
  function openAssign(room: Room) { setActiveRoom(room); setMode('assign'); setForm({ ...blankForm, number: room.number, guestId: data.guests[0]?.id ?? '' }); setModalOpen(true); }

  function saveRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) { error('Xonalarni faqat administrator boshqaradi.'); return; }
    if (mode !== 'assign' && form.imageUrl.trim() && !isSupportedImage(form.imageUrl.trim())) { error('Rasm uchun http/https yoki / bilan boshlanuvchi manzil kiriting.'); return; }
    if (mode !== 'assign' && (!form.number.trim() || !Number.isInteger(Number(form.floor)) || Number(form.floor) < 1 || !Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1 || !Number.isFinite(Number(form.pricePerNight)) || Number(form.pricePerNight) <= 0)) { error('Xona raqami, qavat, sig‘im va narxni to‘g‘ri kiriting.'); return; }
    if (mode !== 'assign' && data.rooms.some((room) => room.number === form.number.trim() && room.id !== activeRoom?.id)) { error('Bu xona raqami allaqachon mavjud.'); return; }
    if (mode === 'assign' && activeRoom) {
      if (!form.guestId) { error('Avval mehmon tanlang.'); return; }
      if (form.checkOut <= form.checkIn) { error('Ketish sanasi kelish sanasidan keyin bo‘lishi kerak.'); return; }
      const occupied = data.bookings.some((booking) => booking.roomId === activeRoom.id && ['pending', 'confirmed'].includes(booking.status) && booking.checkIn < form.checkOut && booking.checkOut > form.checkIn);
      if (occupied) { error('Tanlangan sanalarda xona band.'); return; }
      const booking: Booking = { id: makeId('booking'), bookingNumber: `OR-${new Date().getFullYear()}-${String(data.bookings.length + 1).padStart(4, '0')}`, guestId: form.guestId, roomId: activeRoom.id, checkIn: form.checkIn, checkOut: form.checkOut, status: 'confirmed', adults: 1, children: 0, totalAmount: activeRoom.pricePerNight * dayDifference(form.checkIn, form.checkOut), paidAmount: 0, source: 'walk_in', createdAt: new Date().toISOString(), notes: `Admin tomonidan joylashtirildi · ${user?.email ?? ''}` };
      updateData((current) => ({ ...current, bookings: [booking, ...current.bookings], rooms: current.rooms.map((room) => room.id === activeRoom.id && form.checkIn <= new Date().toISOString().slice(0, 10) ? { ...room, status: 'occupied' } : room), auditLog: recordAudit(current, 'Xonaga mehmon joylashtirildi', 'room', activeRoom.id, user?.id, { bookingId: booking.id, guestId: form.guestId, checkIn: form.checkIn, checkOut: form.checkOut }) }));
      success(`${activeRoom.number}-xonaga mehmon joylashtirildi.`); setActiveRoom(null); setModalOpen(false); return;
    }
    if (mode === 'edit' && activeRoom) {
      updateData((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === activeRoom.id ? { ...room, number: form.number.trim(), floor: Number(form.floor), type: form.type, status: form.status, capacity: Number(form.capacity), pricePerNight: Number(form.pricePerNight), imageUrl: form.imageUrl.trim(), description: form.description.trim(), amenities: form.amenities.split(',').map((item) => item.trim()).filter(Boolean) } : room), auditLog: recordAudit(current, 'Xona tahrirlandi', 'room', activeRoom.id, user?.id) }));
      success('Xona ma’lumotlari saqlandi.'); setActiveRoom(null); setModalOpen(false); return;
    }
    if (data.rooms.some((room) => room.number === form.number.trim())) { error('Bu xona raqami allaqachon mavjud.'); return; }
    const newRoom: Room = { id: makeId('room'), number: form.number.trim(), floor: Number(form.floor), type: form.type, status: form.status, capacity: Number(form.capacity), pricePerNight: Number(form.pricePerNight), imageUrl: form.imageUrl.trim(), description: form.description.trim(), amenities: form.amenities.split(',').map((item) => item.trim()).filter(Boolean) };
    updateData((current) => ({ ...current, rooms: [...current.rooms, newRoom].sort((a, b) => a.number.localeCompare(b.number)), auditLog: recordAudit(current, 'Yangi xona qo‘shildi', 'room', newRoom.id, user?.id) }));
    success('Yangi xona qo‘shildi.'); setActiveRoom(null); setModalOpen(false);
  }

  function removeRoom() {
    if (!deleteRoom || !isAdmin) return;
    const hasBookings = data.bookings.some((booking) => booking.roomId === deleteRoom.id);
    if (hasBookings) { error('Bron tarixi bor xonani o‘chirib bo‘lmaydi. Uni ta’mir holatiga o‘tkazing.'); setDeleteRoom(null); return; }
    updateData((current) => ({ ...current, rooms: current.rooms.filter((room) => room.id !== deleteRoom.id), auditLog: recordAudit(current, 'Xona o‘chirildi', 'room', deleteRoom.id, user?.id) }));
    success(`${deleteRoom.number}-xona o‘chirildi.`); setDeleteRoom(null);
  }

  function requestRoom(room: Room) {
    navigate('/app/bookings', { state: { selectedRoomId: room.id, bookingSearch: { checkIn, checkOut, guests: capacity } } });
  }

  const roomTiles = guestView ? visibleRooms : [];
  return <div className="animate-rise-in">
    <PageHeader eyebrow={guestView ? 'Origin Hotel · Xonalar' : 'Inventar · 5 qavat'} title={guestView ? 'Sizga mos xonani toping' : 'Xonalar'} description={guestView ? 'Sanalar va sig‘imni tanlang — bo‘sh xonalarni darhol ko‘ring.' : 'Qavatlar, narxlar va xonalar holatini bir joydan boshqaring.'} action={isAdmin ? <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white hover:bg-ink-soft"><Plus size={14} />Xona qo‘shish</button> : undefined} />

    {guestView ? <div className="surface mb-6 grid items-end gap-4 rounded-3xl p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[1fr_1fr_.8fr_1fr_1fr_auto] sm:p-5">
      <FilterField label="Kelish" value={checkIn} type="date" onChange={(value) => setCheckIn(value)} />
      <FilterField label="Ketish" value={checkOut} type="date" min={checkIn} onChange={(value) => setCheckOut(value)} />
      <FilterField label="Mehmonlar" value={capacity} type="select" onChange={setCapacity} options={[['1','1 kishi'],['2','2 kishi'],['3','3 kishi'],['4','4 kishi']]} />
      <FilterField label="Xona turi" value={type} type="select" onChange={setType} options={[['all','Barcha turlar'],...roomTypeOptions.map((value): [string,string] => [value,value])]} />
      <FilterField label="Narxgacha (UZS)" value={maxPrice} type="number" onChange={setMaxPrice} placeholder="Istalgan" />
      <button onClick={() => { if (!available.length) error('Bizda bo‘sh o‘rinlar qolmagan'); }} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-champagne px-5 text-xs font-bold text-ink hover:bg-[#c8aa76]"><Search size={14} />Qidirish</button>
    </div> : <div className="room-management-filters surface mb-6 grid grid-cols-2 items-end gap-3 rounded-3xl p-4 sm:p-5 xl:flex xl:flex-wrap">
      <label className="col-span-2 min-w-0 xl:min-w-[180px] xl:flex-1"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted">Qidiruv</span><SearchField value={query} onChange={setQuery} label="Xonalarni qidirish" placeholder="Xona raqami yoki turi..." className="!h-12" /></label>
      <FilterField label="Qavat" value={floor} type="select" onChange={setFloor} options={[["all","Barcha qavatlar"],...[1,2,3,4,5].map((value): [string,string] => [String(value),`${value}-qavat`])]} />
      <FilterField label="Holat" value={status} type="select" onChange={setStatus} options={[["all","Barcha holatlar"],["available","Bo‘sh"],["occupied","Band"],["cleaning","Tozalanmoqda"],["maintenance","Ta’mirda"]]} />
      <FilterField label="Xona turi" value={type} type="select" onChange={setType} options={[["all","Barcha turlar"],...roomTypeOptions.map((value): [string,string] => [value,value])]} />
      <span className="flex h-12 min-w-0 items-center justify-center rounded-xl bg-[var(--page)] px-3 py-2.5 text-[10px] font-semibold text-muted"><Filter size={13} className="mr-1.5 inline" />{visibleRooms.length} xona</span>
    </div>}

    {isAdmin && <BulkDeletePanel subject="ta xona" items={visibleRooms.filter((room) => !data.bookings.some((booking) => booking.roomId === room.id)).map((room) => ({ id: room.id, label: `${room.number} · ${room.type}` }))} note="Bron tarixi bor xonalar o‘chirilmaydi. Tanlash joriy filtrdagi xonalarga tegishli." onDelete={(ids) => { if (!isAdmin) return; updateData((current) => { const removable = new Set(current.rooms.filter((room) => ids.includes(room.id) && !current.bookings.some((booking) => booking.roomId === room.id)).map((room) => room.id)); return { ...current, rooms: current.rooms.filter((room) => !removable.has(room.id)), auditLog: recordAudit(current, `${removable.size} ta xona guruhlab o‘chirildi`, 'room', ids.join(','), user?.id) }; }); success('Belgilangan xonalar o‘chirildi.'); }} />}
    {guestView ? <>
      {roomTiles.length === 0 ? <div className="surface rounded-3xl px-6 py-16 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-champagne/15 text-champagne"><BedDouble size={24} /></span><h2 className="mt-5 font-display text-2xl">Bizda bo‘sh o‘rinlar qolmagan</h2><p className="mt-2 text-sm text-muted">Sanalarni yoki mehmonlar sonini o‘zgartirib qayta qidiring.</p></div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{roomTiles.map((room) => { const image = getRoomPhoto(room); return <article key={room.id} className="surface overflow-hidden rounded-3xl"><div className="relative h-44"><img src={optimizedUnsplashUrl(image, 640, 72)} srcSet={unsplashSrcSet(image, [360, 480, 640, 900], 72)} sizes="(min-width: 1280px) 32vw, (min-width: 640px) 48vw, 100vw" width={900} height={600} alt={`${room.type} mehmonxona xonasi`} loading="lazy" decoding="async" className="h-full w-full object-cover" /><span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[9px] font-bold text-ink">{room.number} · {room.floor}-qavat</span></div><div className="p-5"><div className="flex items-start justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-champagne">{room.type}</p><h3 className="mt-1 font-display text-2xl">{room.type === 'Family' ? 'Oilaviy xona' : `${room.type} xona`}</h3></div><StatusPill status="available">Bo‘sh</StatusPill></div><div className="mt-4 flex gap-4 text-[10px] text-muted"><span><Users size={13} className="mr-1 inline" />{room.capacity} kishi</span><span>{room.amenities.slice(0,2).join(' · ')}</span></div><div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4"><p><span className="font-display text-xl">{formatMoney(room.pricePerNight, data.settings.currency)}</span><span className="ml-1 text-[9px] text-muted">/ tun</span></p><button onClick={() => requestRoom(room)} className="rounded-full bg-ink px-4 py-2.5 text-[10px] font-semibold text-white hover:bg-ink-soft">Bron so‘rash</button></div></div></article>;})}</div>}
    </> : <section aria-label="Xonalar ro‘yxati">
      <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Xonalar ro‘yxati</h2><p className="mt-1 text-xs text-muted">Qavat bo‘yicha saralangan · {visibleRooms.length} ta xona</p></div></div>
      {visibleRooms.length === 0 ? <div className="surface rounded-3xl px-6 py-14 text-center"><BedDouble size={28} className="mx-auto text-champagne" /><h3 className="mt-4 font-display text-2xl">Xona topilmadi</h3><p className="mt-2 text-sm text-muted">Qidiruv yoki filtrlarni o‘zgartirib ko‘ring.</p></div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {visibleRooms.map((room) => {
          const image = getRoomPhoto(room);
          return <article key={room.id} aria-label={`${room.number}-xona`} className="surface flex min-w-0 flex-col overflow-hidden rounded-3xl">
            <div className="relative aspect-[3/2] overflow-hidden">
              <PortalImage src={optimizedUnsplashUrl(image, 640, 72)} srcSet={unsplashSrcSet(image, [360, 480, 640, 900], 72)} sizes="(min-width: 1536px) 23vw, (min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" width={900} height={600} alt={`${room.number}-xona · ${room.type}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">{room.floor}-qavat</span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-champagne">{room.type}</p><h3 className="mt-1 break-words font-display text-2xl">{room.number}-xona</h3></div><StatusPill status={room.status}>{statusLabel[room.status]}</StatusPill></div>
              <p className="mt-4 flex items-center gap-2 text-xs text-muted"><Users size={15} className="shrink-0" />{guestCounts.get(room.id) ?? 0} mehmon / {room.capacity} kishi sig‘im</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{room.amenities.map((amenity) => <span key={amenity} className="max-w-full break-words rounded-lg bg-[var(--page)] px-2 py-1 text-[10px] text-muted">{amenity}</span>)}</div>
              <div className="mt-auto pt-5"><p className="break-words border-t border-[var(--line)] pt-4 text-lg font-semibold">{formatMoney(room.pricePerNight, data.settings.currency)} <span className="text-xs font-normal text-muted">/ tun</span></p>
                {isAdmin && <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => openAssign(room)} aria-label={`${room.number}-xonaga mehmon joylashtirish`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ink-soft"><UserRoundPlus size={15} />Joylashtirish</button>
                  <button onClick={() => openEdit(room)} aria-label={`${room.number}-xonani tahrirlash`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-semibold hover:bg-[var(--page)]"><Edit3 size={15} />Tahrirlash</button>
                  <button onClick={() => setDeleteRoom(room)} aria-label={`${room.number}-xonani o‘chirish`} title="O‘chirish" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--line)] text-muted hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
                </div>}
              </div>
            </div>
          </article>;
        })}
      </div>}
    </section>}


    <Modal open={modalOpen} onClose={() => { setModalOpen(false); setActiveRoom(null); }} title={mode === 'add' ? 'Yangi xona qo‘shish' : mode === 'assign' ? `${activeRoom?.number ?? ''}-xonaga mehmon joylashtirish` : `${activeRoom?.number ?? ''}-xonani tahrirlash`} description={mode === 'assign' ? 'Mehmon va qolish muddatini kiriting.' : 'Xona ma’lumotlarini to‘ldiring.'}>
      <form onSubmit={saveRoom} className="grid gap-4 sm:grid-cols-2">
        {mode === 'assign' ? <><SelectField label="Mehmon" value={form.guestId} onChange={(value) => setForm({ ...form, guestId: value })} options={data.guests.map((guest) => [guest.id,`${guest.firstName} ${guest.lastName}`])} /><FilterField label="Kelish sanasi" type="date" value={form.checkIn} onChange={(value) => setForm({ ...form, checkIn: value })} /><FilterField label="Ketish sanasi" type="date" value={form.checkOut} onChange={(value) => setForm({ ...form, checkOut: value })} /></> : <>
          <InputField label="Xona raqami" value={form.number} onChange={(value) => setForm({ ...form, number: value })} required />
          <FilterField label="Qavat" type="select" value={form.floor} onChange={(value) => setForm({ ...form, floor: value })} options={[1,2,3,4,5].map((value) => [String(value),`${value}-qavat`])} />
          <FilterField label="Xona turi" type="select" value={form.type} onChange={(value) => setForm({ ...form, type: value as RoomType })} options={roomTypeOptions.map((value): [string, string] => [value,value])} />
          <FilterField label="Holat" type="select" value={form.status} onChange={(value) => setForm({ ...form, status: value as RoomStatus })} options={Object.entries(statusLabel).map(([value,label]): [string, string] => [value,label])} />
          <InputField label="Sig‘im" type="number" min="1" max="8" value={form.capacity} onChange={(value) => setForm({ ...form, capacity: value })} required />
          <InputField label="Narx / tun (UZS)" type="number" min="1" value={form.pricePerNight} onChange={(value) => setForm({ ...form, pricePerNight: value })} required />
          <div className="sm:col-span-2"><ImageUploadField label="Xona rasmi" value={form.imageUrl} onChange={(value) => setForm((current) => ({ ...current, imageUrl: value }))} /></div><label className="text-xs font-semibold sm:col-span-2">Xona tavsifi<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="field mt-2 min-h-24" /></label>
          <div className="sm:col-span-2"><InputField label="Qulayliklar (vergul bilan)" value={form.amenities} onChange={(value) => setForm({ ...form, amenities: value })} /></div>
        </>}
        <div className="flex justify-end gap-2 pt-2 sm:col-span-2"><button type="button" onClick={() => { setModalOpen(false); setActiveRoom(null); }} className="rounded-full border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Bekor qilish</button><button className="rounded-full bg-ink px-5 py-2.5 text-xs font-bold text-white">{mode === 'assign' ? 'Joylashtirish' : mode === 'edit' ? 'Saqlash' : 'Xona qo‘shish'}</button></div>
      </form>
    </Modal>
    <Modal open={!!deleteRoom} onClose={() => setDeleteRoom(null)} title="Xonani o‘chirish" description={`${deleteRoom?.number ?? ''}-xona va uning inventar yozuvi o‘chiriladi.`}><div className="flex justify-end gap-2"><button onClick={() => setDeleteRoom(null)} className="rounded-full border border-[var(--line)] px-4 py-2.5 text-xs">Bekor qilish</button><button onClick={removeRoom} className="rounded-full bg-danger px-4 py-2.5 text-xs font-semibold text-white">O‘chirish</button></div></Modal>
  </div>;
}

function FilterField({ label, value, onChange, type = 'select', options = [], min, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: 'select' | 'date' | 'number'; options?: Array<[string,string]>; min?: string; placeholder?: string }) {
  return <label className="block min-w-0 flex-1"><span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[.13em] text-muted">{label}</span>{type === 'date' ? <DatePicker label={label} value={value} min={min} onChange={onChange} /> : type === 'select' ? <Select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--page)] px-3 py-2.5 text-xs outline-none focus:border-champagne">{options.map(([optionValue,optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</Select> : <input type={type} min={min} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-12 w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--page)] px-3 py-2.5 text-xs outline-none focus:border-champagne" />}</label>;
}
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string,string]> }) { return <FilterField label={label} value={value} onChange={onChange} options={options} />; }
function InputField({ label, value, onChange, type = 'text', min, max, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; max?: string; required?: boolean }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-semibold">{label}</span><input type={type} min={min} max={max} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs outline-none focus:border-champagne" /></label>; }
