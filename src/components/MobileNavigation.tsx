import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BedDouble, House, Phone, UserRound, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function MobileNavigation() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const staff = user?.role === 'admin' || user?.role === 'manager';
  const visible = Boolean(user) && pathname !== '/login' && pathname !== '/complete-profile';
  useEffect(() => {
    document.body.classList.toggle('has-mobile-navigation', visible);
    return () => document.body.classList.remove('has-mobile-navigation');
  }, [visible]);
  useEffect(() => { if (window.matchMedia('(max-width: 767px)').matches) window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  if (!visible) return null;
  const links = [
    { to: '/', label: 'Bosh sahifa', icon: House },
    user?.role === 'admin' ? { to: '/app/employees', label: 'Ishchilar', icon: Users } : { to: staff ? '/app/rooms' : '/rooms', label: 'Xonalar', icon: BedDouble },
    { to: '/contact', label: 'Aloqa', icon: Phone },
    { to: staff ? '/app' : '/app/my-stay', label: 'Kabinet', icon: UserRound, Users },
  ];
  return <nav aria-label="Mobil menyu" className="mobile-bottom-navigation">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive && !(staff && to === '/app' && pathname.startsWith('/app/rooms')) ? 'is-active' : ''}><Icon size={19} /><span>{label}</span></NavLink>)}</nav>;
}
