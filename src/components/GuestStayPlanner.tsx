import { Select } from './Select';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, Check, Moon } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { useAppData } from '../context/AppDataContext';
import { hotelToday } from '../services/dashboardMetrics';
import { availableRooms, formatMoney } from '../services/hotelUtils';
import { validStayDates } from '../services/hotelOperations';

function afterDays(date: string, days: number) {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function GuestStayPlanner() {
  const { data } = useAppData();
  const today = hotelToday(data.settings.timeZone);
  const [arrival, setArrival] = useState(today);
  const [nights, setNights] = useState(2);
  const [guests, setGuests] = useState(2);
  const departure = arrival ? afterDays(arrival, nights) : '';
  const valid = arrival >= today && validStayDates(arrival, departure);
  const rooms = valid ? availableRooms(data, arrival, departure, guests) : [];
  const lowestPrice = rooms.length ? Math.min(...rooms.map((room) => room.pricePerNight)) : null;
  const control = 'min-h-11 w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--page)] px-3 text-xs text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portal-blue)]';

  return <section aria-labelledby="stay-planner-title" className="portal-panel guest-stay-planner">
    <div className="flex items-start justify-between gap-3">
      <div><p className="portal-eyebrow">Keyingi safaringiz uchun</p><h2 id="stay-planner-title" className="portal-section-title">Safar byudjetini hisoblang</h2></div>
      <span className="portal-action-icon shrink-0"><Calculator size={20} /></span>
    </div>
    <p className="mt-2 text-xs leading-6 text-muted">Sanalar va mehmonlar soniga mos xonalar narxini oldindan bilib oling.</p>
    <div className="mt-4 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="col-span-2 min-w-0 sm:col-span-1"><span className="mb-2 block text-[10px] font-semibold text-muted">Kelish sanasi</span><DatePicker label="Safar uchun kelish sanasi" value={arrival} min={today} onChange={setArrival} /></div>
      <label className="min-w-0"><span className="mb-2 block text-[10px] font-semibold text-muted">Davomiyligi</span><Select className={control} value={nights} onChange={(event) => setNights(Number(event.target.value))}>{[1, 2, 3, 4, 5, 7, 10, 14].map((value) => <option key={value} value={value}>{value} tun</option>)}</Select></label>
      <label className="min-w-0"><span className="mb-2 block text-[10px] font-semibold text-muted">Mehmonlar</span><Select className={control} value={guests} onChange={(event) => setGuests(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value} kishi</option>)}</Select></label>
    </div>
    <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--page)] p-4" aria-live="polite" aria-atomic="true">
      <p className="text-[10px] text-muted">{lowestPrice !== null ? `${nights} tun uchun xona narxi` : 'Tanlangan safar holati'}</p>
      <p className="mt-2 break-words text-xl font-bold tracking-tight">{lowestPrice !== null ? <>{formatMoney(lowestPrice * nights, data.settings.currency)}<span className="ml-1 text-xs font-normal text-muted">dan boshlab</span></> : !valid ? 'Kelish sanasini tanlang' : 'Mos bo‘sh xona topilmadi'}</p>
      <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-5 text-muted">{rooms.length ? <Check size={13} className="mt-0.5 shrink-0 text-emerald-500" /> : <Moon size={13} className="mt-0.5 shrink-0" />}{rooms.length ? `${rooms.length} ta mos xona · Ketish: ${departure}` : 'Boshqa sana yoki mehmonlar sonini tanlab ko‘ring.'}</p>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-64 text-[10px] leading-5 text-muted">Taxminiy xona narxi. Yakuniy summa bron qilishda ko‘rsatiladi.</p>
      {valid && <Link to="/rooms" state={{ bookingSearch: { checkIn: arrival, checkOut: departure, guests: String(guests) } }} className="primary-button gap-2">Xonalarni ko‘rish<ArrowRight size={14} /></Link>}
    </div>
  </section>;
}
