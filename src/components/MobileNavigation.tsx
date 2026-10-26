import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BedDouble, House, Phone, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function MobileNavigation() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const visible = Boolean(user) && pathname !== '/login';
  useEffect(() => {
    document.body.classList.toggle('has-mobile-navigation', visible);
    return () => document.body.classList.remove('has-mobile-navigation');
  }, [visible]);
  useEffect(() => { if (window.matchMedia('(max-width: 767px)').matches) window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  if (!visible) return null;
  const links = [
    { to: '/', label: 'Bosh sahifa', icon: House },
    { to: '/rooms', label: 'Xonalar', icon: BedDouble },
    { to: '/contact', label: 'Aloqa', icon: Phone },
    { to: '/app/my-stay', label: 'Kabinet', icon: UserRound },
  ];
  return <nav aria-label="Mobil menyu" className="mobile-bottom-navigation">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'is-active' : ''}><Icon size={19} /><span>{label}</span></NavLink>)}</nav>;
}
