import { useHotelContact } from '../../hooks/useHotelContact';
import { Quote, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { REVIEWS } from '../../data/marketing';

export function ReviewsSection() {
  const HOTEL = useHotelContact();
  const { t } = useTranslation();

  return <section id="reviews" className="border-y border-[var(--line)] bg-[var(--surface)]">
    <div className="mx-auto max-w-[1440px] px-5 py-20 lg:px-10 lg:py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-champagne">{t('landing.reviewsTitle')}</p>
          <h2 className="mt-3 font-display text-4xl lg:text-5xl">{t('landing.reviewsHeadline')}</h2>
          <p className="mt-4 text-sm leading-7 text-muted">{t('landing.reviewsSubtitle')}</p>
        </div>
        <div className="rounded-2xl border border-champagne/40 bg-champagne/10 px-5 py-4 text-center">
          <p className="font-display text-4xl">{HOTEL.rating}</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-champagne" aria-hidden="true">{[0, 1, 2, 3, 4].map((star) => <Star key={star} size={12} fill="currentColor" />)}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[.14em] text-muted">{t('landing.statRating')}</p>
        </div>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {REVIEWS.map((review) => <figure key={review.name} className="surface flex h-full flex-col rounded-3xl p-6">
          <Quote size={22} className="text-champagne" aria-hidden="true" />
          <blockquote className="mt-4 flex-1 text-sm leading-7">{t(review.quoteKey)}</blockquote>
          <figcaption className="mt-6 flex items-center gap-3 border-t border-[var(--line)] pt-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-champagne">{review.name.slice(0, 1)}{review.name.split(' ')[1]?.slice(0, 1)}</span>
            <span><span className="block text-xs font-semibold">{review.name}</span><span className="block text-[10px] text-muted">{review.origin}</span></span>
            <span className="ml-auto flex gap-0.5 text-champagne" aria-label={`${review.rating}/5`}>{Array.from({ length: review.rating }, (_, star) => <Star key={star} size={12} fill="currentColor" />)}</span>
          </figcaption>
        </figure>)}
      </div>
    </div>
  </section>;
}
