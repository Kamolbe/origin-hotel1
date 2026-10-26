import { Select } from '../Select';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Users } from 'lucide-react';
import { useSiteTranslation } from '../../hooks/useSiteContent';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { scrollToSection } from '../../hooks/useBookingAction';

/** Chosen-but-not-booked dates, carried from the public search to the room details page. */
export const PENDING_SEARCH_KEY = 'origin-hotel-pending-search';

export function readPendingSearch(): { checkIn: string; checkOut: string; guests: string } | null {
  try {
    const raw = sessionStorage.getItem(PENDING_SEARCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { checkIn?: string; checkOut?: string; guests?: string };
    if (!parsed.checkIn || !parsed.checkOut) return null;
    return { checkIn: parsed.checkIn, checkOut: parsed.checkOut, guests: parsed.guests ?? '2' };
  } catch { return null; }
}

function isoDate(daysFromToday: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

/**
 * Availability widget in the hero. Signed-in guests hand the chosen dates
 * straight to the rooms page; visitors stay on the public site and the dates
 * are remembered until they open a booking.
 */
export function BookingSearch({ className = '' }: { className?: string }) {
  const { t } = useSiteTranslation();
  const { user } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(() => isoDate(1));
  const [checkOut, setCheckOut] = useState(() => isoDate(3));
  const [guests, setGuests] = useState('2');
  const [error, setError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkIn || !checkOut || checkOut <= checkIn) { setError(t('landing.searchDatesError')); return; }
    setError('');
    const bookingSearch = { checkIn, checkOut, guests };
    // A visitor without an account keeps the public site: the dates are remembered
    // and the room showcase is brought into view instead of jumping to sign-in.
    if (!user) {
      try { sessionStorage.setItem(PENDING_SEARCH_KEY, JSON.stringify(bookingSearch)); } catch { /* Dates stay in the form. */ }
      success('Sanalaringiz saqlandi — xonani tanlab, bron qilishda davom eting.');
      scrollToSection('rooms');
      return;
    }
    navigate('/app/rooms', { state: { bookingSearch } });
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
