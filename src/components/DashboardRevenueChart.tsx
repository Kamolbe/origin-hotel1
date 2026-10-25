import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney } from '../services/hotelUtils';
import type { AppSettings } from '../types';

type RevenuePoint = { label: string; income: number; expense: number };

export default function DashboardRevenueChart({ data, currency }: { data: RevenuePoint[]; currency: AppSettings['currency'] }) {
  return <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
      <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b99a68" stopOpacity={.27} /><stop offset="95%" stopColor="#b99a68" stopOpacity={0} /></linearGradient></defs>
      <CartesianGrid stroke="var(--line)" strokeDasharray="3 5" vertical={false} />
      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} />
      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 9 }} tickFormatter={(value) => `${Math.round(value / 1000000)}m`} />
      <Tooltip formatter={(value) => formatMoney(Number(value), currency)} contentStyle={{ borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text)', fontSize: 11 }} />
      <Area type="monotone" dataKey="income" name="Kirim" stroke="#b99a68" strokeWidth={2.5} fill="url(#revenueFill)" />
      <Area type="monotone" dataKey="expense" name="Chiqim" stroke="#7b8d95" strokeWidth={1.7} fill="transparent" />
    </AreaChart>
  </ResponsiveContainer>;
}
