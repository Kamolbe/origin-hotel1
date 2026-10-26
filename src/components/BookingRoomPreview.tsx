import { useRoomPhotos } from '../hooks/useSiteContent';
import { useState } from 'react';
import { BedDouble, Users } from 'lucide-react';
import { formatMoney } from '../services/hotelUtils';
import { optimizedUnsplashUrl, unsplashSrcSet } from '../services/imageUtils';
import type { AppSettings, Room } from '../types';

export function BookingRoomPreview({ room, selected, currency }: { room?: Room; selected: boolean; currency: AppSettings['currency'] }) {
  const getRoomPhoto = useRoomPhotos();
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const roomType = room?.type ?? 'Standard';
  const roomTitle = roomType === 'Family' ? 'Oilaviy xona' : roomType === 'Presidential' ? 'Prezident xonasi' : `${roomType} xona`;
  const photo = getRoomPhoto(room ?? { type: roomType });
  const photoFailed = failedPhoto === photo;

  return <section className="min-w-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--page)] lg:self-start">
    <div className="relative h-40 overflow-hidden bg-ink sm:h-48 lg:h-[300px]">
      {!photoFailed ? <img
        src={optimizedUnsplashUrl(photo, 900, 76)}
        srcSet={unsplashSrcSet(photo, [360, 640, 900, 1200], 76)}
        sizes="(min-width: 1024px) 30vw, 100vw"
        width={1200}
        height={800}
        alt={`${roomTitle} fotosurati`}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        onError={() => setFailedPhoto(photo)}
        className="absolute inset-0 h-full w-full object-cover"
      /> : <div role="img" aria-label="Xona rasmi yuklanmadi" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-ink via-ink-soft to-[#725b39] text-white">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-champagne/40 bg-white/5 text-champagne"><BedDouble size={26} /></span>
        <span className="text-[9px] font-bold uppercase tracking-[.24em] text-white/80">Origin Hotel · Xonalar</span>
      </div>}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-ink/5" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
        <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#e0c997]">{selected && room ? `Tanlangan xona · ${room.number}` : room ? 'Bo‘sh xonadan namuna' : 'Xona mavjud emas'}</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h3 className="font-display text-xl leading-tight sm:text-2xl">{room ? roomTitle : 'Xonani tanlang'}</h3>
          {room && <span className="shrink-0 text-right text-xs font-semibold">{formatMoney(room.pricePerNight, currency)}<small className="ml-1 text-[9px] font-normal text-white/70">/ tun</small></span>}
        </div>
        {room ? <p className="mt-2 flex items-center gap-1.5 text-[10px] text-white/80"><Users size={12} /> {room.capacity} kishigacha <span className="text-white/40">·</span> {room.floor}-qavat</p> : <p className="mt-2 text-[10px] text-white/75">Sanalarni o‘zgartirib, qayta qidiring.</p>}
      </div>
    </div>
    <div className="p-4 sm:p-5">
      <p className="text-[9px] font-bold uppercase tracking-[.16em] text-muted">Xona qulayliklari</p>
      {room?.amenities.length ? <div className="mt-2 flex flex-wrap gap-1.5">{room.amenities.slice(0, 4).map((amenity) => <span key={amenity} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-[9px] font-medium text-muted">{amenity}</span>)}</div> : <p className="mt-2 text-xs text-muted">Hozircha ko‘rsatish uchun xona ma’lumoti yo‘q.</p>}
      <p className="mt-3 border-t border-[var(--line)] pt-3 text-[10px] leading-5 text-muted">{selected ? 'Tanlangan xona va narx bron so‘rovingizga qo‘shiladi.' : 'Xonani tanlaganingizda narx va xona tafsilotlari shu yerda yangilanadi.'}</p>
    </div>
  </section>;
}
