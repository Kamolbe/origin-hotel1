import { useId } from 'react';
import { financeCategories, financeCategoryLabels } from '../services/hotelOperations';
import { formatMoney } from '../services/hotelUtils';
import type { Currency, FinanceEntry, FinanceType } from '../types';

/** Uses the report's filtered ledger, so each share matches its period totals. */
export function FinanceStructure({ entries, currency }: { entries: FinanceEntry[]; currency: Currency }) {
  return <div className="mt-5 grid gap-5 lg:grid-cols-2">
    <StructureCard entries={entries} currency={currency} type="income" />
    <StructureCard entries={entries} currency={currency} type="expense" />
  </div>;
}

function StructureCard({ entries, currency, type }: { entries: FinanceEntry[]; currency: Currency; type: FinanceType }) {
  const titleId = useId();
  const income = type === 'income';
  const records = entries.filter((entry) => entry.type === type);
  const total = records.reduce((sum, entry) => sum + entry.amount, 0);
  // Retain historical categories as well as the five current categories.
  const categories = [...new Set([...financeCategories[type], ...records.map((entry) => entry.category)])];
  const color = income ? 'bg-blue-500' : 'bg-rose-500';
  return <section aria-labelledby={titleId} className="surface min-w-0 rounded-3xl p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id={titleId} className="flex items-center gap-2.5 text-sm font-bold"><span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />{income ? 'Kirim tarkibi' : 'Chiqim tarkibi'}</h2>
      <span className="text-xs font-semibold tabular-nums">{formatMoney(total, currency)}</span>
    </div>
    <p className="mt-2 text-[11px] leading-5 text-muted">Tanlangan davrdagi {income ? 'kirimlar' : 'chiqimlar'} bo‘yicha ulush.</p>
    <div className="mt-5 space-y-4">{categories.map((category) => {
      const amount = records.filter((entry) => entry.category === category).reduce((sum, entry) => sum + entry.amount, 0);
      const share = total > 0 ? Math.min(100, Math.max(0, amount / total * 100)) : 0;
      const label = category === 'other' ? income ? 'Boshqa kirim' : 'Boshqa chiqim' : financeCategoryLabels[category];
      return <div key={category}>
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs"><span>{label}</span><span className="font-semibold tabular-nums">{formatMoney(amount, currency)} <span className="text-muted">({share.toLocaleString('uz-UZ', { maximumFractionDigits: 1 })}%)</span></span></div>
        <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={share} aria-valuetext={`${formatMoney(amount, currency)} · ${share.toFixed(1)}%`} className="h-2 overflow-hidden rounded-full bg-[var(--page)]"><div className={`h-full rounded-full ${color}`} style={{ width: `${share}%` }} /></div>
      </div>;
    })}</div>
    {!records.length && <p className="mt-4 border-t border-[var(--line)] pt-3 text-xs leading-5 text-muted">Bu davrda {income ? 'kirim' : 'chiqim'} qayd etilmagan.</p>}
  </section>;
}
