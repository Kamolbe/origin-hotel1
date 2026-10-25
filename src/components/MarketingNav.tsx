import { useHotelContact } from '../hooks/useHotelContact';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, LogOut, Menu, Moon, Phone, Sun, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

/**
 * Public header. With `overlay` it starts transparent on top of the hero photo
 * and becomes a solid, blurred bar once the visitor scrolls.
 */
export function MarketingNav({ overlay = false }: { overlay?: boolean }) {
  const HOTEL = useHotelContact();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [overlay]);

  const transparent = overlay && !scrolled && !menuOpen;
  const links = [
    { href: '/#rooms', label: t('nav.rooms') },
    { href: '/#about', label: t('nav.about') },
    { href: '/#reviews', label: t('landing.reviewsTitle') },
    { href: '/#contact', label: t('nav.contact') },
  ];
  const accountPath = '/app';
  const iconButton = `rounded-full border p-2.5 transition ${transparent ? 'border-white/30 text-white hover:border-champagne hover:text-champagne' : 'border-[var(--line)] text-[var(--text)] hover:border-champagne hover:text-champagne'}`;
  const themeButton = <button type="button" onClick={toggleTheme} className={iconButton} aria-label={theme === 'light' ? t('nav.switchToDark') : t('nav.switchToLight')}>{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}</button>;

  return <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${transparent ? 'border-transparent bg-transparent' : 'border-[var(--line)] bg-[var(--page)]/90 backdrop-blur-xl'}`}>
    <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between gap-4 px-5 lg:px-10">
      <Logo light={transparent} />
      <nav className="hidden items-center gap-7 lg:flex" aria-label={t('nav.mainNavigation')}>{links.map((link) => <a key={link.href} href={link.href} className={`text-xs font-semibold transition ${transparent ? 'text-white/85 hover:text-champagne' : 'text-muted hover:text-champagne'}`}>{link.label}</a>)}</nav>
      <div className="hidden items-center gap-2.5 md:flex">
        <a href={HOTEL.phoneHref} className={`hidden items-center gap-2 text-xs font-semibold transition xl:flex ${transparent ? 'text-white/85 hover:text-champagne' : 'text-muted hover:text-champagne'}`}><Phone size={14} />{HOTEL.phone}</a>
        {themeButton}
        <LanguageSwitcher light={transparent} />
        {user ? <div className="flex items-center gap-2 pl-2">
          <Link to={accountPath} className={`flex items-center gap-2 rounded-full border px-2 py-1.5 transition hover:border-champagne ${transparent ? 'border-white/30' : 'border-[var(--line)]'}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-champagne">{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
            <span className="max-w-[100px] text-left"><span className={`block truncate text-xs font-semibold ${transparent ? 'text-white' : 'text-[var(--text)]'}`}>{user.name}</span><span className="block text-[10px] text-champagne">Kabinetga qaytish ↗</span></span>
          </Link>
          <button onClick={() => { logout(); navigate('/'); }} aria-label={t('nav.logout', { defaultValue: 'Chiqish' })} className={iconButton}><LogOut size={16} /></button>
        </div> : <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white shadow-soft transition hover:bg-ink-soft">{t('nav.login')}<ArrowUpRight size={14} /></Link>}
      </div>
      <div className="flex items-center gap-2 md:hidden">
        {themeButton}
        <button type="button" aria-label={menuOpen ? 'Menyuni yopish' : 'Menyuni ochish'} onClick={() => setMenuOpen((open) => !open)} className={iconButton}>{menuOpen ? <X size={17} /> : <Menu size={17} />}</button>
      </div>
    </div>
    {menuOpen && <div className="border-t border-[var(--line)] bg-[var(--page)] px-5 py-4 md:hidden">
      <div className="flex flex-col gap-1">{links.map((link) => <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-[var(--surface)]">{link.label}</a>)}</div>
      <div className="mt-3 flex items-center justify-between gap-3"><LanguageSwitcher />{user ? <Link onClick={() => setMenuOpen(false)} to={accountPath} className="rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white">{t('nav.dashboard')}</Link> : <Link onClick={() => setMenuOpen(false)} to="/login" className="rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white">{t('nav.login')}</Link>}</div>
    </div>}
  </header>;
}
