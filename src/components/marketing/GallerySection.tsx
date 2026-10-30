import { useAppData } from '../../context/AppDataContext';
import { useState } from 'react';
import { useSiteTranslation } from '../../hooks/useSiteContent';
import { Expand } from 'lucide-react';
import { Modal } from '../Modal';
import { GALLERY as DEFAULT_GALLERY } from '../../data/marketing';
import { optimizedUnsplashUrl, unsplashSrcSet } from '../../services/imageUtils';

export function GallerySection({ compactGuest = false }: { compactGuest?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { data } = useAppData();
  const GALLERY: Array<{ photo: string; wide: boolean }> = data.settings.website.gallery.length ? data.settings.website.gallery.map((photo, index) => ({ photo, wide: index % 3 === 0 })) : [...DEFAULT_GALLERY];
  const { t } = useSiteTranslation();
  const [active, setActive] = useState<{ photo: string; wide: boolean } | null>(null);

  return <section id="gallery" className="mx-auto max-w-[1440px] px-5 py-20 lg:px-10 lg:py-24">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[.24em] text-champagne">{t('landing.galleryTitle')}</p>
        <h2 className="mt-3 font-display text-4xl lg:text-5xl">{t('landing.galleryHeadline')}</h2>
      </div>
      <p className="text-[11px] uppercase tracking-[.14em] text-muted">{t('landing.galleryHint')}</p>
    </div>

    <div id="home-gallery-list" className={`guest-gallery-list mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${expanded ? 'mobile-list-expanded' : ''}`}>
      {GALLERY.map((item, index) => <button
        key={item.photo}
        type="button"
        onClick={() => setActive(item)}
        className={`group relative h-44 overflow-hidden rounded-2xl border border-[var(--line)] sm:h-52 ${item.wide ? 'col-span-2' : ''}`}
      >
        <img
          src={optimizedUnsplashUrl(item.photo, 720, 74)}
          srcSet={unsplashSrcSet(item.photo, [420, 720, 1080], 74)}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 45vw, 50vw"
          width={1080}
          height={720}
          alt={t('landing.galleryPhotoAlt', { index: index + 1 })}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
        />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        <span aria-hidden="true" className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/92 text-ink opacity-0 transition group-hover:opacity-100"><Expand size={15} /></span>
      </button>)}
    </div>

    {compactGuest && GALLERY.length > 3 && <button type="button" aria-expanded={expanded} aria-controls="home-gallery-list" className="guest-mobile-toggle secondary-button mt-4 w-full" onClick={() => setExpanded(!expanded)}>{expanded ? 'Kamroq rasmlar' : `Barcha rasmlar (${GALLERY.length})`}</button>}
    <Modal open={active !== null} onClose={() => setActive(null)} title={t('landing.galleryTitle')} description={t('landing.galleryHint')} size="lg">
      {active && <div className="aspect-[3/2] w-full overflow-hidden rounded-2xl bg-[var(--line)]">
        <img
          src={optimizedUnsplashUrl(active.photo, 1400, 82)}
          srcSet={unsplashSrcSet(active.photo, [720, 1080, 1400], 82)}
          sizes="(min-width: 1024px) 768px, 100vw"
          width={1400}
          height={933}
          alt={t('landing.galleryPhotoAlt', { index: GALLERY.findIndex((item) => item.photo === active.photo) + 1 })}
          className="h-full w-full object-cover"
        />
      </div>}
    </Modal>
  </section>;
}
