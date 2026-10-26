import { Link, useNavigate } from 'react-router-dom';
import { BedDouble, CalendarDays, ChartNoAxesCombined, CircleHelp, LayoutDashboard, LogOut, Settings, ShieldCheck, Users, UserRound, WalletCards, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHotelContact } from '../hooks/useHotelContact';
import { LanguageSwitcher } from './LanguageSwitcher';

export function MobileCabinetMenu() {
  const { user, logout } = useAuth();
  const hotel = useHotelContact();
  const navigate = useNavigate();
  const staff = user?.role === 'admin' || user?.role === 'manager';
  const links = [
    { to: staff ? '/app' : '/app/my-stay', label: staff ? 'Boshqaruv paneli' : 'Shaxsiy kabinet', icon: LayoutDashboard },
    { to: staff ? '/app/rooms' : '/rooms', label: 'Xonalar', icon: BedDouble },
    ...(staff ? [{ to: '/app/guests', label: 'Mehmonlar', icon: Users }] : []),
    { to: '/app/bookings', label: staff ? 'Bronlar' : 'Mening bronlarim', icon: CalendarDays },
    ...(staff ? [{ to: '/app/finance', label: 'Moliya', icon: WalletCards }, { to: '/app/reports', label: 'Hisobotlar', icon: ChartNoAxesCombined }] : []),
    ...(user?.role === 'admin' ? [{ to: '/app/users', label: 'Foydalanuvchilar', icon: ShieldCheck }] : []),
    { to: '/app/settings', label: 'Sozlamalar', icon: Settings },
    { to: '/app/profile', label: 'Mening profilim', icon: UserRound },
  ];
  return <section className="surface mb-6 rounded-3xl p-4 md:hidden" aria-label="Kabinet bo‘limlari"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-champagne">{staff ? 'Mehmonxona boshqaruvi' : 'Mening hisobim'}</p><h2 className="mt-1 font-display text-xl">Kabinet menyusi</h2></div><LanguageSwitcher /></div><nav aria-label="Kabinet boshqaruv menyusi" className="grid grid-cols-2 gap-2">{links.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className="flex min-h-20 min-w-0 flex-col items-start justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--page)] p-3 transition hover:border-champagne"><Icon size={19} className="text-champagne" /><span className="flex w-full items-center justify-between gap-1 text-xs font-semibold"><span>{label}</span><ChevronRight size={13} className="shrink-0 text-muted" /></span></Link>)}</nav><div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[var(--page)] p-3"><a href={hotel.phoneHref} className="min-w-0 text-xs"><span className="flex items-center gap-2 font-semibold"><CircleHelp size={15} />Yordam markazi</span><span className="mt-1 block text-muted">{hotel.phone}</span></a><button type="button" onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-2 text-xs text-danger"><LogOut size={14} />Chiqish</button></div></section>;
}
