import { canSeeNotification } from '../services/notificationVisibility';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, House, Moon, Search, Settings, Sun, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';

export function MobileAccountActions({ onNavigate }: { onNavigate?: () => void }) {
  const reducedMotion = usePrefersReducedMotion();
  const { user } = useAuth();
  const { data, updateData } = useAppData();
  const { theme, toggleTheme } = useTheme();
  const [panel, setPanel] = useState<'search' | 'notifications' | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const staff = user?.role === 'admin' || user?.role === 'manager';
  const routes = [
    ['/', 'Bosh sahifa'], ['/rooms', 'Xonalar'], ['/contact', 'Aloqa'],
    ...(user ? [['/app/profile', 'Mening profilim'], ...(user?.role === 'admin' ? [] : [['/app/bookings', 'Bronlar']]), ['/app/settings', 'Sozlamalar']] : []),
    ...(user?.role === 'manager' ? [['/app/guests', 'Mehmonlar']] : []),
    ...(staff ? [['/app/finance', 'Moliya'], ['/app/reports', 'Hisobotlar']] : []),
    ...(staff ? [['/app/users', 'Foydalanuvchilar']] : []),
    ...(user?.role === 'admin' ? [['/app/employees', 'Ishchilar va oyliklar']] : []),
  ];
  const notifications = user ? data.notifications.filter((item) => canSeeNotification(user,item)) : [];
  const pages = Math.max(1, Math.ceil(notifications.length / 2));
  const current = Math.min(page, pages - 1);
  const unread = notifications.filter((item) => !item.read).length;
  const control = 'flex min-w-0 min-h-12 items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-left text-xs font-semibold';
  return <section aria-label="Hisob amallari" className="mb-4 rounded-2xl bg-[var(--page)] p-3"><div className="grid grid-cols-2 gap-2">
    <Link to="/" onClick={onNavigate} className={`${control} hidden md:flex`}><House size={17} className="shrink-0 text-champagne" />Bosh sahifa</Link>
    <button type="button" onClick={toggleTheme} className={control}>{theme === 'light' ? <Moon size={17} className="text-champagne" /> : <Sun size={17} className="text-champagne" />}{theme === 'light' ? 'Tungi mavzu' : 'Kunduzgi mavzu'}</button>
    <button type="button" aria-expanded={panel === 'search'} onClick={() => setPanel(panel === 'search' ? null : 'search')} className={`${control} hidden md:flex`}><Search size={17} className="text-champagne" />Qidiruv</button>
    {user && <button type="button" aria-expanded={panel === 'notifications'} onClick={() => setPanel(panel === 'notifications' ? null : 'notifications')} className={control}><Bell size={17} className="shrink-0 text-champagne" /><span className="min-w-0 break-words [overflow-wrap:anywhere]">Bildirishnomalar{unread > 0 ? ` (${unread})` : ''}</span></button>}
    {user && <Link to="/app/profile" onClick={onNavigate} className={control}><UserRound size={17} className="text-champagne" /><span className="min-w-0 truncate">{user.name} · Profil</span></Link>}
    {user && <Link to="/app/settings" onClick={onNavigate} className={control}><Settings size={17} className="shrink-0 text-champagne" />Sozlamalar</Link>}
  </div>
    {panel === 'search' && <div className="mt-3 hidden md:block"><label className="block text-xs font-semibold">Sahifa qidirish<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Xona, bron, profil…" className="field mt-2" /></label><div className="mt-2 grid grid-cols-2 gap-2">{routes.filter(([, label]) => label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).map(([to, label]) => <Link key={to} to={to} onClick={onNavigate} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-xs">{label}</Link>)}</div>{!routes.some(([, label]) => label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) && <p className="py-3 text-xs text-muted">Natija topilmadi.</p>}</div>}
    <AnimatePresence>{panel === 'notifications' && <motion.div key="notifications" initial={{ opacity: 0, height: reducedMotion ? 'auto' : 0, y: reducedMotion ? 0 : -12 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: reducedMotion ? 'auto' : 0, y: reducedMotion ? 0 : -8 }} transition={{ duration: reducedMotion ? 0 : .35, ease: [.22, 1, .36, 1] }} style={{ overflow: 'hidden' }} aria-label="Bildirishnomalar ro‘yxati" className="mt-3 space-y-2">{notifications.slice(current * 2, current * 2 + 2).map((item) => <button type="button" key={item.id} title={`${item.title}: ${item.message}`} onClick={() => { updateData((state) => ({ ...state, notifications: state.notifications.map((note) => note.id === item.id ? { ...note, read: true } : note) })); setPanel(null); }} className={`block w-full rounded-xl border border-[var(--line)] p-3 text-left ${item.read ? 'bg-[var(--surface)]' : 'bg-champagne/10'}`}><span className="block truncate text-xs font-semibold">{item.title}</span><span className="mt-1 line-clamp-2 break-words text-xs leading-5 text-muted">{item.message}</span></button>)}{!notifications.length && <p className="p-3 text-xs text-muted">Hozircha bildirishnoma yo‘q.</p>}{pages > 1 && <div className="flex items-center justify-between gap-2 pt-2"><button type="button" disabled={current === 0} onClick={() => setPage(current - 1)} className="secondary-button disabled:opacity-35">Oldingi</button><span className="text-xs">{current + 1} / {pages}</span><button type="button" disabled={current + 1 >= pages} onClick={() => setPage(current + 1)} className="secondary-button disabled:opacity-35">Keyingi</button></div>}</motion.div>}</AnimatePresence>
  </section>;
}
