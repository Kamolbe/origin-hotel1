import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const sections = [
  ['/app/rooms', 'Xonalar'], ['/app/guests', 'Mehmonlar'], ['/app/bookings', 'Bronlar'],
  ['/app/finance', 'Moliya'], ['/app/reports', 'Hisobotlar'], ['/app/users', 'Foydalanuvchilar'],
  ['/app/settings', 'Sozlamalar'], ['/app/profile', 'Mening profilim'],
];

export function MobileManagementNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (user?.role !== 'admin' && user?.role !== 'manager') return null;
  const title = sections.find(([to]) => pathname === to || pathname.startsWith(`${to}/`))?.[1] ?? 'Boshqaruv paneli';
  return <div className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur md:hidden"><p className="text-[9px] font-bold uppercase tracking-widest text-champagne">{user.role === 'admin' ? 'Admin panel' : 'Boshqaruv'}</p><p className="mt-1 truncate text-sm font-semibold">{title}</p></div>;
}
