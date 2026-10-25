import { Select } from '../Select';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function isoDate(daysFromToday: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

/**
 * Availability widget in the hero. It hands the chosen dates to the guest
 * area — the rooms page reads them from the router state after sign-in.
 */
export function BookingSearch({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(() => isoDate(1));
  const [checkOut, setCheckOut] = useState(() => isoDate(3));
  const [guests, setGuests] = useState('2');
  const [error, setError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkIn || !checkOut || checkOut <= checkIn) { setError(t('landing.searchDatesError')); return; }
    setError('');
    navigate('/login', { state: { from: '/app/rooms', bookingSearch: { checkIn, checkOut, guests } } });
  }

  const fieldClass = 'w-full rounded-xl border border-[var(--line)] bg-[var(--page)] text-[var(--text)] px-3.5 py-3 text-xs outline-none transition focus:border-champagne';

  return <form onSubmit={submit} className={`booking-search surface text-[var(--text)] w-full rounded-3xl p-5 shadow-lift sm:p-6 ${className}`}>
    <p className="text-[10px] font-bold uppercase tracking-[.22em] text-champagne">{t('landing.searchTitle')}</p>
    <p className="mt-2 text-xs leading-6 text-muted">{t('landing.searchHint')}</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-muted"><CalendarDays size={12} className="text-champagne" />{t('landing.checkIn')}</span>
        <input type="date" required value={checkIn} min={isoDate(0)} onChange={(event) => { setCheckIn(event.target.value); setError(''); }} className={fieldClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-muted"><CalendarDays size={12} className="text-champagne" />{t('landing.checkOut')}</span>
        <input type="date" required value={checkOut} min={checkIn} onChange={(event) => { setCheckOut(event.target.value); setError(''); }} className={fieldClass} />
      </label>
    </div>
    <label className="mt-3 block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-muted"><Users size={12} className="text-champagne" />{t('landing.guests')}</span>
      <Select value={guests} onChange={(event) => setGuests(event.target.value)} className={fieldClass}>
        {['1', '2', '3', '4'].map((count) => <option key={count} value={count}>{count}</option>)}
      </Select>
    </label>
    {error && <p role="alert" className="mt-3 rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-[11px] font-medium text-danger">{error}</p>}
    <button type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-champagne px-5 py-3.5 text-xs font-bold text-ink transition hover:bg-ink hover:text-white">
      {t('landing.searchAction')}<ArrowRight size={14} />
    </button>
  </form>;
}
