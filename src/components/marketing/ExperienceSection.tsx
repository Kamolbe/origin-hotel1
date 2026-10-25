import { useHotelContact } from '../../hooks/useHotelContact';
import { CarFront, ConciergeBell, Dumbbell, Flower2, PlaneTakeoff, UtensilsCrossed, Waves, Wifi, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PHOTOS } from '../../data/marketing';
import { optimizedUnsplashUrl, unsplashSrcSet } from '../../services/imageUtils';

const AMENITIES: Array<{ icon: LucideIcon; key: string }> = [
  { icon: Wifi, key: 'amenity.wifi' },
  { icon: Waves, key: 'amenity.pool' },
  { icon: Flower2, key: 'amenity.spa' },
  { icon: UtensilsCrossed, key: 'amenity.restaurant' },
  { icon: CarFront, key: 'amenity.parking' },
  { icon: Dumbbell, key: 'amenity.fitness' },
  { icon: PlaneTakeoff, key: 'amenity.transfer' },
  { icon: ConciergeBell, key: 'amenity.frontdesk' },
];

export function ExperienceSection() {
  const HOTEL = useHotelContact();
  const { t } = useTranslation();

  return <section id="about" className="border-y border-[var(--line)] bg-[var(--surface)]">
    <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-24">
      <div className="relative">
        <img
          src={optimizedUnsplashUrl(PHOTOS.lobby, 900, 76)}
          srcSet={unsplashSrcSet(PHOTOS.lobby, [480, 720, 900, 1200], 76)}
          sizes="(min-width: 1024px) 44vw, 100vw"
          width={1200}
          height={800}
          alt={t('landing.aboutPhotoAlt')}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lift"
        />
        <img
          src={optimizedUnsplashUrl(PHOTOS.standard, 480, 76)}
          srcSet={unsplashSrcSet(PHOTOS.standard, [320, 480, 640], 76)}
          sizes="180px"
          width={480}
          height={480}
          alt={t('landing.aboutPhotoAltTwo')}
          loading="lazy"
          decoding="async"
          className="absolute -bottom-8 right-4 hidden h-40 w-40 rounded-3xl border-4 border-[var(--surface)] object-cover sm:block lg:h-48 lg:w-48"
        />
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.24em] text-champagne">{t('nav.about')}</p>
        <h2 className="mt-3 font-display text-4xl lg:text-5xl">{t('landing.aboutHeadline')}</h2>
        <p className="mt-5 text-sm leading-7 text-muted">{t('landing.aboutText')}</p>
        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {AMENITIES.map(({ icon: Icon, key }) => <div key={key} className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--page)] px-4 py-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-champagne/15 text-champagne"><Icon size={18} /></span>
            <span className="text-xs font-semibold">{t(key)}</span>
          </div>)}
        </div>
        <p className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--line)] pt-6 text-[11px] text-muted">
          <span>{HOTEL.addressLineOne}</span>
          <span className="text-champagne">{t('landing.receptionHours')}</span>
        </p>
      </div>
    </div>
  </section>;
}
