import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';

const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parse = (value: string) => new Date(`${value}T12:00:00`);

export function DatePicker({ label, value, min, onChange }: { label: string; value: string; min?: string; onChange: (value: string) => void }) {
  const { i18n } = useTranslation();
  const locale = i18n.language || 'uz';
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = iso(new Date());
  const select = (date: string) => { onChange(date); setOpen(false); };
  return <>
    <button type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={open} className="field flex h-12 min-w-0 items-center justify-between gap-2 text-left" onClick={() => { setMonth(value ? parse(value) : min ? parse(min) : new Date()); setOpen(true); }}><span className={value ? 'truncate' : 'truncate text-muted'}>{value ? parse(value).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sanani tanlang'}</span><CalendarDays size={17} className="shrink-0 text-champagne" /></button>
    <Modal open={open} onClose={() => setOpen(false)} title={label} description="Safaringiz uchun sanani tanlang">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-5 flex items-center justify-between gap-3"><button type="button" aria-label="Oldingi oy" className="secondary-button !p-2.5" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} /></button><p aria-live="polite" className="text-sm font-semibold capitalize">{month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</p><button type="button" aria-label="Keyingi oy" className="secondary-button !p-2.5" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></button></div>
        <div className="grid grid-cols-7 gap-1 text-center">{Array.from({ length: 7 }, (_, index) => <span key={index} className="py-2 text-[10px] font-semibold text-muted">{new Date(2026, 0, 5 + index).toLocaleDateString(locale, { weekday: 'short' })}</span>)}{Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: days }, (_, index) => { const date = iso(new Date(month.getFullYear(), month.getMonth(), index + 1)); return <button key={date} type="button" aria-label={date} aria-pressed={date === value} aria-current={date === today ? 'date' : undefined} disabled={Boolean(min && date < min)} onClick={() => select(date)} className={`aspect-square rounded-xl text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-champagne disabled:cursor-not-allowed disabled:opacity-25 ${date === value ? 'bg-ink text-white' : date === today ? 'bg-champagne/20 text-[var(--text)]' : 'hover:bg-champagne/15'}`}>{index + 1}</button>; })}</div>
        <div className="mt-5 flex justify-between gap-3 border-t border-[var(--line)] pt-4"><button type="button" className="secondary-button" onClick={() => select('')}>Tozalash</button><button type="button" disabled={Boolean(min && today < min)} className="primary-button disabled:opacity-30" onClick={() => select(today)}>Bugun</button></div>
      </div>
    </Modal>
  </>;
}
