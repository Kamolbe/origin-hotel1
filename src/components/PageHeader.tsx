import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-heading mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && <p className="mb-2 text-[10px] font-bold uppercase tracking-[.24em] text-champagne">{eyebrow}</p>}
      <h1 className="font-display text-3xl font-medium sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
    </div>
    {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
  </div>;
}
