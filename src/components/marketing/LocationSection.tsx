import { useHotelContact } from '../../hooks/useHotelContact';
import { useContactDialog } from '../../context/ContactDialogContext';
import { Camera, Clock, ExternalLink, Headphones, Mail, MapPin, Phone, Send, Share2 } from 'lucide-react';
import { useSiteTranslation } from '../../hooks/useSiteContent';

export function LocationSection() {
  const HOTEL = useHotelContact();
  const { openContact } = useContactDialog();
  const { t } = useSiteTranslation();
  const socialLinks = [
    { label: 'Telegram', href: HOTEL.telegram, handle: HOTEL.telegramHandle, icon: Send },
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
          <a href={HOTEL.mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-5 py-3.5 text-xs font-semibold transition hover:border-champagne hover:text-champagne">{t('landing.openMap')}<ExternalLink size={14} /></a>
        </div>
        <div className="contact-mobile-socials mt-5 flex flex-wrap gap-2">
          {socialLinks.map(({ label, href, handle, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-4 py-2.5 text-[11px] font-semibold transition hover:text-champagne"><Icon size={14} className="shrink-0 text-champagne" /><span>{label}</span><span className="contact-social-handle text-muted" title={handle}>{handle}</span></a>)}
        </div>
      </div>

      <MapSketch caption={t('landing.mapCaption')} />
    </div>
  </section>;
}

/** Lightweight inline map sketch — no third-party frame, so the panel never
 *  shows an empty iframe or blocks on network. */
function MapSketch({ caption }: { caption: string }) {
  const HOTEL = useHotelContact();
  return <figure className="surface overflow-hidden rounded-3xl p-4 sm:p-6">
    <svg viewBox="0 0 520 360" role="img" aria-label={caption} className="h-auto w-full rounded-2xl bg-[var(--page)]">
      <g stroke="var(--line)" strokeWidth="14" strokeLinecap="round">
        <path d="M-20 96h560" /><path d="M-20 232h560" />
        <path d="M132 -20v400" /><path d="M356 -20v400" />
      </g>
      <g stroke="var(--line)" strokeWidth="6" strokeLinecap="round" opacity=".75">
        <path d="M-20 160h300" /><path d="M430 232v148" /><path d="M132 300h424" />
      </g>
      <g fill="color-mix(in oklab, var(--muted) 22%, transparent)">
        <rect x="166" y="126" width="70" height="52" rx="8" /><rect x="252" y="126" width="52" height="52" rx="8" />
        <rect x="166" y="196" width="52" height="60" rx="8" /><rect x="252" y="196" width="70" height="60" rx="8" />
        <rect x="392" y="60" width="86" height="60" rx="8" /><rect x="60" y="252" width="52" height="60" rx="8" />
      </g>
      <path d="M392 126c0 0-3 8-3 12a9 9 0 0 0 18 0c0-4-3-12-3-12h-12Z" fill="color-mix(in oklab, var(--champagne) 30%, transparent)" />
      <g>
        <circle cx="222" cy="176" r="34" fill="color-mix(in oklab, var(--champagne) 18%, transparent)" />
        <circle cx="222" cy="176" r="19" fill="var(--champagne)" />
        <circle cx="222" cy="176" r="7" fill="#fff" />
      </g>
      <text x="222" y="238" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)">Origin Hotel</text>
    </svg>
    <figcaption className="mt-4 flex items-center justify-between gap-4 text-[10px] uppercase tracking-[.14em] text-muted">
      <span>{caption}</span><span>{HOTEL.addressLineTwo}</span>
    </figcaption>
  </figure>;
}
