import type { LucideIcon } from 'lucide-react';

export function StatCard({ label, value, icon: Icon, detail, trend, accent = false }: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  detail?: string;
  trend?: number;
  accent?: boolean;
}) {
  return <article className={`surface stat-card rounded-2xl p-4 sm:p-5 ${accent ? 'stat-card-accent' : ''}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="truncate text-[10px] font-semibold text-muted sm:text-xs">{label}</p><p className="mt-3 font-display text-3xl sm:text-4xl">{value}</p>{detail && <p className="mt-1 text-[10px] text-muted">{detail}</p>}</div>
      <span className="rounded-xl bg-[var(--page)] p-2.5 text-champagne"><Icon size={17} /></span>
    </div>
  </article>;
}
