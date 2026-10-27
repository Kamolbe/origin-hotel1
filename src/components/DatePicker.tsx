import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parse = (value: string) => new Date(`${value}T12:00:00`);

export function DatePicker({ label, value, min, max, required = false, onChange }: { label: string; value: string; min?: string; max?: string; required?: boolean; onChange: (value: string) => void }) {
  const { i18n } = useTranslation();
  const reduced = usePrefersReducedMotion();
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const popupId = useId();
  const [position, setPosition] = useState({ top: 0, left: 0, width: 280 });
  const locale = i18n.language || 'uz';
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = iso(new Date());
  const select = (date: string) => { onChange(date); setOpen(false); trigger.current?.focus(); };
  function place() {
    if (!trigger.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const width = Math.min(280, window.innerWidth - 16);
    const height = popup.current?.offsetHeight ?? 370;
    const below = window.innerHeight - rect.bottom - 8;
    const top = below >= height ? rect.bottom + 6 : rect.top >= height + 8 ? rect.top - height - 6 : Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - height - 8));
    setPosition({ top, left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)), width });
  }
  useLayoutEffect(() => { if (open) place(); }, [open, month]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!trigger.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) setOpen(false); };
    const reposition = (event: Event) => { if (!popup.current?.contains(event.target as Node)) place(); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); } };
    const frame = requestAnimationFrame(() => { const selected = popup.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]:not([disabled])'); (selected ?? popup.current?.querySelector<HTMLButtonElement>('button[aria-pressed]:not([disabled])'))?.focus({ preventScroll: true }); });
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('keydown', escape, true);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', reposition); window.removeEventListener('scroll', reposition, true); window.removeEventListener('keydown', escape, true); };
  }, [open]);
  return <>
    <button ref={trigger} type="button" aria-label={label} aria-controls={open ? popupId : undefined} aria-haspopup="dialog" aria-expanded={open} className="field flex h-12 min-w-0 items-center justify-between gap-2 text-left" onClick={() => { if (open) { setOpen(false); return; } setMonth(value ? parse(value) : min ? parse(min) : new Date()); place(); setOpen(true); }}><span className={value ? 'truncate' : 'truncate text-muted'}>{value ? parse(value).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sanani tanlang'}</span><CalendarDays size={17} className="shrink-0 text-champagne" /></button>
    {createPortal(<AnimatePresence>{open && <motion.div ref={popup} id={popupId} role="dialog" aria-modal={false} aria-label={`${label} kalendari`} initial={reduced ? false : { opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: .98 }} transition={{ duration: reduced ? 0 : .24 }} style={{ ...position, maxHeight: 'calc(100dvh - 16px)' }} className="hotel-calendar-popover fixed z-[180] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[var(--text)] shadow-lift" onKeyDown={(event) => { if (event.key === 'Tab' && !trigger.current?.closest('[role="dialog"]')) { const buttons = Array.from(popup.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? []); const boundary = event.shiftKey ? buttons[0] : buttons.at(-1); if (document.activeElement === boundary) { event.preventDefault(); setOpen(false); trigger.current?.focus(); } } }}>
        <p className="mb-2 px-1 text-[10px] font-semibold text-muted">{label}</p>
        <div className="mb-2 flex items-center justify-between gap-3"><button type="button" aria-label="Oldingi oy" className="secondary-button !p-2" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} /></button><p aria-live="polite" className="text-sm font-semibold capitalize">{month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</p><button type="button" aria-label="Keyingi oy" className="secondary-button !p-2" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></button></div>
        <div className="grid grid-cols-7 gap-1 text-center">{Array.from({ length: 7 }, (_, index) => <span key={index} className="py-2 text-[10px] font-semibold text-muted">{new Date(2026, 0, 5 + index).toLocaleDateString(locale, { weekday: 'short' })}</span>)}{Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: days }, (_, index) => { const date = iso(new Date(month.getFullYear(), month.getMonth(), index + 1)); return <button key={date} type="button" aria-label={date} aria-pressed={date === value} aria-current={date === today ? 'date' : undefined} disabled={Boolean((min && date < min) || (max && date > max))} onClick={() => select(date)} className={`h-8 rounded-lg text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-champagne disabled:cursor-not-allowed disabled:opacity-25 ${date === value ? 'bg-ink text-white' : date === today ? 'bg-champagne/20 text-[var(--text)]' : 'hover:bg-champagne/15'}`}>{index + 1}</button>; })}</div>
        <div className="mt-2 flex justify-between gap-3 border-t border-[var(--line)] pt-2">{!required && <button type="button" className="secondary-button" onClick={() => select('')}>Tozalash</button>}<button type="button" disabled={Boolean((min && today < min) || (max && today > max))} className="primary-button disabled:opacity-30" onClick={() => select(today)}>Bugun</button></div>
    </motion.div>}</AnimatePresence>, trigger.current?.closest('[role="dialog"]') ?? document.body)}
  </>;
}
