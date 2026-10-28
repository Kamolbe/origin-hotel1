import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BedDouble, CalendarCheck2, CalendarClock, CheckCheck, CircleDollarSign, LogIn, LogOut, Plus, Settings, ShieldCheck, Sparkles, Users, WalletCards } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ResponsiveTable } from '../components/ResponsiveTable';
import { MobileCabinetMenu } from '../components/MobileCabinetMenu';
import { PageHeader } from '../components/PageHeader';
import { DashboardMetric } from '../components/DashboardMetric';
import { RoomAvailability } from '../components/RoomAvailability';
import { StatusPill } from '../components/StatusPill';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { formatMoney } from '../services/hotelUtils';
import { BOOKING_LABELS, bookingTimeline, dashboardMetrics, dashboardDate, hotelToday } from '../services/dashboardMetrics';

export function DashboardPage() {
  const { data } = useAppData();
  const { user } = useAuth();
  const reduced = usePrefersReducedMotion();
  const [months, setMonths] = useState<6 | 12>(6);
  const today = hotelToday(data.settings.timeZone);
  const stats = useMemo(() => dashboardMetrics(data, today), [data, today]);
  const chart = useMemo(() => bookingTimeline(data, today, months), [data, today, months]);
  if (user?.role !== 'admin' && user?.role !== 'manager') return <Navigate to="/app/my-stay" replace />;
  const recent = [...data.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const incomeTrend = stats.previousIncome > 0 ? Math.round((stats.monthIncome - stats.previousIncome) / stats.previousIncome * 100) : null;
  const tools = [
    { to: '/app/bookings', label: 'Yangi bron yaratish', hint: 'Mehmon uchun bron kiriting', icon: Plus, state: { createBooking: true } },
    { to: '/app/rooms', label: 'Xonalarni boshqarish', hint: 'Narxlar, holat va qulayliklar', icon: BedDouble },
    { to: '/app/finance', label: 'Moliyani ko‘rish', hint: 'Kirim, chiqim va to‘lovlar', icon: WalletCards },
    { to: '/app/reports', label: 'Hisobotlarni ochish', hint: 'Davrlar bo‘yicha tahlil', icon: Activity },
    ...(user.role === 'admin' ? [{ to: '/app/users', label: 'Foydalanuvchilar', hint: 'Hisoblar va sayt faoliyati', icon: ShieldCheck }] : []),
    { to: '/app/settings', label: 'Sozlamalar', hint: 'Sayt, aloqa va dizayn', icon: Settings },
  ];
  const movements = [...stats.arrivals.map((booking) => ({ booking, label: 'Keladi', icon: LogIn })), ...stats.departures.map((booking) => ({ booking, label: 'Ketadi', icon: LogOut }))];
  return <div className="portal-dashboard space-y-5">
    <PageHeader eyebrow={`${data.settings.hotelName} · Boshqaruv`} title="Boshqaruv paneli" description={`Xush kelibsiz, ${user.name.split(' ')[0]}. Mehmonxonangizning bugungi ko‘rinishi.`} action={<Link to="/app/bookings" state={{ createBooking: true }} className="primary-button gap-2"><Plus size={16} />Yangi bron</Link>} />
    <div className="portal-overview-banner"><span className="inline-flex items-center gap-2 text-xs font-semibold"><Sparkles size={16} />{dashboardDate(today)}</span><span className="text-[11px] text-muted">{stats.pending} ta so‘rov ko‘rib chiqilmoqda · {stats.stayingGuests} mehmon joylashgan</span></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardMetric label="Jami bronlar" value={data.bookings.length} detail={`Bu oy ${stats.monthBookings} ta yangi bron`} icon={CalendarCheck2} />
      <DashboardMetric label="Jami mehmonlar" value={data.guests.length} detail={`Hozir mehmonxonada ${stats.stayingGuests} mehmon`} icon={Users} tone="green" />
      <DashboardMetric label="Bo‘sh xonalar" value={stats.rooms.available} detail={`${stats.totalRooms} xonadan ${stats.freePercent}% bo‘sh`} icon={BedDouble} tone="amber" />
      <DashboardMetric label="Oylik tushum" value={formatMoney(stats.monthIncome, data.settings.currency)} detail={incomeTrend === null ? 'Oldingi oy uchun taqqoslash ma’lumoti yo‘q' : `${incomeTrend >= 0 ? '+' : ''}${incomeTrend}% · o‘tgan oyga nisbatan`} icon={CircleDollarSign} tone="violet" />
    </div>
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className="portal-panel min-w-0" aria-label="Bronlar statistikasi"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="portal-eyebrow">O‘sish va faollik</p><h2 className="portal-section-title">Bronlar statistikasi</h2></div><div className="portal-segment" role="group" aria-label="Statistika davri">{([6, 12] as const).map((count) => <button key={count} type="button" aria-pressed={months === count} onClick={() => setMonths(count)}>{count} oy</button>)}</div></div><p className="mt-2 text-[11px] text-muted">Yaratilgan sanasi bo‘yicha barcha holatdagi bronlar.</p><div className="mt-5 h-56 min-w-0 sm:h-64" role="img" aria-label={`Oxirgi ${months} oyda ${chart.reduce((sum, item) => sum + item.bronlar, 0)} ta bron yaratilgan`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart} margin={{ top: 10, right: 8, left: -26, bottom: 0 }}><defs><linearGradient id="dashboard-bookings-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f80ef" stopOpacity={.24} /><stop offset="100%" stopColor="#4f80ef" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--line)" vertical={false} strokeDasharray="3 4" /><XAxis dataKey="month" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={16} /><YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 12 }} labelFormatter={(_, rows) => rows?.[0]?.payload?.period ?? ''} /><Area type="monotone" dataKey="bronlar" name="Bronlar" stroke="#4f80ef" strokeWidth={2.5} fill="url(#dashboard-bookings-fill)" isAnimationActive={!reduced} /></AreaChart></ResponsiveContainer></div></section>
      <RoomAvailability staff />
    </div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className="portal-panel !p-0 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="portal-eyebrow">So‘nggi faoliyat</p><h2 className="portal-section-title">Oxirgi bronlar</h2></div><Link to="/app/bookings" className="portal-text-link">Barchasini ko‘rish<ArrowRight size={14} /></Link></div>{recent.length ? <ResponsiveTable><table className="w-full min-w-[600px] text-left"><thead className="bg-[var(--page)] text-[9px] uppercase tracking-wider text-muted"><tr>{['Mehmon / Bron', 'Xona', 'Kelish', 'Holat'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{recent.map((booking) => { const guest = data.guests.find((item) => item.id === booking.guestId); const room = data.rooms.find((item) => item.id === booking.roomId); return <tr key={booking.id} className="border-t border-[var(--line)] text-xs"><td className="px-4 py-4 font-semibold">{guest ? `${guest.firstName} ${guest.lastName}` : 'Mehmon'}<span className="mt-1 block text-[10px] font-normal text-muted">{booking.bookingNumber}</span></td><td className="px-4 py-4">{room?.type ?? 'Xona'}<span className="mt-1 block text-[10px] text-muted">№ {room?.number ?? '—'}</span></td><td className="px-4 py-4 text-[11px]">{booking.checkIn}</td><td className="px-4 py-4"><StatusPill status={booking.status}>{BOOKING_LABELS[booking.status]}</StatusPill></td></tr>; })}</tbody></table></ResponsiveTable> : <p className="p-6 text-sm text-muted">Hali bron yaratilmagan. Birinchi bronni qo‘shing.</p>}</section>
      <section className="portal-panel"><p className="portal-eyebrow">Ishingizni tezlashtiring</p><h2 className="portal-section-title">Tezkor amallar</h2><nav aria-label="Admin tezkor amallari" className="mt-4 grid gap-2">{tools.map(({ to, label, hint, icon: Icon, ...item }) => <Link key={to} to={to} state={'state' in item ? item.state : undefined} className="portal-quick-action"><span className="portal-action-icon"><Icon size={17} /></span><span className="min-w-0 flex-1"><b className="block text-xs">{label}</b><span className="mt-1 block text-[10px] text-muted">{hint}</span></span><ArrowUpRight size={15} className="shrink-0 text-muted" /></Link>)}</nav></section>
    </div>
    <div className="grid gap-5 lg:grid-cols-3">
      <section className="portal-panel"><div className="flex items-center gap-2"><CalendarClock size={18} className="text-champagne" /><h2 className="portal-section-title !mt-0">Bugungi reja</h2></div><div className="my-4 grid grid-cols-2 gap-3"><div className="portal-mini-stat"><span>Kelishlar</span><b>{stats.arrivals.length}</b></div><div className="portal-mini-stat"><span>Ketishlar</span><b>{stats.departures.length}</b></div></div>{movements.length ? <ul className="space-y-3">{movements.slice(0, 4).map(({ booking, label, icon: Icon }) => <li key={`${label}-${booking.id}`} className="flex items-center gap-2 text-xs"><Icon size={14} className="text-muted" /><span className="flex-1">{label} · {data.rooms.find((room) => room.id === booking.roomId)?.number ?? '—'}-xona</span><Link to="/app/bookings" className="portal-text-link">Ko‘rish</Link></li>)}</ul> : <p className="text-xs leading-6 text-muted">Bugun uchun tasdiqlangan kelish yoki ketish yo‘q.</p>}</section>
      <section className="portal-panel"><p className="portal-eyebrow">Nazorat markazi</p><h2 className="portal-section-title">E’tibor talab qiladi</h2><Link to="/app/bookings" className="portal-alert-row"><CalendarClock size={17} /><span>Kutilayotgan bronlar</span><b>{stats.pending}</b></Link><Link to="/app/rooms" className="portal-alert-row"><CheckCheck size={17} /><span>Tozalanadigan xonalar</span><b>{stats.rooms.cleaning}</b></Link><Link to="/app/rooms" className="portal-alert-row"><BedDouble size={17} /><span>Ta’mirdagi xonalar</span><b>{stats.rooms.maintenance}</b></Link></section>
      <section className="portal-panel"><p className="portal-eyebrow">Oylik moliya</p><h2 className="portal-section-title">Kirim va chiqim</h2><p className="mt-5 flex items-start gap-2 text-xs text-muted"><ArrowUpRight size={16} className="text-emerald-500" />Kirim <b className="ml-auto break-words text-right text-[var(--text)]">{formatMoney(stats.monthIncome, data.settings.currency)}</b></p><p className="mt-4 flex items-start gap-2 text-xs text-muted"><ArrowDownRight size={16} className="text-rose-400" />Chiqim <b className="ml-auto break-words text-right text-[var(--text)]">{formatMoney(stats.monthExpenses, data.settings.currency)}</b></p><div className="mt-5 border-t border-[var(--line)] pt-4"><p className="text-[10px] text-muted">Sof natija</p><p className="mt-2 break-words text-xl font-bold">{formatMoney(stats.monthIncome - stats.monthExpenses, data.settings.currency)}</p></div></section>
    </div>
    <details className="portal-panel md:hidden"><summary className="cursor-pointer text-sm font-semibold">Kabinet menyusi va hisob amallari</summary><div className="mt-4"><MobileCabinetMenu /></div></details>
  </div>;
}
