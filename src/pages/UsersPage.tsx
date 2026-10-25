import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { recordAudit } from '../services/hotelUtils';

export function UsersPage() {
  const { data, updateData } = useAppData();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [query, setQuery] = useState('');
  const users = data.users.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query.toLowerCase()));
  function toggleActive(id: string) {
    if (user?.role !== 'admin') return;
    if (id === user.id) { error('O‘z hisobingizni bu yerdan bloklay olmaysiz.'); return; }
    updateData((current) => ({ ...current, users: current.users.map((item) => item.id === id ? { ...item, isActive: !item.isActive } : item), auditLog: recordAudit(current, 'Hisob holati o‘zgartirildi', 'user', id, user.id).slice(0, 500) }));
    success('Foydalanuvchi holati yangilandi.');
  }
  return <div><PageHeader eyebrow="Kiruvchilar boshqaruvi" title="Foydalanuvchilar" description="Shu brauzerda saqlangan hisoblar va kirish tarixi. Boshqa qurilmalar yoki jonli online holati bu demo orqali kuzatilmaydi." />
    <div className="mb-5 grid grid-cols-3 gap-3">{[['Hisoblar', data.users.length], ['Faol hisoblar', data.users.filter((item) => item.isActive).length], ['Kirgan hisoblar', data.users.filter((item) => item.lastLoginAt).length]].map(([label, value]) => <div key={label} className="surface rounded-2xl p-4"><p className="text-xs text-muted">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</div>
    <section className="surface overflow-hidden rounded-3xl"><div className="border-b border-[var(--line)] p-4"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ism yoki email bo‘yicha qidirish" className="field" /></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-[var(--page)] text-[10px] uppercase text-muted"><tr>{['Foydalanuvchi','Rol','Holat','Ro‘yxatdan o‘tgan','Oxirgi kirish','Amal'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{users.map((item) => <tr key={item.id} className="border-t border-[var(--line)] text-xs"><td className="px-4 py-4 font-semibold">{item.name}<span className="block text-[10px] font-normal text-muted">{item.email}</span></td><td className="px-4 py-4"><span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} />{item.role}</span></td><td className="px-4 py-4">{item.isActive ? 'Faol' : 'Bloklangan'}</td><td className="px-4 py-4">{new Date(item.createdAt).toLocaleDateString('uz-UZ')}</td><td className="px-4 py-4">{item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString('uz-UZ') : 'Hali qayd etilmagan'}</td><td className="px-4 py-4"><button disabled={item.id === user?.id} onClick={() => toggleActive(item.id)} className="secondary-button disabled:opacity-40">{item.isActive ? 'Bloklash' : 'Faollashtirish'}</button></td></tr>)}</tbody></table>{!users.length && <p className="p-6 text-center text-sm text-muted">Hisob topilmadi.</p>}</div></section>
    <section className="surface mt-6 rounded-3xl p-5"><h2 className="font-display text-2xl">Faoliyat tarixi</h2><div className="mt-4 max-h-96 overflow-y-auto divide-y divide-[var(--line)]">{data.auditLog.slice(0, 50).map((entry) => <div key={entry.id} className="flex flex-wrap justify-between gap-2 py-3 text-xs"><div><p className="font-semibold">{entry.action}</p><p className="mt-1 text-muted">{data.users.find((item) => item.id === entry.userId)?.name ?? 'Tizim'} · {entry.entityType}</p></div><time className="text-muted">{new Date(entry.createdAt).toLocaleString('uz-UZ')}</time></div>)}{!data.auditLog.length && <p className="py-4 text-xs text-muted">Hali faoliyat qayd etilmagan.</p>}</div></section>
  </div>;
}
