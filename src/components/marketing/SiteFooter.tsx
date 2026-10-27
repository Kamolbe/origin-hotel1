import { useHotelContact } from '../../hooks/useHotelContact';
import { Link } from 'react-router-dom';
import { Camera, Mail, MapPin, Phone, Send, Share2 } from 'lucide-react';
import { useSiteTranslation } from '../../hooks/useSiteContent';
import { Logo } from '../Logo';
import { useBookingAction } from '../../hooks/useBookingAction';
import { useContactDialog } from '../../context/ContactDialogContext';
import { useAuth } from '../../context/AuthContext';

export function SiteFooter() {
  const HOTEL = useHotelContact();
  const { t } = useSiteTranslation();
  const { user } = useAuth();
  const book = useBookingAction();
  const { openContact } = useContactDialog();
  const year = new Date().getFullYear();

  const explore = [
    { href: '/#rooms', label: t('nav.rooms') },
    { href: '/#about', label: t('nav.about') },
    { href: '/#gallery', label: t('landing.galleryTitle') },
    { href: '/#reviews', label: t('landing.reviewsTitle') },
    { href: '/#contact', label: t('nav.contact') },
  ];
  const socials = [
    { label: 'Telegram', href: HOTEL.telegram, handle: HOTEL.telegramHandle, icon: Send },
    { label: 'Instagram', href: HOTEL.instagram, handle: HOTEL.instagramHandle, icon: Camera },
    { label: 'Facebook', href: HOTEL.facebook, handle: HOTEL.facebookHandle, icon: Share2 },
  ].filter((item) => item.href);

  return <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
    <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:px-10">
      <div>
        <Logo />
        <p className="mt-5 max-w-sm text-xs leading-6 text-muted">{t('landing.description')}</p>
        <p className="mt-5 font-display text-3xl">{HOTEL.rating}<span className="ml-2 text-xs font-normal text-muted">{t('landing.statRating')}</span></p>
      </div>

      <nav aria-label={t('footer.explore')}>
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-champagne">{t('footer.explore')}</p>
        <ul className="mt-4 space-y-2.5">{explore.map((item) => <li key={item.href}><a href={item.href} className="text-xs text-muted transition hover:text-champagne">{item.label}</a></li>)}</ul>
      </nav>

      <nav aria-label={t('footer.services')}>
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-champagne">{t('footer.services')}</p>
        <ul className="mt-4 space-y-2.5">
          <li><button type="button" onClick={() => book()} className="text-xs text-muted transition hover:text-champagne">{t('landing.book')}</button></li>
          <li><a href="/#rooms" className="text-xs text-muted transition hover:text-champagne">{t('nav.rooms')}</a></li>
          <li><a href="/#stay-planner" className="text-xs text-muted transition hover:text-champagne">Safarni rejalashtirish</a></li>
          <li><button type="button" onClick={openContact} className="text-xs text-muted transition hover:text-champagne">Administrator bilan bog‘lanish</button></li>
          <li>{user
            ? <Link to="/app" className="text-xs font-semibold text-champagne">{t('nav.dashboard')} ↗</Link>
            : <Link to="/login" state={{ from: '/app', reason: 'account' }} className="text-xs font-semibold text-champagne">{t('nav.login')}</Link>}</li>
        </ul>
      </nav>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-champagne">{t('footer.contact')}</p>
        <ul className="mt-4 space-y-3 text-xs text-muted">
          <li className="flex gap-3"><MapPin size={15} className="mt-0.5 shrink-0 text-champagne" /><span>{HOTEL.addressLineOne}, {HOTEL.addressLineTwo}</span></li>
          <li className="flex gap-3"><Phone size={15} className="mt-0.5 shrink-0 text-champagne" /><a href={HOTEL.phoneHref} className="transition hover:text-champagne">{HOTEL.phone}</a></li>
          <li className="flex gap-3"><Mail size={15} className="mt-0.5 shrink-0 text-champagne" /><a href={`mailto:${HOTEL.email}`} className="transition hover:text-champagne">{HOTEL.email}</a></li>
        </ul>
        {socials.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{socials.map(({ label, href, handle, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`${label} ${handle}`} className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3.5 py-2 text-[11px] font-semibold text-muted transition hover:border-champagne hover:text-champagne"><Icon size={14} />{handle}</a>)}</div>}
      </div>
    </div>

    <div className="border-t border-[var(--line)]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-6 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <p>© {year} {HOTEL.name} · {t('footer.rights')}</p>
        <div className="space-y-1 sm:text-right"><p className="text-balance">{t('footer.credits')}</p><p data-site-version className="font-mono">Sayt versiyasi: {import.meta.env.VITE_APP_REVISION}</p></div>
      </div>
    </div>
  </footer>;
}
