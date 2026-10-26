/**
 * Loading placeholders that mirror the real layout, so a lazily loaded page
 * settles into place without the layout jumping. The marketing skeleton copies
 * the public site (hero + rooms grid), the dashboard skeleton copies the app
 * shell (sidebar + stat cards + table).
 */

function Line({ className }: { className: string }) {
  return <span className={`skeleton block rounded-full ${className}`} />;
}

function RoomCardSkeleton() {
  return <div className="surface rounded-3xl p-0">
    <div className="skeleton aspect-[16/11] w-full rounded-t-3xl" />
    <div className="space-y-3 p-6">
      <Line className="h-2.5 w-24" />
      <Line className="h-3 w-3/4" />
      <Line className="h-2.5 w-1/2" />
      <div className="flex items-center justify-between border-t border-[var(--line)] pt-5">
        <Line className="h-6 w-28" />
        <Line className="h-9 w-24 rounded-full" />
      </div>
    </div>
  </div>;
}

export function MarketingRouteSkeleton() {
  return <div role="status" aria-busy="true" className="marketing-page min-h-screen bg-[var(--page)]">
    <span className="sr-only">Sahifa yuklanmoqda…</span>
    <div className="border-b border-[var(--line)] bg-[var(--page)]/90">
      <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between gap-4 px-5 lg:px-10">
        <Line className="h-7 w-40" />
        <div className="hidden items-center gap-6 lg:flex"><Line className="h-3 w-16" /><Line className="h-3 w-20" /><Line className="h-3 w-16" /><Line className="h-3 w-14" /></div>
        <Line className="h-10 w-32 rounded-full" />
      </div>
    </div>
    <div className="relative isolate overflow-hidden bg-ink" aria-hidden="true">
      <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-5 py-20 lg:grid-cols-[1.15fr_.85fr] lg:gap-16 lg:px-10 lg:py-28">
        <div className="space-y-5">
          <Line className="h-7 w-56 rounded-full opacity-25" />
          <Line className="h-12 w-full max-w-xl opacity-25" />
          <Line className="h-12 w-2/3 opacity-25" />
          <Line className="h-3 w-full max-w-md opacity-20" />
          <div className="flex gap-3 pt-3"><Line className="h-12 w-44 rounded-full opacity-25" /><Line className="h-12 w-40 rounded-full opacity-20" /></div>
        </div>
        <div className="surface rounded-3xl p-6">
          <Line className="h-2.5 w-32" />
          <Line className="mt-4 h-3 w-full" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><Line className="h-12 w-full rounded-xl" /><Line className="h-12 w-full rounded-xl" /></div>
          <Line className="mt-3 h-12 w-full rounded-xl" />
          <Line className="mt-4 h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
    <div className="border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-[1440px] gap-6 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-10 lg:py-12">
        {[0, 1, 2, 3].map((item) => <div key={item} className="space-y-3 border-l-2 border-champagne/40 pl-5"><Line className="h-9 w-24" /><Line className="h-3 w-28" /></div>)}
      </div>
    </div>
    <div className="mx-auto max-w-[1440px] px-5 py-20 lg:px-10 lg:py-24">
      <div className="max-w-2xl space-y-4"><Line className="h-2.5 w-40" /><Line className="h-9 w-72 max-w-full" /><Line className="h-3 w-full" /></div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <RoomCardSkeleton key={item} />)}</div>
    </div>
  </div>;
}

export function DashboardRouteSkeleton() {
  return <div role="status" aria-busy="true" className="hotel-dashboard min-h-screen bg-[var(--page)]">
    <span className="sr-only">Sahifa yuklanmoqda…</span>
    <div className="xl:pl-[244px]">
      <div className="border-b border-[var(--line)] bg-[var(--page)]/90">
        <div className="flex h-[72px] items-center justify-between gap-3 px-4 sm:px-7"><Line className="h-9 w-56" /><div className="flex items-center gap-2"><Line className="h-9 w-9 rounded-full" /><Line className="h-9 w-32 rounded-full" /><Line className="h-9 w-9 rounded-full" /></div></div>
      </div>
      <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-7 sm:py-9">
        <div className="page-heading space-y-3 pb-6"><Line className="h-2.5 w-40" /><Line className="h-8 w-64 max-w-full" /><Line className="h-3 w-full max-w-lg" /></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="surface rounded-3xl p-6"><Line className="h-2.5 w-24" /><Line className="mt-4 h-8 w-20" /><Line className="mt-3 h-2.5 w-28" /></div>)}</div>
        <div className="surface mt-5 overflow-hidden rounded-3xl">
          <div className="border-b border-[var(--line)] px-5 py-4"><Line className="h-5 w-44" /></div>
          <div className="divide-y divide-[var(--line)]">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="flex items-center gap-4 px-5 py-4"><Line className="h-4 w-32" /><Line className="h-3 w-40" /><Line className="ml-auto h-3 w-24" /></div>)}</div>
        </div>
      </div>
    </div>
  </div>;
}
