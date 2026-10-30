import { usesHotelServer } from '../services/hotelServer';
import { SearchField } from '../components/SearchField';
import { BulkDeletePanel } from '../components/BulkDeletePanel';
import { ResponsiveTable } from '../components/ResponsiveTable';
import { useMemo, useState, type FormEvent } from 'react';
import { Activity, Download, Monitor, Plus, ShieldCheck, Smartphone, Tablet, Trash2, UserPlus, Users } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import { makeId } from '../services/storage';
import { recordAudit } from '../services/hotelUtils';
import type { User, UserRole } from '../types';

const roleOptions: Array<[UserRole, string]> = [['user', 'Mehmon'], ['manager', 'Manager']];
const roleLabels: Record<UserRole, string> = { user: 'Mehmon', manager: 'Menejer', admin: 'Administrator' };
const demoCode: Partial<Record<UserRole, string>> = { admin: 'admin1234', manager: 'manager1234' };

/** Site traffic and account management for the administrator. */
export function UsersPage() {
  const { data, updateData } = useAppData();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [query, setQuery] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' as UserRole });
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);
  const [visitPage, setVisitPage] = useState(0);

  const historyPages = Math.max(1, Math.ceil(data.auditLog.length / 10));
  const currentHistoryPage = Math.min(historyPage, historyPages - 1);
  const users = data.users.filter((item) => item.role !== 'admin' && `${item.name} ${item.email}`.toLowerCase().includes(query.toLowerCase()));

  const visits = data.visits;
  const visitPages = Math.max(1, Math.ceil(visits.length / 8));
  const currentVisitPage = Math.min(visitPage, visitPages - 1);
  const pageVisits = visits.slice(currentVisitPage * 8, (currentVisitPage + 1) * 8);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyVisits = useMemo(() => visits.filter((visit) => new Date(visit.at).getTime() >= weekAgo), [visits, weekAgo]);
  const uniqueVisitors = new Set(weeklyVisits.map((visit) => visit.userId ?? `${visit.device}-${visit.browser}`)).size;
  const signedInVisits = weeklyVisits.filter((visit) => visit.userName).length;
  const deviceIcon = { Mobil: Smartphone, Planshet: Tablet, Desktop: Monitor } as const;

  function toggleActive(id: string) {
    if (user?.role !== 'manager') return;
    if (id === user.id) { error('O‘z hisobingizni bu yerdan bloklay olmaysiz.'); return; }
    updateData((current) => ({ ...current, users: current.users.map((item) => item.id === id ? { ...item, isActive: !item.isActive } : item), auditLog: recordAudit(current, 'Hisob holati o‘zgartirildi', 'user', id, user.id).slice(0, 500) }));
    success('Foydalanuvchi holati yangilandi.');
  }

  function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (user?.role !== 'manager') return;
    const email = form.email.trim().toLowerCase();
    if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || form.password.length < 6) { error('Ism, to‘g‘ri email va kamida 6 belgili parol kiriting.'); return; }
    if (data.users.some((item) => item.email.toLowerCase() === email)) { error('Bu email bilan hisob allaqachon mavjud.'); return; }
    const record: User = { id: makeId('user'), name: form.name.trim(), email, password: form.password, role: form.role, accessCode: demoCode[form.role], isActive: true, createdAt: new Date().toISOString() };
    updateData((current) => ({ ...current, users: [...current.users, record], auditLog: recordAudit(current, 'Yangi foydalanuvchi qo‘shildi', 'user', record.id, user.id, { role: record.role }).slice(0, 500) }));
    success(`${record.name} qo‘shildi.`);
    setForm({ name: '', email: '', password: '', role: 'user' });
    setAddOpen(false);
  }

  function removeUser() {
    if (!removeTarget || user?.role !== 'manager') return;
    if (removeTarget.id === user.id) { error('O‘z hisobingizni o‘chira olmaysiz.'); setRemoveTarget(null); return; }
    const admins = data.users.filter((item) => item.role === 'admin');
    if (removeTarget.role === 'admin' && admins.length <= 1) { error('Tizimda kamida bitta administrator qolishi kerak.'); setRemoveTarget(null); return; }
    updateData((current) => ({ ...current, users: current.users.filter((item) => item.id !== removeTarget.id), auditLog: recordAudit(current, 'Foydalanuvchi o‘chirildi', 'user', removeTarget.id, user.id).slice(0, 500) }));
    success(`${removeTarget.name} o‘chirildi.`);
    setRemoveTarget(null);
  }

  return <div className="animate-rise-in">
    <PageHeader eyebrow="Kiruvchilar boshqaruvi" title="Foydalanuvchilar" description={usesHotelServer() ? 'Hisoblar, serverda qayd etilgan sayt tashriflari va faoliyat tarixi.' : 'Hisoblar, sayt tashriflari va faoliyat tarixi. Tashriflar shu brauzerda qayd etiladi.'} action={user?.role === 'manager' ? <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white hover:bg-ink-soft"><Plus size={14} />Foydalanuvchi qo‘shish</button> : undefined} />

    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[['Hisoblar', data.users.length], ['Faol hisoblar', data.users.filter((item) => item.isActive).length], ['Kirgan hisoblar', data.users.filter((item) => item.lastLoginAt).length], ['7 kunlik tashrif', weeklyVisits.length]].map(([label, value]) => <div key={label} className="surface rounded-2xl p-4"><p className="text-xs text-muted">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}
    </div>

    <section className="surface mb-6 overflow-hidden rounded-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
        <div><h2 className="flex items-center gap-2 font-display text-2xl"><Activity size={18} className="text-champagne" />Sayt tashriflari</h2><p className="mt-1 text-[10px] text-muted">Kim, qaysi sahifadan kirgani va qaysi qurilmada — oxirgi 300 tashrif.</p></div>
        <div className="flex gap-3 text-center"><span className="rounded-xl bg-[var(--page)] px-4 py-2"><span className="block text-[9px] uppercase tracking-widest text-muted">Noyob mehmon</span><b className="text-sm">{uniqueVisitors}</b></span><span className="rounded-xl bg-[var(--page)] px-4 py-2"><span className="block text-[9px] uppercase tracking-widest text-muted">Hisob bilan</span><b className="text-sm">{signedInVisits}</b></span></div>
      </div>
      {pageVisits.length === 0 ? <p className="p-6 text-center text-sm text-muted">Hali tashrif qayd etilmagan.</p> : <div className="divide-y divide-[var(--line)]">
        {pageVisits.map((visit) => { const Icon = deviceIcon[visit.device]; return <div key={visit.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-xs">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-champagne/12 text-champagne"><Icon size={16} /></span>
          <span className="min-w-[140px] flex-1"><b className="block">{visit.userName ?? 'Mehmon (hisobsiz)'}</b><span className="text-[10px] text-muted">{visit.userRole ? roleLabels[visit.userRole] : 'Tashrifchi'} · {visit.browser} · {visit.device}</span></span>
          <span className="rounded-full bg-[var(--page)] px-3 py-1.5 font-mono text-[10px] text-muted">{visit.path}</span>
          <time className="text-[10px] text-muted">{new Date(visit.at).toLocaleString('uz-UZ')}</time>
        </div>; })}
      </div>}
      {visitPages > 1 && <nav aria-label="Tashrif sahifalari" className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-3"><button type="button" disabled={currentVisitPage === 0} onClick={() => setVisitPage(currentVisitPage - 1)} className="secondary-button disabled:opacity-40">Oldingi</button><span className="text-xs text-muted">{currentVisitPage + 1} / {visitPages}</span><button type="button" disabled={currentVisitPage + 1 >= visitPages} onClick={() => setVisitPage(currentVisitPage + 1)} className="secondary-button disabled:opacity-40">Keyingi</button></nav>}
    </section>

    <section className="surface overflow-hidden rounded-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] p-4">
        <h2 className="flex items-center gap-2 font-display text-2xl"><Users size={18} className="text-champagne" />Hisoblar</h2>
        <SearchField value={query} onChange={setQuery} label="Foydalanuvchilarni qidirish" placeholder="Ism yoki email bo‘yicha qidirish" className="w-full sm:max-w-xs" />
      </div>
    {user?.role === 'manager' && <BulkDeletePanel subject="ta foydalanuvchi" items={users.filter((item) => item.id !== user.id && item.role !== 'admin').map((item) => ({ id: item.id, label: `${item.name} · ${item.email}` }))} note="O‘z hisobingiz va administratorlar guruhlab o‘chirilmaydi. Joriy qidiruv natijalari belgilanadi." onDelete={(ids) => { if (user.role !== 'manager') return; updateData((current) => ({ ...current, users: current.users.filter((item) => !ids.includes(item.id) || item.id === user.id || item.role === 'admin'), auditLog: recordAudit(current, 'Belgilangan foydalanuvchilar o‘chirildi', 'user', ids.join(','), user.id).slice(0, 500) })); success('Belgilangan foydalanuvchilar o‘chirildi.'); }} />}
      <ResponsiveTable><table className="w-full min-w-[880px] text-left"><thead className="bg-[var(--page)] text-[10px] uppercase text-muted"><tr>{['Foydalanuvchi', 'Rol', 'Holat', 'Ro‘yxatdan o‘tgan', 'Oxirgi kirish', 'Amallar'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{users.map((item) => <tr key={item.id} className="border-t border-[var(--line)] text-xs">
        <td className="px-4 py-4 font-semibold">{item.name}<span className="block text-[10px] font-normal text-muted">{item.email}</span></td>
        <td className="px-4 py-4"><span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} />{roleLabels[item.role]}</span></td>
        <td className="px-4 py-4">{item.isActive ? 'Faol' : 'Bloklangan'}</td>
        <td className="px-4 py-4">{new Date(item.createdAt).toLocaleDateString('uz-UZ')}</td>
        <td className="px-4 py-4">{item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString('uz-UZ') : 'Hali qayd etilmagan'}</td>
        <td className="px-4 py-4"><div className="flex justify-end gap-1">
          <button disabled={item.id === user?.id} onClick={() => toggleActive(item.id)} className="secondary-button disabled:opacity-40">{item.isActive ? 'Bloklash' : 'Faollashtirish'}</button>
          {user?.role === 'manager' && <button disabled={item.id === user.id} onClick={() => setRemoveTarget(item)} title="O‘chirish" className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"><Trash2 size={15} /></button>}
        </div></td>
      </tr>)}</tbody></table>{!users.length && <p className="p-6 text-center text-sm text-muted">Hisob topilmadi.</p>}</ResponsiveTable>
    </section>

    <section className="surface mt-6 rounded-3xl p-5">
      <h2 className="flex items-center gap-2 font-display text-2xl"><Download size={18} className="text-champagne" />Faoliyat tarixi</h2>
      <div className="mt-4 divide-y divide-[var(--line)]">{data.auditLog.slice(currentHistoryPage * 10, (currentHistoryPage + 1) * 10).map((entry) => <div key={entry.id} className="flex flex-wrap justify-between gap-2 py-3 text-xs"><div><p className="font-semibold">{entry.action}</p><p className="mt-1 text-muted">{data.users.find((item) => item.id === entry.userId)?.name ?? 'Tizim'} · {entry.entityType}</p></div><time className="text-muted">{new Date(entry.createdAt).toLocaleString('uz-UZ')}</time></div>)}{!data.auditLog.length && <p className="py-4 text-xs text-muted">Hali faoliyat qayd etilmagan.</p>}</div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4"><button type="button" className="secondary-button disabled:opacity-40" disabled={currentHistoryPage === 0} onClick={() => setHistoryPage(currentHistoryPage - 1)}>Oldingi</button><span className="text-xs text-muted">{currentHistoryPage + 1} / {historyPages}</span><button type="button" className="secondary-button disabled:opacity-40" disabled={currentHistoryPage + 1 >= historyPages} onClick={() => setHistoryPage(currentHistoryPage + 1)}>Keyingi</button></div>
    </section>

    <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Foydalanuvchi qo‘shish" description="Yangi hisob darhol tizimga kirishi mumkin.">
      <form onSubmit={addUser} className="grid gap-4">
        <label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-muted">To‘liq ism</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required className="field" placeholder="Aziza Karimova" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-muted">Email</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required className="field" placeholder="ism@origin.uz" /></label>
          <label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-muted">Parol (kamida 6 belgi)</span><input type="text" minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required className="field" placeholder="••••••" /></label>
        </div>
        <label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-muted">Rol</span><Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} className="field">{roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
        {!usesHotelServer() && <p className="flex gap-2 rounded-xl bg-[var(--page)] p-3 text-[10px] leading-5 text-muted"><UserPlus size={13} className="mt-0.5 shrink-0 text-champagne" />Administrator va menejer hisoblari uchun demo kirish kodlari ishlatiladi (admin1234 / manager1234).</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={() => setAddOpen(false)} className="secondary-button">Bekor qilish</button><button className="primary-button">Hisob qo‘shish</button></div>
      </form>
    </Modal>

    <Modal open={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Hisobni o‘chirish" description={`${removeTarget?.name ?? ''} hisobi va uning kirish huquqi o‘chiriladi.`}>
      <div className="flex justify-end gap-2"><button onClick={() => setRemoveTarget(null)} className="secondary-button">Bekor qilish</button><button onClick={removeUser} className="inline-flex items-center gap-2 rounded-full bg-danger px-4 py-2.5 text-xs font-semibold text-white"><Trash2 size={14} />O‘chirish</button></div>
    </Modal>
  </div>;
}
