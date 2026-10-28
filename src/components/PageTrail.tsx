import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const names: Record<string, string> = {
  rooms: 'Xonalar', guests: 'Mehmonlar', bookings: 'Bronlar', finance: 'Moliya', reports: 'Hisobotlar', users: 'Foydalanuvchilar', profile: 'Mening profilim', 'my-stay': 'Mening kabinetim',
  settings: 'Sozlamalar', site: 'Sayt muharriri', hotel: 'Mehmonxona va aloqa', security: 'Xavfsizlik', roles: 'Rollar', communication: 'Xabarlar', content: 'Kontent va media', seo: 'SEO va integratsiya', interface: 'Menyu va interfeys', operations: 'Backup va tizim',
  text: 'Matnlar', media: 'Rasmlar va logo', layout: 'Sahifa bo‘limlari', stay: 'Mehmonxona qoidalari', account: 'Profil', preferences: 'Mening tanlovlarim', privacy: 'Ma’lumotlarim', help: 'Yordam',
};

export function PageTrail() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const parts = pathname.split('/').filter(Boolean).slice(1);
  if (!parts.length || pathname === '/app/my-stay') return null;
  const isSettings = parts[0] === 'settings';
  const home = user?.role === 'admin' || user?.role === 'manager' ? '/app' : '/app/my-stay';
  const parent = parts.length > 1 ? `/app/${parts.slice(0, -1).join('/')}` : home;
  return <div className="mb-5 space-y-3"><Link to={parent} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold md:hidden"><ArrowLeft size={15} />Orqaga</Link><nav aria-label="Sahifa yo‘li"><ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-6 text-muted"><li className={isSettings ? 'md:hidden' : ''}><Link to={home} className="hover:text-champagne"><span className="md:hidden">Kabinet</span><span className="hidden md:inline">{home === '/app' ? 'Boshqaruv paneli' : 'Kabinet'}</span></Link></li>{parts.map((part, index) => <li key={`${index}-${part}`} className="flex min-w-0 items-center gap-2"><ChevronRight size={12} className={`shrink-0 ${isSettings && index === 0 ? 'md:hidden' : ''}`} />{index === parts.length - 1 ? <span aria-current="page" className="font-semibold text-[var(--text)]">{names[part] ?? 'Sahifa'}</span> : <Link to={`/app/${parts.slice(0, index + 1).join('/')}`} className="hover:text-champagne">{names[part] ?? 'Sahifa'}</Link>}</li>)}</ol></nav></div>;
}
