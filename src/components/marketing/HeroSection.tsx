import { useHotelContact } from '../../hooks/useHotelContact';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, BedDouble, Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BookingSearch } from './BookingSearch';
import { PHOTOS } from '../../data/marketing';
import { optimizedUnsplashUrl, unsplashSrcSet } from '../../services/imageUtils';
import { useAppData } from '../../context/AppDataContext';

export function HeroSection() {
  const HOTEL = useHotelContact();
  const { t } = useTranslation();
  const { data } = useAppData();
  const reduced = usePrefersReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(useTransform(pointerX, [-.5, .5], [-28, 28]), { stiffness: 70, damping: 22 });
  const y = useSpring(useTransform(pointerY, [-.5, .5], [-18, 18]), { stiffness: 70, damping: 22 });
  const roomCount = data.rooms.length;

  return <section onPointerMove={(event) => { if (reduced || event.pointerType !== 'mouse') return; const rect = event.currentTarget.getBoundingClientRect(); pointerX.set((event.clientX - rect.left) / rect.width - .5); pointerY.set((event.clientY - rect.top) / rect.height - .5); }} onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }} className="relative isolate flex min-h-[660px] items-center overflow-hidden bg-ink text-white lg:min-h-[88vh]">
    <motion.img style={reduced ? undefined : { x, y, scale: 1.08 }}
      src={optimizedUnsplashUrl(PHOTOS.exterior, 1800, 82)}
      srcSet={unsplashSrcSet(PHOTOS.exterior, [720, 1080, 1440, 1800, 2400], 82)}
      sizes="100vw"
      width={2400}
      height={1600}
      alt={t('landing.heroAlt')}
      fetchPriority="high"
      decoding="async"
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/25" />
    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-ink/45" />

    <div aria-hidden="true" className="hero-orbit hero-orbit-one" />
    <div aria-hidden="true" className="hero-orbit hero-orbit-two" />
    <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-12 px-5 py-12 sm:py-16 lg:grid-cols-[1.15fr_.85fr] lg:gap-16 lg:px-10 lg:py-28">
      <motion.div initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }} className="max-w-2xl">
        <p className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[.2em] text-white/85">
          <Award size={13} className="text-champagne" />{t('landing.heroBadge')}
        </p>
        <h1 className="mt-6 font-display text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.2rem]">{t('landing.headline')}</h1>
        <p className="mt-6 max-w-xl text-sm leading-7 text-white/80 sm:text-base">{t('landing.description')}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link to="/app/rooms" className="inline-flex items-center gap-2 rounded-full bg-champagne px-6 py-3.5 text-xs font-bold text-ink transition hover:bg-white">{t('landing.book')}<ArrowRight size={14} /></Link>
          <a href="#rooms" className="inline-flex items-center gap-2 rounded-full border border-white/35 px-6 py-3.5 text-xs font-bold text-white transition hover:border-champagne hover:text-champagne">{t('landing.roomsTitle')}</a>
        </div>
        <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-5 border-t border-white/15 pt-7">
          <div className="flex items-center gap-3"><BedDouble size={18} className="text-champagne" /><div><dt className="text-[10px] uppercase tracking-[.16em] text-white/55">{t('landing.statRooms')}</dt><dd className="text-sm font-semibold">{roomCount}</dd></div></div>
          <div className="flex items-center gap-3"><Award size={18} className="text-champagne" /><div><dt className="text-[10px] uppercase tracking-[.16em] text-white/55">{t('landing.statRating')}</dt><dd className="text-sm font-semibold">{HOTEL.rating} / 5</dd></div></div>
          <div className="flex items-center gap-3"><Headphones size={18} className="text-champagne" /><div><dt className="text-[10px] uppercase tracking-[.16em] text-white/55">{t('landing.statSupport')}</dt><dd className="text-sm font-semibold">{HOTEL.phone}</dd></div></div>
        </dl>
      </motion.div>
      <motion.div initial={reduced ? false : { opacity: 0, y: 45, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .9, delay: .25 }} className="relative lg:justify-self-end w-full">
        <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-white/80"><span className="hotel-live-dot" />Sizning keyingi manzilingiz</div>
        <BookingSearch />
        <p className="mt-4 text-center text-xs text-white/65">01 — Sanani tanlang · 02 — Xonani toping · 03 — Dam oling</p>
      </motion.div>
    </div>
  </section>;
}
