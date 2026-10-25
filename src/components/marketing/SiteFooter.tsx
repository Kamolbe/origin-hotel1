import { useHotelContact } from '../../hooks/useHotelContact';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from '../Logo';
import { LanguageSwitcher } from '../LanguageSwitcher';

export function SiteFooter() {
  const HOTEL = useHotelContact();
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const explore = [
    { href: '#rooms', label: t('nav.rooms') },
    { href: '#about', label: t('nav.about') },
    { href: '#gallery', label: t('landing.galleryTitle') },
    { href: '#reviews', label: t('landing.reviewsTitle') },
    { href: '#contact', label: t('nav.contact') },
  ];
  const services = [
    { to: '/app/rooms', label: t('landing.book') },
    { to: '/app/rooms', label: t('nav.rooms') },
    { to: '/app/bookings', label: t('nav.bookings') },
    { to: '/app/profile', label: t('nav.profile') },
  ];

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
        <ul className="mt-4 space-y-2.5">{services.map((item) => <li key={item.to}><Link to={item.to} className="text-xs text-muted transition hover:text-champagne">{item.label}</Link></li>)}</ul>
      </nav>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-champagne">{t('footer.contact')}</p>
        <ul className="mt-4 space-y-3 text-xs text-muted">
          <li className="flex gap-3"><MapPin size={15} className="mt-0.5 shrink-0 text-champagne" /><span>{HOTEL.addressLineOne}, {HOTEL.addressLineTwo}</span></li>
          <li className="flex gap-3"><Phone size={15} className="mt-0.5 shrink-0 text-champagne" /><a href={HOTEL.phoneHref} className="transition hover:text-champagne">{HOTEL.phone}</a></li>
          <li className="flex gap-3"><Mail size={15} className="mt-0.5 shrink-0 text-champagne" /><a href={`mailto:${HOTEL.email}`} className="transition hover:text-champagne">{HOTEL.email}</a></li>
        </ul>
        <div className="mt-5"><LanguageSwitcher /></div>
      </div>
    </div>

    <div className="border-t border-[var(--line)]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-6 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <p>© {year} Origin Hotel · {t('footer.rights')}</p>
        <p className="text-balance">{t('footer.credits')}</p>
      </div>
    </div>
  </footer>;
}
