import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleHelp, Command, FileBarChart2, LayoutDashboard, LogOut, Menu, Moon, Search, Settings, ShieldCheck, Sun, Users, WalletCards, X, BedDouble, House } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { formatMoney } from '../services/hotelUtils';
import type { UserRole } from '../types';

const navigation = [
  { to: '/app', key: 'nav.dashboard', icon: LayoutDashboard, roles: ['user', 'manager', 'admin'] as UserRole[] },
  { to: '/app/rooms', key: 'nav.rooms', icon: BedDouble, roles: ['user', 'manager', 'admin'] as UserRole[] },
  { to: '/app/guests', key: 'nav.guests', icon: Users, roles: ['manager', 'admin'] as UserRole[] },
  { to: '/app/bookings', key: 'nav.bookings', icon: CalendarDays, roles: ['user', 'manager', 'admin'] as UserRole[] },
  { to: '/app/finance', key: 'nav.finance', icon: WalletCards, roles: ['manager', 'admin'] as UserRole[] },
  { to: '/app/reports', key: 'nav.reports', icon: ChartNoAxesCombined, roles: ['manager', 'admin'] as UserRole[] },
  { to: '/app/users', key: 'Foydalanuvchilar', icon: ShieldCheck, roles: ['admin'] as UserRole[] },
  { to: '/app/settings', key: 'nav.settings', icon: Settings, roles: ['user', 'manager', 'admin'] as UserRole[] },
];

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { data, updateData } = useAppData();
  const { theme, toggleTheme } = useTheme();
  const { success } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setSearchOpen((value) => !value);
      }
      if (event.key === 'Escape') { setSearchOpen(false); setNotificationsOpen(false); setProfileOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!notificationsRef.current?.contains(target)) setNotificationsOpen(false);
      if (!profileRef.current?.contains(target)) setProfileOpen(false);
    };
    window.addEventListener('pointerdown', closeOnOutside);
    return () => window.removeEventListener('pointerdown', closeOnOutside);
  }, []);

  useEffect(() => { setMobileOpen(false); setNotificationsOpen(false); setProfileOpen(false); }, [location.pathname]);

  const visibleNav = navigation.filter((item) => user && item.roles.includes(user.role));
  const title = visibleNav.find((item) => item.to === location.pathname)?.key ?? (location.pathname.endsWith('/profile') ? 'nav.profile' : 'nav.dashboard');
  const visibleNotifications = data.notifications.filter((item) => !item.userId || item.userId === user?.id);
  const unread = data.notifications.filter((item) => !item.read && (!item.userId || item.userId === user?.id));
  const quickLinks = useMemo(() => visibleNav.map((item) => ({ title: item.key.startsWith('nav.') ? t(item.key) : item.key, path: item.to, kind: 'page' })), [visibleNav, t]);
  const searchResults = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return quickLinks.slice(0, 6);
    const pages = quickLinks.filter((item) => item.title.toLocaleLowerCase().includes(needle));
    const rooms = data.rooms.filter((room) => `${room.number} ${room.type}`.toLocaleLowerCase().includes(needle)).slice(0, 5).map((room) => ({ title: `Xona ${room.number} · ${room.type}`, path: '/app/rooms', kind: 'room' }));
    const guests = user?.role !== 'user' ? data.guests.filter((guest) => `${guest.firstName} ${guest.lastName} ${guest.email}`.toLocaleLowerCase().includes(needle)).slice(0, 4).map((guest) => ({ title: `${guest.firstName} ${guest.lastName}`, path: '/app/guests', kind: 'guest' })) : [];
    return [...pages, ...rooms, ...guests].slice(0, 9);
  }, [data.guests, data.rooms, query, quickLinks, user?.role]);

  function chooseResult(path: string) { navigate(path); setSearchOpen(false); setQuery(''); }
  function markAllRead() {
    updateData((current) => ({ ...current, notifications: current.notifications.map((item) => (!item.userId || item.userId === user?.id) ? { ...item, read: true } : item) }));
    setNotificationsOpen(false);
    success('Bildirishnomalar o‘qilgan deb belgilandi.');
  }
  function doLogout() { logout(); navigate('/'); }

  const sidebar = <div className="flex h-full flex-col px-4 pb-5 pt-6">
    <div className="px-3"><Logo to="/app" /></div>
    <div className="mb-3 mt-9 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-muted">Mehmonxona boshqaruvi</div>
    <nav className="flex-1 space-y-1" aria-label="Boshqaruv menyusi">{visibleNav.map(({ to, key, icon: Icon }) => <NavLink key={to} to={to} end={to === '/app'} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-3 text-[12px] font-semibold transition ${isActive ? 'bg-ink text-white shadow-soft' : 'text-muted hover:bg-[var(--page)] hover:text-[var(--text)]'}`}>
      {({ isActive }) => <><Icon size={17} className={isActive ? 'text-champagne' : 'text-muted group-hover:text-champagne'} /><span>{key.startsWith('nav.') ? t(key) : key}</span>{to === '/app/bookings' && data.bookings.some((item) => item.status === 'pending') && user?.role === 'admin' && <span className="ml-auto h-2 w-2 rounded-full bg-champagne" />}</>}
    </NavLink>)}</nav>
    <div className="rounded-2xl bg-[var(--page)] p-4"><div className="flex items-center gap-2 text-champagne"><CircleHelp size={16} /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Yordam markazi</span></div><p className="mt-2 text-[10px] leading-5 text-muted">Mehmonlar xizmati 24/7<br />+998 71 200 20 20</p></div>
    <div className="mt-4 flex items-center gap-3 border-t border-[var(--line)] px-2 pt-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-champagne">{user?.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
      <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{user?.name}</p><p className="text-[10px] capitalize text-muted">{user?.role}</p></div>
      <button onClick={doLogout} title={t('nav.logout', { defaultValue: 'Chiqish' })} className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600"><LogOut size={15} /></button>
    </div>
  </div>;

  return <div className="min-h-screen bg-[var(--page)] text-[var(--text)]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[244px] border-r border-[var(--line)] bg-[var(--surface)] xl:block">{sidebar}</aside>
    <AnimatePresence>{mobileOpen && <><motion.button aria-label="Menyuni yopish" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-ink/50 xl:hidden" /><motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ duration: .22 }} className="fixed inset-y-0 left-0 z-50 w-[280px] overflow-y-auto overscroll-contain bg-[var(--surface)] xl:hidden"><div className="px-4 pt-4 sm:hidden"><LanguageSwitcher /></div>{sidebar}<button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 rounded-full p-2 xl:hidden" aria-label="Menyuni yopish"><X size={17} /></button></motion.aside></>}</AnimatePresence>
    <div className="xl:pl-[244px]">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--page)]/90 backdrop-blur-xl">
        <div className="flex h-[72px] items-center justify-between gap-3 px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-xl border border-[var(--line)] p-2.5 xl:hidden" aria-label="Menyuni ochish"><Menu size={17} /></button><div className="hidden sm:block"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-muted">Origin Hotel</p><h1 className="mt-0.5 truncate text-sm font-semibold">{title.startsWith('nav.') ? t(title) : title}</h1></div></div>
          <div className="flex items-center gap-2">
            <Link to="/" title="Asosiy saytga qaytish" aria-label="Asosiy saytga qaytish" className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] p-2.5 text-muted transition hover:border-champagne/60 hover:text-champagne"><House size={16} /><span className="hidden text-xs font-semibold lg:inline">Sayt</span></Link>
            <button onClick={() => setSearchOpen(true)} className="hidden items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs text-muted transition hover:border-champagne sm:flex"><Search size={14} /><span className="mr-5">{t('common.search')}...</span><kbd className="flex items-center gap-0.5 rounded bg-[var(--page)] px-1.5 py-1 text-[9px]"><Command size={10} />K</kbd></button>
            <button onClick={() => setSearchOpen(true)} className="rounded-full border border-[var(--line)] p-2.5 text-muted sm:hidden" aria-label={t('common.search')}><Search size={16} /></button>
            <div className="hidden sm:block"><LanguageSwitcher /></div>
            <button onClick={toggleTheme} aria-label="Mavzuni almashtirish" className="rounded-full border border-[var(--line)] p-2.5 text-muted hover:text-champagne">{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}</button>
            <div ref={notificationsRef} className="relative" onPointerEnter={(event) => event.pointerType === 'mouse' && setNotificationsOpen(true)} onPointerLeave={(event) => event.pointerType === 'mouse' && setNotificationsOpen(false)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setNotificationsOpen(false); }}>
              <button onClick={() => setNotificationsOpen((value) => !value)} aria-label="Bildirishnomalar" aria-expanded={notificationsOpen} aria-controls="notification-panel" className="relative rounded-full border border-[var(--line)] p-2.5 text-muted transition hover:border-champagne/60 hover:text-champagne"><Bell size={16} />{unread.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-champagne ring-2 ring-[var(--page)]" />}</button>
              {notificationsOpen && <div id="notification-panel" className="fixed right-4 top-[80px] z-50 max-h-[calc(100dvh-96px)] w-[min(340px,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-lift sm:absolute sm:right-0 sm:top-full"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Bildirishnomalar</p>{unread.length > 0 && <button onClick={markAllRead} className="text-[10px] font-semibold text-champagne">Barchasini o‘qish</button>}</div><div className="mt-3 max-h-80 space-y-2 overflow-y-auto">{visibleNotifications.slice(0, 8).map((item) => <button type="button" onClick={() => { updateData((current) => ({ ...current, notifications: current.notifications.map((notification) => notification.id === item.id ? { ...notification, read: true } : notification) })); setNotificationsOpen(false); }} key={item.id} className={`block w-full text-left rounded-xl p-3 transition hover:ring-1 hover:ring-champagne focus-visible:ring-2 focus-visible:ring-champagne ${item.read ? 'bg-[var(--page)]' : 'bg-champagne/10'}`}><p className="text-xs font-semibold">{item.title}</p><p className="mt-1 text-[10px] leading-4 text-muted">{item.message}</p><p className="mt-1 text-[9px] text-muted">{new Date(item.createdAt).toLocaleString('uz-UZ')}</p></button>)}{visibleNotifications.length === 0 && <p className="py-6 text-center text-xs text-muted">Hozircha bildirishnoma yo‘q.</p>}</div></div>}
            </div>
            <div ref={profileRef} className="relative" onPointerEnter={(event) => event.pointerType === 'mouse' && setProfileOpen(true)} onPointerLeave={(event) => event.pointerType === 'mouse' && setProfileOpen(false)}>
              <button aria-label="Profil menyusi" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-2 rounded-full border border-[var(--line)] py-1 pl-1 pr-2 transition hover:border-champagne/60"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-champagne">{user?.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><ChevronDown size={13} className={`text-muted transition-transform ${profileOpen ? 'rotate-180' : ''}`} /></button>
              {profileOpen && <div className="absolute right-0 top-full z-50 pt-2"><div className="min-w-44 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-lift"><Link to="/app/profile" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2 text-xs transition hover:bg-[var(--page)]">{t('nav.profile')}</Link><button onClick={doLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50"><LogOut size={13} />{t('nav.logout', { defaultValue: 'Chiqish' })}</button></div></div>}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-7 sm:py-9"><Outlet /></main>
    </div>

    <AnimatePresence>{searchOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) { setSearchOpen(false); setQuery(''); } }} className="fixed inset-0 z-[90] flex items-start justify-center bg-ink/50 px-4 pt-[14vh] backdrop-blur-sm">
      <motion.div initial={{ y: 12, scale: .98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 8, scale: .98 }} className="w-full max-w-xl overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-lift"><div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4"><Search size={18} className="text-champagne" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sahifa, xona yoki mehmon qidirish..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><button onClick={() => setSearchOpen(false)} className="rounded bg-[var(--page)] px-2 py-1 text-[10px] text-muted">ESC</button></div><div className="max-h-[50vh] overflow-y-auto p-2">{searchResults.map((result) => <button key={`${result.kind}-${result.path}-${result.title}`} onClick={() => chooseResult(result.path)} className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm hover:bg-[var(--page)]"><span>{result.title}</span><span className="text-[9px] uppercase tracking-wider text-muted">{result.kind === 'page' ? 'Sahifa' : result.kind === 'room' ? 'Xona' : 'Mehmon'}</span></button>)}{searchResults.length === 0 && <p className="p-6 text-center text-xs text-muted">Mos natija topilmadi.</p>}</div></motion.div>
    </motion.div>}</AnimatePresence>
  </div>;
}
