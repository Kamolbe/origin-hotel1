import { mapPreviewUrl } from '../../services/mapPreview';
import { useHotelContact } from '../../hooks/useHotelContact';
import { useContactDialog } from '../../context/ContactDialogContext';
import { Camera, Clock, ExternalLink, Headphones, Mail, MapPin, Phone, Send, Share2 } from 'lucide-react';
import { useSiteTranslation } from '../../hooks/useSiteContent';

export function LocationSection() {
  const HOTEL = useHotelContact();
  const { openContact } = useContactDialog();
  const { t } = useSiteTranslation();
  const socialLinks = [
    { label: 'Instagram', href: HOTEL.instagram, handle: HOTEL.instagramHandle, icon: Camera },
    { label: 'Facebook', href: HOTEL.facebook, handle: HOTEL.facebookHandle, icon: Share2 },
  ].filter((item) => item.href);

  return <section id="contact" className="mx-auto max-w-[1440px] px-5 py-20 lg:px-10 lg:py-24">
    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.24em] text-champagne">{t('nav.contact')}</p>
        <h2 className="mt-3 font-display text-4xl lg:text-5xl">{t('landing.locationHeadline')}</h2>
        <p className="mt-4 text-sm leading-7 text-muted">{t('landing.locationSubtitle')}</p>

        <ul className="mt-9 space-y-4 text-sm">
          <li className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-champagne/15 text-champagne"><MapPin size={18} /></span>
            <span><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-muted">{t('landing.addressLabel')}</span><span className="mt-1 block">{HOTEL.addressLineOne}<br />{HOTEL.addressLineTwo}</span></span>
          </li>
          <li className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-champagne/15 text-champagne"><Phone size={18} /></span>
            <span><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-muted">{t('landing.phoneLabel')}</span><a href={HOTEL.phoneHref} className="mt-1 block font-semibold transition hover:text-champagne">{HOTEL.phone}</a></span>
          </li>
          <li className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-champagne/15 text-champagne"><Mail size={18} /></span>
            <span><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-muted">{t('landing.emailLabel')}</span><a href={`mailto:${HOTEL.email}`} className="mt-1 block font-semibold transition hover:text-champagne">{HOTEL.email}</a></span>
          </li>
          <li className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-champagne/15 text-champagne"><Clock size={18} /></span>
            <span><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-muted">{t('landing.receptionHours')}</span><span className="mt-1 block">{t('landing.receptionValue')}</span></span>
          </li>
        </ul>

        <div className="contact-mobile-actions mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={openContact} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3.5 text-xs font-semibold text-white transition hover:bg-ink-soft"><Headphones size={15} className="shrink-0" /><span>Administrator bilan bog‘lanish</span></button>
          {HOTEL.telegram && <a href={HOTEL.telegram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-5 py-3.5 text-xs font-semibold transition hover:border-champagne hover:text-champagne"><Send size={15} className="shrink-0" /><span>Telegram bot</span> <span className="text-muted">{HOTEL.telegramHandle}</span></a>}
        </div>
        <div className="contact-mobile-socials mt-5 flex flex-wrap gap-2">
          {socialLinks.map(({ label, href, handle, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-4 py-2.5 text-[11px] font-semibold transition hover:text-champagne"><Icon size={14} className="shrink-0 text-champagne" /><span>{label}</span><span className="contact-social-handle text-muted" title={handle}>{handle}</span></a>)}
        </div>
      </div>

      <MapSketch caption={t('landing.mapCaption')} />
    </div>
  </section>;
}

function MapSketch({ caption }: { caption: string }) {
  const HOTEL = useHotelContact();
  const preview = mapPreviewUrl(HOTEL.mapUrl, `${HOTEL.name} ${HOTEL.addressLineOne} ${HOTEL.addressLineTwo}`, HOTEL.mapEmbedUrl);
  return <figure className="surface overflow-hidden rounded-3xl p-3 sm:p-4">
    <iframe key={preview} title="Mehmonxona joylashuvi — Google Maps" src={preview} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="h-[280px] w-full rounded-2xl border-0 bg-[var(--page)] sm:h-[360px]" />
    <figcaption className="mt-3"><a href={HOTEL.mapUrl} target="_blank" rel="noopener noreferrer" aria-label="Mehmonxona joylashuvini xaritada ochish" className="flex items-center justify-between gap-3 rounded-xl p-2 text-xs transition hover:bg-[var(--page)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-champagne"><span className="min-w-0"><span className="block font-semibold">{caption}</span><span className="mt-1 block break-words text-[11px] text-muted">{HOTEL.addressLineOne}, {HOTEL.addressLineTwo}</span></span><ExternalLink size={17} className="shrink-0 text-champagne" /></a><p className="px-2 pb-1 text-[10px] leading-5 text-muted">Xarita yuklanmasa, yuqoridagi manzilni bosib Google Maps’da oching.</p></figcaption>
  </figure>;
}
