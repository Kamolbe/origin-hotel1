import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { dashboardMetrics, hotelToday } from '../services/dashboardMetrics';

export function RoomAvailability({ staff = false }: { staff?: boolean }) {
  const { data } = useAppData();
  const stats = dashboardMetrics(data, hotelToday(data.settings.timeZone));
  const total = stats.totalRooms;
  const segments = [
    { name: 'Bo‘sh', count: stats.rooms.available, color: '#21a687' },
    { name: 'Band', count: stats.rooms.occupied, color: '#4f80ef' },
    { name: 'Tozalanmoqda', count: stats.rooms.cleaning, color: '#edb04d' },
    { name: 'Ta’mirda', count: stats.rooms.maintenance, color: '#a09bb6' },
  ];
  let cursor = 0;
  const gradient = segments.map((segment) => { const start = cursor; cursor += total ? segment.count / total * 100 : 0; return `${segment.color} ${start}% ${cursor}%`; }).join(',');
  return <section aria-label="Xonalar bandligi" className="portal-panel"><div className="flex items-center justify-between gap-3"><div><p className="portal-eyebrow">Mehmonxona holati</p><h2 className="portal-section-title">Xonalarning taqsimoti</h2></div><Link to={staff ? '/app/rooms' : '/rooms'} aria-label="Barcha xonalarni ko‘rish" className="portal-icon-link"><ArrowUpRight size={18} /></Link></div><div className="mt-5 flex flex-wrap items-center justify-center gap-6"><div role="img" aria-label={`${total} xonadan ${stats.rooms.available} tasi bo‘sh, ${stats.freePercent} foiz`} className="portal-donut" style={{ background: total ? `conic-gradient(${gradient})` : 'var(--line)' }}><div><strong>{stats.freePercent}%</strong><span>bo‘sh xonalar</span></div></div><ul className="min-w-[150px] flex-1 space-y-3">{segments.map((segment) => <li key={segment.name} className="flex items-center gap-2 text-xs"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: segment.color }} /><span className="min-w-0 flex-1 break-words text-muted">{segment.name}</span><b>{segment.count}</b><span className="w-10 shrink-0 text-right text-[10px] text-muted">{total ? Number((segment.count / total * 100).toFixed(1)) : 0}%</span></li>)}</ul></div><p className="mt-5 border-t border-[var(--line)] pt-4 text-[11px] leading-5 text-muted">Jami {total} xona · Hozirgi holat. Tanlangan sanalardagi mavjudlik bronlashda tekshiriladi.</p></section>;
}
