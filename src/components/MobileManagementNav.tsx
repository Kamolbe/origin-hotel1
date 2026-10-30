import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CircleUserRound, Ellipsis } from 'lucide-react';
import { MobileMoreMenu } from './MobileMoreMenu';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

export function MobileManagementNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  if (!user || pathname === '/app' || pathname === '/app/my-stay') return null;
  return <div className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--page)]/90 px-5 backdrop-blur-xl md:hidden"><div className="flex h-[74px] items-center justify-between gap-4"><Logo /><div className="flex shrink-0 items-center gap-2"><Link to={user.role === 'user' ? '/app/my-stay' : '/app'} aria-label="Shaxsiy kabinet" className="grid h-11 w-11 place-items-center rounded-full"><CircleUserRound size={25} strokeWidth={1.5} /></Link><button type="button" aria-label="Ko‘proq menyusini ochish" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line)]"><Ellipsis size={22} /></button></div></div><MobileMoreMenu open={menuOpen} onClose={() => setMenuOpen(false)} /></div>;
}
