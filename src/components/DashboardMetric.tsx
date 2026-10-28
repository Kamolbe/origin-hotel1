import type { LucideIcon } from 'lucide-react';
export function DashboardMetric({ label, value, detail, icon: Icon, tone = 'blue' }: { label: string; value: string | number; detail: string; icon: LucideIcon; tone?: 'blue' | 'green' | 'amber' | 'violet' }) {
  return <article className={`portal-metric portal-tone-${tone}`}><div className="flex items-center gap-2.5"><span className="portal-metric-icon"><Icon size={18} /></span><h2 className="min-w-0 text-xs font-semibold text-muted">{label}</h2></div><p className="mt-4 break-words text-2xl font-bold tracking-tight sm:text-3xl">{value}</p><p className="mt-2 text-[11px] leading-5 text-muted">{detail}</p></article>;
}
