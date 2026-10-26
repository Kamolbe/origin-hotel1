import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, Building2, Phone, Users } from 'lucide-react';
import { Modal } from './Modal';
import { RoomDetailsInfo } from './RoomDetailsInfo';
import { useAppData } from '../context/AppDataContext';
import { useContactDialog } from '../context/ContactDialogContext';
import { useHotelContact } from '../hooks/useHotelContact';
import { formatMoney } from '../services/hotelUtils';
import { optimizedUnsplashUrl, roomPhotoForType, unsplashSrcSet } from '../services/imageUtils';
import type { Room } from '../types';

/**
 * The "Batafsil" control on a room card opens this dialog instead of navigating
 * away: the whole room — photo, capacity, price, amenities, services and stay
 * times — is readable in place, with the host page deciding what "book" does.
 */
export function RoomDetailsDialog({ room, onClose, onBook }: {
  room: Room | null;
  onClose: () => void;
  onBook: (room: Room) => void;
}) {
  const { data } = useAppData();
  const hotel = useHotelContact();
  const { openContact } = useContactDialog();
  if (!room) return null;

  const photo = roomPhotoForType(room.type);
  const facts = [
    { icon: Users, label: 'Sig‘im', value: `${room.capacity} mehmon` },
    { icon: Building2, label: 'Qavat', value: `${room.floor}-qavat` },
    { icon: BedDouble, label: 'Xona raqami', value: `${room.number}-xona` },
  ];

  return <Modal open onClose={onClose} size="lg" title={`${room.type} xona · ${room.number}`} description="Qulayliklar, sig‘im va bir tun uchun narx — bron qilishdan oldin hammasi bir joyda.">
    <div className="relative overflow-hidden rounded-2xl">
      <img
        src={optimizedUnsplashUrl(photo, 960, 76)}
        srcSet={unsplashSrcSet(photo, [640, 960, 1280], 76)}
        sizes="(min-width: 640px) 640px, 100vw"
        width={1280}
        height={854}
        alt={`${room.type} xona namunasi`}
        className="aspect-[16/10] w-full bg-[var(--line)] object-cover"
      />
      <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-ink">{room.type}</span>
    </div>
    <p className="mt-2 text-[10px] text-muted">Rasm xona turining namunaviy ko‘rinishi.</p>

    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      {facts.map(({ icon: Icon, label, value }) => <div key={label} className="rounded-2xl border border-[var(--line)] p-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-champagne/15 text-champagne"><Icon size={16} /></span>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted">{label}</p>
        <p className="mt-1 text-sm font-semibold">{value}</p>
      </div>)}
    </div>

    <div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-champagne/40 bg-champagne/10 p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted">Bir tun uchun</p>
        <p className="mt-1 font-display text-3xl">{formatMoney(room.pricePerNight, data.settings.currency)}</p>
      </div>
      <p className="text-[11px] leading-5 text-muted">Kelish {hotel.checkInTime} · Ketish {hotel.checkOutTime}<br />{hotel.addressLineOne}, {hotel.addressLineTwo}</p>
    </div>

    <div className="mt-5"><RoomDetailsInfo room={room} variant="plain" /></div>

    <div className="mt-6 flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => onBook(room)} className="primary-button gap-2">Sanalarni tanlash va bron qilish<ArrowRight size={16} /></button>
      <button type="button" onClick={() => { onClose(); openContact(); }} className="secondary-button gap-2"><Phone size={16} />Administrator bilan bog‘lanish</button>
      <Link to={`/rooms/${room.id}`} onClick={onClose} className="text-xs font-semibold text-champagne">To‘liq sahifani ochish →</Link>
    </div>
  </Modal>;
}
