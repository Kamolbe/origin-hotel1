import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CircleUserRound, Ellipsis } from 'lucide-react';
import { MobileMoreMenu } from './MobileMoreMenu';
import { useAuth } from '../context/AuthContext';

const sections = [
  ['/app/rooms', 'Xonalar'], ['/app/guests', 'Mehmonlar'], ['/app/bookings', 'Bronlar'],
  ['/app/finance', 'Moliya'], ['/app/reports', 'Hisobotlar'], ['/app/users', 'Foydalanuvchilar'],
  ['/app/settings', 'Sozlamalar'], ['/app/profile', 'Mening profilim'],
];

export function MobileManagementNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  if (!user || pathname === '/app' || pathname === '/app/my-stay') return null;
  const title = sections.find(([to]) => pathname === to || pathname.startsWith(`${to}/`))?.[1] ?? 'Boshqaruv paneli';
  return <div className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur md:hidden"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-widest text-champagne">{user.role === 'admin' ? 'Admin panel' : user.role === 'manager' ? 'Boshqaruv' : 'Origin Hotel'}</p><p className="mt-1 truncate text-sm font-semibold">{title}</p></div><div className="flex shrink-0 items-center gap-2"><Link to={user.role === 'user' ? '/app/my-stay' : '/app'} aria-label="Shaxsiy kabinet" className="grid h-11 w-11 place-items-center rounded-full"><CircleUserRound size={25} strokeWidth={1.5} /></Link><button type="button" aria-label="Ko‘proq menyusini ochish" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line)]"><Ellipsis size={22} /></button></div></div><MobileMoreMenu open={menuOpen} onClose={() => setMenuOpen(false)} /></div>;
}
