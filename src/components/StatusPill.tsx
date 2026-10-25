import type { ReactNode } from 'react';

const styles: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-800', available: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-stone-200 text-stone-700', pending: 'bg-amber-100 text-amber-800',
  cleaning: 'bg-sky-100 text-sky-800', rejected: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-stone-200 text-stone-700', occupied: 'bg-[#f2e7d4] text-[#785b2d]',
  maintenance: 'bg-rose-100 text-rose-800', income: 'bg-emerald-100 text-emerald-800',
  expense: 'bg-rose-100 text-rose-800',
};

export function StatusPill({ status, children }: { status: string; children?: ReactNode }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status] ?? 'bg-stone-100 text-stone-700'}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{children ?? status}
  </span>;
}
