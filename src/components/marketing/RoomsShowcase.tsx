import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../../context/AppDataContext';
import { useBookingAction } from '../../hooks/useBookingAction';
import { formatMoney } from '../../services/hotelUtils';
import { optimizedUnsplashUrl, roomPhotoForType, unsplashSrcSet } from '../../services/imageUtils';
import type { RoomType } from '../../types';

const ROOM_ORDER: RoomType[] = ['Standard', 'Deluxe', 'Suite', 'Family', 'Presidential'];
const ROOM_LABEL_KEY: Record<RoomType, string> = {
  Standard: 'room.standard',
  Deluxe: 'room.deluxe',
  Suite: 'room.suite',
  Family: 'room.family',
  Presidential: 'room.presidential',
};

export function RoomsShowcase() {
  const reduced = usePrefersReducedMotion();
  const { t } = useTranslation();
  const { data } = useAppData();
  const book = useBookingAction();
  const rooms = ROOM_ORDER.map((type) => ({ type, room: data.rooms.find((item) => item.type === type) })).filter((entry) => entry.room);

  return <section id="rooms" className="mx-auto max-w-[1440px] px-5 py-20 lg:px-10 lg:py-24">
    <div className="max-w-2xl">
      <p className="text-[10px] font-bold uppercase tracking-[.24em] text-champagne">{t('landing.roomsTitle')}</p>
      <h2 className="mt-3 font-display text-4xl lg:text-5xl">{t('landing.roomsHeadline')}</h2>
      <p className="mt-4 text-sm leading-7 text-muted">{t('landing.roomsSubtitle')}</p>
    </div>

    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map(({ type, room }, index) => <motion.article initial={reduced ? false : { opacity: 0, y: 55 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .65, delay: index % 3 * .12 }} key={type} className="surface room-showcase-card group flex flex-col overflow-hidden rounded-3xl transition duration-300 hover:-translate-y-1 hover:shadow-lift">
        <div className="relative aspect-[16/11] overflow-hidden">
          <img
            src={optimizedUnsplashUrl(roomPhotoForType(type), 720, 74)}
            srcSet={unsplashSrcSet(roomPhotoForType(type), [420, 600, 720, 960], 74)}
            sizes="(min-width: 1024px) 32vw, (min-width: 640px) 46vw, 100vw"
            width={960}
            height={640}
            alt={t(`${ROOM_LABEL_KEY[type]}`)}
            loading="lazy"
            decoding="async"
            className="h-full w-full bg-[var(--line)] object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-ink">{t(ROOM_LABEL_KEY[type])}</span>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap gap-4 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1.5"><Users size={14} className="text-champagne" />{t('landing.roomCapacity', { count: room?.capacity ?? 2 })}</span>
          </div>
          <p className="mt-4 text-xs leading-6 text-muted">{room?.amenities.slice(0, 3).join(' · ')}</p>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-[var(--line)] pt-5">
            <p><span className="font-display text-2xl">{room ? formatMoney(room.pricePerNight, data.settings.currency) : ''}</span><span className="ml-1 text-[10px] text-muted">{t('landing.perNight')}</span></p>
            <Link to={`/rooms/${room!.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-4 py-2.5 text-[11px] font-semibold transition hover:border-champagne hover:bg-champagne/10 hover:text-champagne">{t('landing.reserve')}<ArrowRight size={13} /></Link>
          </div>
        </div>
      </motion.article>)}

      <article className="flex flex-col justify-between rounded-3xl border border-champagne/40 bg-champagne/10 p-6">
        <div>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-champagne/30 text-champagne"><BedDouble size={22} /></span>
          <h3 className="mt-5 font-display text-2xl">{t('landing.allRoomsTitle')}</h3>
          <p className="mt-3 text-xs leading-6 text-muted">{t('landing.allRoomsText')}</p>
        </div>
        <button type="button" onClick={() => book()} className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-xs font-semibold text-white transition hover:bg-ink-soft">{t('landing.allRoomsAction')}<ArrowRight size={14} /></button>
      </article>
    </div>
  </section>;
}
