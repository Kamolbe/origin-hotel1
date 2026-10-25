import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BedDouble, Check, Phone, Users } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useHotelContact } from '../hooks/useHotelContact';
import { MarketingNav } from '../components/MarketingNav';
import { SiteFooter } from '../components/marketing/SiteFooter';
import { optimizedUnsplashUrl, roomPhotoForType } from '../services/imageUtils';
import { formatMoney } from '../services/hotelUtils';

export function RoomDetailsPage() {
  const { roomId } = useParams();
  const { data } = useAppData();
  const hotel = useHotelContact();
  const room = data.rooms.find((item) => item.id === roomId);
  return <div className="min-h-screen bg-[var(--page)] text-[var(--text)]"><MarketingNav />
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
      <Link to="/#rooms" className="inline-flex items-center gap-2 text-xs font-semibold text-muted"><ArrowLeft size={16} />Barcha xonalarga qaytish</Link>
      {!room ? <section className="surface my-8 rounded-3xl p-8"><h1 className="font-display text-3xl">Xona topilmadi</h1><p className="mt-3 text-sm text-muted">Bu xona o‘chirilgan yoki ushbu brauzerda mavjud emas. Asosiy sahifadan boshqa xona tanlang.</p></section> : <>
        <div className="my-7"><p className="text-xs font-semibold uppercase tracking-[.2em] text-champagne">{hotel.name} · Xona haqida</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">{room.type} · {room.number}-xona</h1><p className="mt-3 text-sm text-muted">Qulayliklar, sig‘im va bir tun uchun narx.</p></div>
        <div className="grid items-start gap-7 lg:grid-cols-[1.4fr_1fr]">
          <div><img src={optimizedUnsplashUrl(roomPhotoForType(room.type), 1200, 80)} alt={`${room.type} xona namunasi`} width="1200" height="800" className="aspect-[3/2] w-full rounded-3xl bg-[var(--line)] object-cover" /><p className="mt-2 text-[10px] text-muted">Rasm xona turining namunaviy ko‘rinishi.</p><section className="surface mt-6 rounded-3xl p-6"><h2 className="font-display text-2xl">Xona qulayliklari</h2><ul className="mt-5 grid gap-3 sm:grid-cols-2">{room.amenities.map((item) => <li key={item} className="flex items-center gap-2 text-sm"><Check size={16} className="text-champagne" />{item}</li>)}</ul></section></div>
          <aside className="surface rounded-3xl p-6 lg:sticky lg:top-24"><div className="flex flex-wrap gap-4 border-b border-[var(--line)] pb-5 text-xs text-muted"><span className="flex items-center gap-2"><Users size={16} />{room.capacity} mehmon</span><span className="flex items-center gap-2"><BedDouble size={16} />{room.floor}-qavat</span></div><p className="mt-6 font-display text-3xl">{formatMoney(room.pricePerNight, data.settings.currency)}</p><p className="mt-2 text-xs text-muted">Bir tun uchun · mavjudlik tanlangan sanalarga bog‘liq</p><Link to="/app/rooms" state={{ selectedRoomType: room.type }} className="primary-button mt-6 w-full gap-2">Sanalarni tanlash va bron qilish<ArrowRight size={16} /></Link><a href={hotel.phoneHref} className="secondary-button mt-3 w-full gap-2"><Phone size={16} />Administrator bilan bog‘lanish</a><p className="mt-6 border-t border-[var(--line)] pt-5 text-xs leading-6 text-muted">Kelish: {data.settings.checkInTime} · Ketish: {data.settings.checkOutTime}<br />{hotel.addressLineOne}, {hotel.addressLineTwo}</p></aside>
        </div>
      </>}
    </main><SiteFooter />
  </div>;
}
