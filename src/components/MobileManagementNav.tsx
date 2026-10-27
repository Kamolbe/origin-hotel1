import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BedDouble, CalendarDays, ChartNoAxesCombined, LayoutDashboard, Menu, Settings, ShieldCheck, Users, WalletCards } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { MobileAccountActions } from './MobileAccountActions';
import { LanguageSwitcher } from './LanguageSwitcher';

export function MobileManagementNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  if (user?.role !== 'admin' && user?.role !== 'manager') return null;
  const links = [
    { to: '/app', label: 'Boshqaruv paneli', icon: LayoutDashboard },
    { to: '/app/rooms', label: 'Xonalar', icon: BedDouble },
    { to: '/app/guests', label: 'Mehmonlar', icon: Users },
    { to: '/app/bookings', label: 'Bronlar', icon: CalendarDays },
    { to: '/app/finance', label: 'Moliya', icon: WalletCards },
    { to: '/app/reports', label: 'Hisobotlar', icon: ChartNoAxesCombined },
    ...(user.role === 'admin' ? [{ to: '/app/users', label: 'Foydalanuvchilar', icon: ShieldCheck }] : []),
    { to: '/app/settings', label: 'Sozlamalar', icon: Settings },
  ];
  const title = links.find((item) => item.to === pathname)?.label ?? 'Boshqaruv';
  return <div className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur md:hidden"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-widest text-champagne">{user.role === 'admin' ? 'Admin panel' : 'Boshqaruv'}</p><p className="mt-1 truncate text-sm font-semibold">{title}</p></div><button type="button" aria-label="Boshqaruv bo‘limlarini ochish" aria-expanded={open} onClick={() => setOpen(true)} className="secondary-button gap-2 !px-3 !py-2"><Menu size={17} />Bo‘limlar</button></div><Modal open={open} onClose={() => setOpen(false)} title="Boshqaruv bo‘limlari" presentation="sheet"><div className="mb-4"><LanguageSwitcher /></div><nav aria-label="Mobil admin bo‘limlari" className="mb-5 grid grid-cols-2 gap-2">{links.map(({to,label,icon:Icon}) => <NavLink key={to} to={to} end={to === '/app'} onClick={() => setOpen(false)} className={({isActive}) => `flex min-h-20 min-w-0 flex-col gap-3 rounded-2xl border p-3 text-xs font-semibold ${isActive ? 'border-champagne bg-champagne/15' : 'border-[var(--line)] bg-[var(--page)]'}`}><Icon size={19} className="text-champagne" /><span className="break-words">{label}</span></NavLink>)}</nav><MobileAccountActions onNavigate={() => setOpen(false)} /></Modal></div>;
}
