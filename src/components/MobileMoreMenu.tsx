import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, CalendarDays, CircleHelp, CircleUserRound, Mail, MapPin, Moon, Phone, Sun } from 'lucide-react';
import { Modal } from './Modal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileAccountActions } from './MobileAccountActions';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';
import { useHotelContact } from '../hooks/useHotelContact';

export function MobileMoreMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { data } = useAppData();
  const { theme, toggleTheme } = useTheme();
  const hotel = useHotelContact();
  const cabinet = user?.role === 'admin' || user?.role === 'manager' ? '/app' : '/app/my-stay';
  const row = 'hotel-more-row';
  return <Modal open={open} onClose={onClose} title="Ko‘proq" presentation="sheet">
    <div className="hotel-more-preferences"><div><span className="text-sm font-semibold">{data.settings.currency}</span><span className="ml-3 text-sm text-muted">{data.settings.currency === 'UZS' ? 'O‘zbekiston so‘mi' : data.settings.currency === 'USD' ? 'AQSh dollari' : 'Yevro'}</span></div><div className="mt-5 flex items-center justify-between gap-4"><span className="text-sm">Sayt tili</span><LanguageSwitcher /></div><button type="button" onClick={toggleTheme} className={`${row} mt-3 !px-0`}>{theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}<span>{theme === 'light' ? 'Tungi mavzu' : 'Kunduzgi mavzu'}</span></button></div>
    <section className="hotel-more-section"><h3>Hisobingiz</h3><Link to={user ? cabinet : '/login'} onClick={onClose} className={row}><CircleUserRound size={25} /><span>{user ? user.name : 'Kirish yoki ro‘yxatdan o‘tish'}<small>{user ? 'Kabinet va shaxsiy ma’lumotlar' : 'Bronlaringizni bir joyda boshqaring'}</small></span><ArrowRight size={17} className="ml-auto" /></Link>{user && user.role !== 'admin' && <Link to="/app/bookings" onClick={onClose} className={row}><CalendarDays size={23} /><span>{user.role === 'user' ? 'Mening bronlarim' : 'Bronlar nazorati'}</span></Link>}</section>
    <section className="hotel-more-section"><h3>Safaringizni rejalashtiring</h3><Link to="/rooms" onClick={onClose} className={row}><BedDouble size={23} /><span>Xonalar va narxlar</span></Link><Link to="/" state={{ scrollToSection: 'about' }} onClick={onClose} className={row}><MapPin size={23} /><span>Mehmonxona va qulayliklar</span></Link></section>
    <section className="hotel-more-section"><h3>Yordam va qo‘llab-quvvatlash</h3><Link to="/contact" onClick={onClose} className={row}><Phone size={23} /><span>Qabulxona bilan bog‘lanish</span></Link><Link to="/" state={{ scrollToSection: 'stay-planner' }} onClick={onClose} className={row}><CircleHelp size={23} /><span>Ko‘p so‘raladigan savollar</span></Link><a href={`mailto:${hotel.email}`} className={row}><Mail size={23} /><span className="min-w-0 break-words">Email orqali murojaat</span></a></section>
    <details className="hotel-more-section"><summary className="cursor-pointer py-3 text-sm font-semibold">Qidiruv va hisob amallari</summary><MobileAccountActions onNavigate={onClose} /></details>
    <p className="pb-5 pt-3 text-xs text-muted">{hotel.name} · {hotel.phone}</p>
  </Modal>;
}
