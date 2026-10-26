import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BedDouble, Check, Phone, Users } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useContactDialog } from '../context/ContactDialogContext';
import { useHotelContact } from '../hooks/useHotelContact';
import { useBookingGate } from '../hooks/useBookingAction';
import { readPendingSearch } from '../components/marketing/BookingSearch';
import { MarketingNav } from '../components/MarketingNav';
import { SiteFooter } from '../components/marketing/SiteFooter';
import { optimizedUnsplashUrl, roomPhotoForType } from '../services/imageUtils';
import { formatMoney } from '../services/hotelUtils';

export function RoomDetailsPage() {
  const { roomId } = useParams();
  const { data } = useAppData();
  const { user } = useAuth();
  const hotel = useHotelContact();
  const { openContact } = useContactDialog();
  const startBooking = useBookingGate();
  const room = data.rooms.find((item) => item.id === roomId);
  // Dates a visitor chose in the hero search before opening a room.
  const pendingSearch = user ? null : readPendingSearch();
  const alternatives = room
    ? data.rooms.filter((item) => item.id !== room.id && item.status !== 'maintenance').sort((a, b) => Math.abs(a.pricePerNight - room.pricePerNight) - Math.abs(b.pricePerNight - room.pricePerNight)).slice(0, 3)
    : [];

  return <div className="min-h-screen bg-[var(--page)] text-[var(--text)]"><MarketingNav />
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
      <Link to="/#rooms" className="inline-flex items-center gap-2 text-xs font-semibold text-muted"><ArrowLeft size={16} />Barcha xonalarga qaytish</Link>
      {!room ? <section className="surface my-8 rounded-3xl p-8"><h1 className="font-display text-3xl">Xona topilmadi</h1><p className="mt-3 text-sm text-muted">Bu xona o‘chirilgan yoki ushbu brauzerda mavjud emas. Asosiy sahifadan boshqa xona tanlang.</p></section> : <>
        <div className="my-7"><p className="text-xs font-semibold uppercase tracking-[.2em] text-champagne">{hotel.name} · Xona haqida</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">{room.type} · {room.number}-xona</h1><p className="mt-3 text-sm text-muted">Qulayliklar, sig‘im va bir tun uchun narx.</p></div>
        <div className="grid items-start gap-7 lg:grid-cols-[1.4fr_1fr]">
          <div><img src={optimizedUnsplashUrl(roomPhotoForType(room.type), 1200, 80)} alt={`${room.type} xona namunasi`} width="1200" height="800" className="aspect-[3/2] w-full rounded-3xl bg-[var(--line)] object-cover" /><p className="mt-2 text-[10px] text-muted">Rasm xona turining namunaviy ko‘rinishi.</p>
            <section className="surface mt-6 rounded-3xl p-6"><h2 className="font-display text-2xl">Xona qulayliklari</h2><ul className="mt-5 grid gap-3 sm:grid-cols-2">{room.amenities.map((item) => <li key={item} className="flex items-center gap-2 text-sm"><Check size={16} className="text-champagne" />{item}</li>)}</ul></section>
            <section className="surface mt-5 rounded-3xl p-6"><h2 className="font-display text-2xl">Qo‘shimcha xizmatlar</h2><ul className="mt-5 grid gap-3 sm:grid-cols-2">{['Nonushta (07:00–10:30)', 'Aeroportdan transfer', 'Basseyn va spa', 'Bepul avtoturargoh', 'Yuvish va dazmollash', '24/7 xonaga xizmat'].map((item) => <li key={item} className="flex items-center gap-2 text-sm"><Check size={16} className="text-champagne" />{item}</li>)}</ul><p className="mt-5 text-xs leading-6 text-muted">Qo‘shimcha xizmatlar narxi qabulxonada aniqlashtiriladi.</p></section>
          </div>
          <aside className="surface rounded-3xl p-6 lg:sticky lg:top-24"><div className="flex flex-wrap gap-4 border-b border-[var(--line)] pb-5 text-xs text-muted"><span className="flex items-center gap-2"><Users size={16} />{room.capacity} mehmon</span><span className="flex items-center gap-2"><BedDouble size={16} />{room.floor}-qavat</span></div><p className="mt-6 font-display text-3xl">{formatMoney(room.pricePerNight, data.settings.currency)}</p><p className="mt-2 text-xs text-muted">Bir tun uchun · mavjudlik tanlangan sanalarga bog‘liq</p>
            <button type="button" onClick={() => startBooking({ selectedRoomType: room.type, ...(pendingSearch ? { bookingSearch: pendingSearch } : {}) })} className="primary-button mt-6 w-full gap-2">Sanalarni tanlash va bron qilish<ArrowRight size={16} /></button>
            {!user && <p className="mt-3 rounded-2xl bg-[var(--page)] px-4 py-3 text-[11px] leading-5 text-muted">{pendingSearch ? `${pendingSearch.checkIn} — ${pendingSearch.checkOut} sanalari saqlangan. ` : ''}Bronni yakunlash uchun hisobingizga kirasiz yoki yangi hisob yaratasiz.</p>}
            <button type="button" onClick={openContact} className="secondary-button mt-3 w-full gap-2"><Phone size={16} />Administrator bilan bog‘lanish</button>
            <p className="mt-6 border-t border-[var(--line)] pt-5 text-xs leading-6 text-muted">Kelish: {data.settings.checkInTime} · Ketish: {data.settings.checkOutTime}<br />{hotel.addressLineOne}, {hotel.addressLineTwo}</p></aside>
        </div>
        {alternatives.length > 0 && <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-champagne">Boshqa variantlar</p><h2 className="mt-2 font-display text-3xl">Shunga o‘xshash xonalar</h2></div><Link to="/#rooms" className="text-xs font-semibold text-champagne">Barcha xona turlari →</Link></div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{alternatives.map((item) => <article key={item.id} className="surface overflow-hidden rounded-3xl">
            <img src={optimizedUnsplashUrl(roomPhotoForType(item.type), 640, 72)} alt={`${item.type} xona namunasi`} width={640} height={420} loading="lazy" decoding="async" className="aspect-[16/10] w-full object-cover" />
            <div className="p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-champagne">{item.type}</p><h3 className="mt-1 font-display text-xl">{item.number}-xona · {item.capacity} mehmon</h3><p className="mt-2 text-xs text-muted">{item.amenities.slice(0, 3).join(' · ')}</p><div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-4"><p className="font-display text-lg">{formatMoney(item.pricePerNight, data.settings.currency)}</p><Link to={`/rooms/${item.id}`} className="text-xs font-semibold text-champagne">Batafsil →</Link></div></div>
          </article>)}</div>
        </section>}
      </>}
    </main><SiteFooter />
  </div>;
}
