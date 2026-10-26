import { ArrowRight, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBookingAction } from '../../hooks/useBookingAction';
import { useContactDialog } from '../../context/ContactDialogContext';
import { PHOTOS } from '../../data/marketing';
import { optimizedUnsplashUrl, unsplashSrcSet } from '../../services/imageUtils';

export function CtaBand() {
  const { t } = useTranslation();
  const book = useBookingAction();
  const { openContact } = useContactDialog();

  return <section className="relative isolate overflow-hidden bg-ink text-white">
    <img
      src={optimizedUnsplashUrl(PHOTOS.presidential, 1800, 74)}
      srcSet={unsplashSrcSet(PHOTOS.presidential, [720, 1080, 1440, 1800], 74)}
      sizes="100vw"
      width={1800}
      height={1200}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className="absolute inset-0 h-full w-full object-cover opacity-40"
    />
    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/55" />
    <div className="relative mx-auto flex max-w-[1440px] flex-col items-start gap-8 px-5 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-20">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl leading-tight lg:text-4xl">{t('landing.ctaTitle')}</h2>
        <p className="mt-3 text-sm leading-7 text-white/80">{t('landing.ctaText')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => book()} className="inline-flex items-center gap-2 rounded-full bg-champagne px-6 py-3.5 text-xs font-bold text-ink transition hover:bg-white">{t('landing.book')}<ArrowRight size={14} /></button>
        <button type="button" onClick={openContact} className="inline-flex items-center gap-2 rounded-full border border-white/35 px-6 py-3.5 text-xs font-bold text-white transition hover:border-champagne hover:text-champagne"><Phone size={14} />Administrator bilan bog‘lanish</button>
      </div>
    </div>
  </section>;
}
