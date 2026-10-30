import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Pencil, Plus, Trash2, Users, WalletCards } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { DashboardMetric } from '../components/DashboardMetric';
import { DatePicker } from '../components/DatePicker';
import { SearchField } from '../components/SearchField';
import { formatMoney } from '../services/hotelUtils';
import { hotelToday } from '../services/dashboardMetrics';
import { salaryDues } from '../services/payroll';
import { usesHotelServer } from '../services/hotelServer';
import { makeId } from '../services/storage';
import type { StaffMember } from '../types';

export function StaffPage() {
  const { data, updateData, serverStatus } = useAppData();
  const { user } = useAuth();
  const { error } = useToast();
  const today = hotelToday(data.settings.timeZone);
  const blank = () => ({ name: '', jobTitle: '', phone: '+998', email: '', monthlySalary: '', startDate: today, payday: '1', notes: '', isActive: true });
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const employees = data.employees ?? [];
  const payments = data.salaryPayments ?? [];
  const visible = employees.filter((employee) => `${employee.name} ${employee.jobTitle} ${employee.phone}`.toLowerCase().includes(query.toLowerCase()));
  const active = employees.filter((employee) => employee.isActive);
  const dues = salaryDues(employees, payments, today);
  const money = (amount: number) => formatMoney(amount, data.settings.currency);
  const busy = serverStatus === 'saving';
  function save(event: FormEvent) {
    event.preventDefault();
    const phone = form.phone.replace(/[\s()-]/g, '');
    if (!form.name.trim() || !form.jobTitle.trim() || !/^\+?\d{9,15}$/.test(phone) || Number(form.monthlySalary) <= 0 || !Number.isFinite(Number(form.monthlySalary)) || !form.startDate || Number(form.payday) < 1 || Number(form.payday) > 31) { error('Ishchi ma’lumotlarini to‘liq va to‘g‘ri kiriting.'); return; }
    const employee: StaffMember = { ...form, name: form.name.trim(), jobTitle: form.jobTitle.trim(), phone, monthlySalary: Number(form.monthlySalary), payday: Number(form.payday), id: editing ?? makeId('employee'), createdAt: employees.find((item) => item.id === editing)?.createdAt ?? new Date().toISOString() };
    updateData((current) => ({ ...current, employees: editing ? (current.employees ?? []).map((item) => item.id === editing ? employee : item) : [employee, ...(current.employees ?? [])] }));
    setOpen(false);setEditing(null);setForm(blank());
  }
  function edit(employee: StaffMember) { setEditing(employee.id);setForm({ ...employee, monthlySalary: String(employee.monthlySalary), payday: String(employee.payday) });setOpen(true); }
  function remove() {
    updateData((current) => ({ ...current, employees: (current.employees ?? []).flatMap((employee) => !selected.includes(employee.id) ? [employee] : (current.salaryPayments ?? []).some((payment) => payment.employeeId === employee.id) ? [{ ...employee, isActive: false }] : []) }));
    setSelected([]);setDeleting(false);
  }
  function pay(employee: StaffMember, period: string) {
    const payment = { id: makeId('salary'), employeeId: employee.id, period, amount: employee.monthlySalary, paidAt: new Date().toISOString(), paidBy: user?.id };
    updateData((current) => ({ ...current, salaryPayments: [...(current.salaryPayments ?? []), payment], finance: usesHotelServer() ? current.finance : [{ id: makeId('finance'), isPayroll: true, type: 'expense', category: 'payroll', amount: employee.monthlySalary, date: today, description: `${employee.name} · ${period} oyligi`, paymentMethod: 'bank_transfer' }, ...current.finance] }));setPaying(null);
  }
  return <div className="space-y-5">
    <PageHeader eyebrow="Administrator · Jamoa" title="Ishchilar va oyliklar" description="Jamoa, ish boshlagan sanalar va oylik to‘lovlar nazorati." action={<button className="primary-button gap-2" onClick={() => { setEditing(null);setForm(blank());setOpen(!open); }}><Plus size={15} />Ishchi qo‘shish</button>} />
    <div className="grid gap-3 md:grid-cols-3"><DashboardMetric label="Faol ishchilar" value={active.length} icon={Users} detail="Hozir jamoada" /><DashboardMetric label="Oylik fondi" value={money(active.reduce((sum, employee) => sum + employee.monthlySalary, 0))} icon={WalletCards} detail="Faol ishchilar uchun / oy" tone="green" /><DashboardMetric label="To‘lov kutilmoqda" value={dues.length} icon={Bell} detail="Muddati kelgan ish haqlari" tone="amber" /></div>
    {open && <section className="portal-panel"><h2 className="portal-section-title">{editing ? 'Ishchini tahrirlash' : 'Yangi ishchi'}</h2><form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
      {([['name','Ism va familiya'],['jobTitle','Lavozim / nima ish qiladi'],['phone','Telefon'],['email','Email (ixtiyoriy)'],['monthlySalary','Oylik ish haqi'],['payday','Har oy to‘lov kuni (1–31)']] as const).map(([key,label]) => <label key={key} className="min-w-0 text-xs"><span className="mb-2 block">{label}</span><input required={key !== 'email'} maxLength={key==='name'?160:key==='jobTitle'?120:undefined} type={key==='email'?'email':key==='phone'?'tel':['monthlySalary','payday'].includes(key)?'number':'text'} min={key==='payday'?1:key==='monthlySalary'?1:undefined} max={key==='payday'?31:undefined} step={key==='monthlySalary'?'0.01':key==='payday'?'1':undefined} className="field" value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}
      <div><span className="mb-2 block text-xs">Ish boshlagan sana</span><DatePicker label="Ish boshlagan sana" value={form.startDate} min="1900-01-01" required onChange={(startDate) => setForm({ ...form,startDate })} /></div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form,isActive:event.target.checked })} />Faol ishchi</label><label className="text-xs sm:col-span-2"><span className="mb-2 block">Vazifalar va qo‘shimcha izoh</span><textarea maxLength={2000} className="field" value={form.notes} onChange={(event) => setForm({ ...form,notes:event.target.value })} /></label><p className="text-[11px] leading-5 text-muted sm:col-span-2">31-kun bo‘lmagan oylarda to‘lov oyning oxirgi kuniga tushadi. Ishchi qo‘shish saytga kirish hisobini avtomatik yaratmaydi.</p><div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="primary-button">Saqlash</button><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Bekor qilish</button></div>
    </form></section>}
    <section className="portal-panel"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="portal-section-title">Oylik eslatmalari</h2><span className="text-xs text-muted">Jami: {money(dues.reduce((sum, item) => sum + item.employee.monthlySalary,0))}</span></div><p className="mt-2 text-xs leading-6 text-muted">Panel ochilganda yangilanadi. To‘lovni tasdiqlash bankdan pul yubormaydi — bajarilgan to‘lovni hisobga oladi.</p><div className="mt-4 space-y-3">{dues.slice(0,20).map(({employee,period,dueDate,overdue}) => <article key={`${employee.id}:${period}`} className="rounded-2xl border border-[var(--line)] bg-[var(--page)] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><b className="text-sm">{employee.name}</b><p className="mt-1 text-xs text-muted">{period} · {dueDate} · {overdue?'Muddati o‘tgan':'Bugun to‘lov kuni'}</p></div><b className="text-sm">{money(employee.monthlySalary)}</b><button disabled={busy} className="secondary-button gap-1" onClick={() => setPaying(`${employee.id}:${period}`)}><Check size={14} />To‘lovni qayd etish</button></div>{paying===`${employee.id}:${period}` && <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-3 text-xs"><span>Oylik haqiqatan to‘landimi? Moliya chiqimiga ham yoziladi.</span><button disabled={busy} className="primary-button" onClick={() => pay(employee,period)}>Ha, to‘landi</button><button className="secondary-button" onClick={() => setPaying(null)}>Bekor qilish</button></div>}</article>)}{!dues.length && <p className="rounded-2xl bg-[var(--page)] p-5 text-sm text-muted">Hozir to‘lov muddati kelgan oylik yo‘q.</p>}{dues.length>20 && <p className="text-xs text-muted">Avval eng eski 20 ta to‘lovni ko‘rib chiqing; qolganlari keyin ko‘rinadi.</p>}</div></section>
    <section className="portal-panel"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="portal-section-title">Jamoa ro‘yxati</h2><SearchField label="Ishchilarni qidirish" value={query} onChange={setQuery} placeholder="Ism, lavozim, telefon…" /></div><div className="mt-4 flex flex-wrap items-center gap-3 text-xs"><label className="flex items-center gap-2"><input type="checkbox" checked={visible.length>0 && visible.every((employee) => selected.includes(employee.id))} onChange={(event) => { setSelected(event.target.checked?visible.map((item)=>item.id):[]);setDeleting(false); }} />Barchasini belgilash</label>{selected.length>0 && <button className="secondary-button text-danger" onClick={() => setDeleting(true)}>Belgilanganlarni o‘chirish ({selected.length})</button>}</div>{deleting && <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 p-3 text-xs"><span>To‘lov tarixi bor ishchilar arxivlanadi, tarixi yo‘qlari o‘chiriladi.</span><button disabled={busy} className="primary-button" onClick={remove}>Tasdiqlash</button><button className="secondary-button" onClick={() => setDeleting(false)}>Bekor qilish</button></div>}<div className="mt-4 grid gap-3 lg:grid-cols-2">{visible.map((employee) => <article key={employee.id} className="rounded-2xl border border-[var(--line)] p-4"><div className="flex items-start gap-3"><input aria-label={`${employee.name} ni belgilash`} className="mt-1" type="checkbox" checked={selected.includes(employee.id)} onChange={(event) => setSelected((ids)=>event.target.checked?[...ids,employee.id]:ids.filter((id)=>id!==employee.id))} /><div className="min-w-0 flex-1"><h3 className="break-words text-sm font-bold">{employee.name}</h3><p className="mt-1 break-words text-xs text-muted">{employee.jobTitle} · {employee.isActive?'Faol':'Arxivda'}</p></div><button title="Tahrirlash" className="p-2" onClick={() => edit(employee)}><Pencil size={15} /></button><button title="O‘chirish" className="p-2 text-danger" onClick={() => { setSelected([employee.id]);setDeleting(true); }}><Trash2 size={15} /></button></div><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted">Oylik</dt><dd className="mt-1 break-words font-semibold">{money(employee.monthlySalary)}</dd></div><div><dt className="text-muted">To‘lov kuni</dt><dd className="mt-1">Har oyning {employee.payday}-kuni</dd></div><div><dt className="text-muted">Telefon</dt><dd className="mt-1 break-words"><a href={`tel:${employee.phone}`}>{employee.phone}</a></dd></div><div><dt className="text-muted">Ish boshlagan</dt><dd className="mt-1">{employee.startDate}</dd></div></dl>{employee.email && <p className="mt-3 break-all text-xs text-muted">{employee.email}</p>}{employee.notes && <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-6 text-muted">{employee.notes}</p>}</article>)}</div>{!visible.length && <p className="py-8 text-center text-sm text-muted">Ishchi topilmadi.</p>}</section>
    <section className="portal-panel"><h2 className="portal-section-title">To‘lov tarixi</h2><div className="mt-4 space-y-3">{[...payments].sort((a,b)=>b.paidAt.localeCompare(a.paidAt)).slice(0,30).map((payment)=><div key={payment.id} className="flex flex-wrap justify-between gap-2 border-b border-[var(--line)] pb-3 text-xs"><span>{employees.find((employee)=>employee.id===payment.employeeId)?.name ?? 'Arxivdagi ishchi'} · {payment.period}<small className="mt-1 block text-muted">{new Date(payment.paidAt).toLocaleString('uz-UZ')}</small></span><b>{money(payment.amount)}</b></div>)}{!payments.length && <p className="text-xs text-muted">Hali to‘lov qayd etilmagan.</p>}</div></section>
    <Link to="/app" className="portal-text-link">Umumiy nazoratga qaytish</Link>
  </div>;
}
