import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';

export function UsersPage() {
  const { data, updateData } = useAppData();
  const { success } = useToast();
  const [query, setQuery] = useState('');
  const users = data.users.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query.toLowerCase()));

  function toggleActive(id: string) {
    updateData((current) => ({ ...current, users: current.users.map((item) => item.id === id ? { ...item, isActive: !item.isActive } : item) }));
    success('Foydalanuvchi holati yangilandi.');
  }

  return <div><PageHeader eyebrow="Kiruvchilar boshqaruvi" title="Foydalanuvchilar" description="Hisoblar va rollarni boshqarish." />
    <section className="surface overflow-hidden rounded-3xl"><div className="border-b border-[var(--line)] p-4"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ism yoki email bo‘yicha qidirish" className="w-full rounded-full border border-[var(--line)] bg-[var(--page)] px-4 py-2.5 text-sm" /></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead className="bg-[var(--page)] text-[10px] uppercase text-muted"><tr><th className="px-5 py-3">Foydalanuvchi</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Holat</th><th className="px-5 py-3 text-right">Amal</th></tr></thead><tbody>{users.map((item) => <tr key={item.id} className="border-t border-[var(--line)] text-xs"><td className="px-5 py-4 font-semibold">{item.name}<span className="block text-[10px] font-normal text-muted">{item.email}</span></td><td className="px-4 py-4"><span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} />{item.role}</span></td><td className="px-4 py-4">{item.isActive ? 'Faol' : 'Nofaol'}</td><td className="px-5 py-4 text-right"><button onClick={() => toggleActive(item.id)} className="rounded-full border border-[var(--line)] px-3 py-2 text-[10px]">{item.isActive ? 'Nofaol qilish' : 'Faollashtirish'}</button></td></tr>)}</tbody></table></div></section>
  </div>;
}
