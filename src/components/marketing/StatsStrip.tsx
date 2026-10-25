import { useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { HOTEL } from '../../data/marketing';
import { useAppData } from '../../context/AppDataContext';

function useCountUp(target: number, decimals: number, enabled: boolean): string {
  const [value, setValue] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled) { setValue(target); return; }
    let frame = 0;
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled]);

  return value.toFixed(decimals);
}

export function StatsStrip() {
  const { t } = useTranslation();
  const { data } = useAppData();
  const reducedMotion = usePrefersReducedMotion();
  const floors = data.rooms.reduce((highest, room) => Math.max(highest, room.floor), 0);
  const entries = [
    { label: t('landing.statRooms'), value: data.rooms.length, decimals: 0, suffix: '' },
    { label: t('landing.statFloors'), value: floors, decimals: 0, suffix: '' },
    { label: t('landing.statRating'), value: Number(HOTEL.rating), decimals: 1, suffix: '/5' },
    { label: t('landing.statSatisfaction'), value: HOTEL.satisfaction, decimals: 0, suffix: '%' },
  ];

  return <section className="border-b border-[var(--line)] bg-[var(--surface)]">
    <div className="mx-auto grid max-w-[1440px] gap-6 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-10 lg:py-12">
      {entries.map((entry) => <Counter key={entry.label} label={entry.label} value={entry.value} decimals={entry.decimals} suffix={entry.suffix} enabled={!reducedMotion} />)}
    </div>
  </section>;
}

function Counter({ label, value, decimals, suffix, enabled }: { label: string; value: number; decimals: number; suffix: string; enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, amount: .5 });
  const formatted = useCountUp(value, decimals, enabled && visible);
  return <div ref={ref} data-reveal-item className="border-l-2 border-champagne/40 pl-5">
    <p className="font-display text-4xl lg:text-5xl">{formatted}<span className="ml-1 text-2xl text-champagne">{suffix}</span></p>
    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[.14em] text-muted">{label}</p>
  </div>;
}
