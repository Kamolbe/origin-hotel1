import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export function MarketingNav() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const links = [
    { href: '#rooms', label: t('nav.rooms') },
    { href: '#about', label: t('nav.about') },
    { href: '#reviews', label: t('landing.reviewsTitle') },
    { href: '#contact', label: t('nav.contact') },
  ];
  const accountPath = user?.role === 'user' ? '/app/bookings' : '/app';
  const themeButton = <button type="button" onClick={toggleTheme} className="rounded-full border border-[var(--line)] p-2.5 text-[var(--text)] transition hover:border-champagne hover:text-champagne" aria-label={theme === 'light' ? 'Qorong‘i mavzuni yoqish' : 'Yorug‘ mavzuni yoqish'}>{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}</button>;

  return <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--page)]/90 backdrop-blur-xl">
    <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
      <Logo />
      <nav className="hidden items-center gap-7 lg:flex" aria-label="Asosiy navigatsiya">{links.map((link) => <a key={link.href} href={link.href} className="text-xs font-semibold text-muted transition hover:text-champagne">{link.label}</a>)}</nav>
      <div className="hidden items-center gap-2.5 md:flex">
        {themeButton}
        <LanguageSwitcher />
        {user ? <div className="flex items-center gap-2 pl-2">
          <Link to={accountPath} className="flex items-center gap-2 rounded-full border border-[var(--line)] px-2 py-1.5 hover:border-champagne">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-champagne">{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
            <span className="max-w-[100px] text-left"><span className="block truncate text-xs font-semibold">{user.name}</span><span className="block text-[10px] capitalize text-muted">{user.role}</span></span>
          </Link>
          <button onClick={() => { logout(); navigate('/'); }} aria-label={t('nav.logout', { defaultValue: 'Chiqish' })} className="rounded-full p-2 text-muted hover:bg-[var(--surface)] hover:text-rose-600"><LogOut size={16} /></button>
        </div> : <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white transition hover:bg-ink-soft">{t('nav.login')}<ArrowUpRight size={14} /></Link>}
      </div>
      <div className="flex items-center gap-2 md:hidden">
        {themeButton}
        <button type="button" aria-label={menuOpen ? 'Menyuni yopish' : 'Menyuni ochish'} onClick={() => setMenuOpen((open) => !open)} className="rounded-full border border-[var(--line)] p-2.5">{menuOpen ? <X size={17} /> : <Menu size={17} />}</button>
      </div>
    </div>
    {menuOpen && <div className="border-t border-[var(--line)] bg-[var(--page)] px-5 py-4 md:hidden">
      <div className="flex flex-col gap-1">{links.map((link) => <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-[var(--surface)]">{link.label}</a>)}</div>
      <div className="mt-3 flex items-center justify-between gap-3"><LanguageSwitcher />{user ? <Link onClick={() => setMenuOpen(false)} to={accountPath} className="rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white">{t('nav.dashboard')}</Link> : <Link onClick={() => setMenuOpen(false)} to="/login" className="rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white">{t('nav.login')}</Link>}</div>
    </div>}
  </header>;
}
