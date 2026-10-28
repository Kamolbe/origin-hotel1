import { SearchField } from '../components/SearchField';
import { BulkDeletePanel } from '../components/BulkDeletePanel';
import { DatePicker } from '../components/DatePicker';
import { ResponsiveTable } from '../components/ResponsiveTable';
import { Select } from '../components/Select';
import { useMemo, useState, type FormEvent } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Plus, Trash2, WalletCards } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusPill } from '../components/StatusPill';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { formatMoney, recordAudit } from '../services/hotelUtils';
import { makeId } from '../services/storage';
import type { FinanceCategory, FinanceEntry, FinancePaymentMethod, FinanceType } from '../types';

const categoryLabels: Record<FinanceCategory,string> = { room_revenue:'Xona daromadi', food_and_beverage:'Oziq-ovqat va restoran', housekeeping:'Tozalik xizmati', utilities:'Kommunal xizmatlar', maintenance:'Ta’mirlash', payroll:'Ish haqi', supplies:'Xaridlar', marketing:'Marketing', other:'Boshqa' };
const paymentLabels: Record<FinancePaymentMethod,string> = { cash:'Naqd', card:'Karta', bank_transfer:'Bank o‘tkazmasi', online:'Onlayn' };
const emptyForm = { type:'income' as FinanceType, category:'room_revenue' as FinanceCategory, amount:'', date:new Date().toISOString().slice(0,10), description:'', paymentMethod:'card' as FinancePaymentMethod };

export function FinancePage() {
  const { user } = useAuth();
  const { data, updateData } = useAppData();
  const { success, error } = useToast();
  const [period, setPeriod] = useState<'day'|'month'|'year'>('month');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteEntry, setDeleteEntry] = useState<FinanceEntry|null>(null);
  const [form, setForm] = useState(emptyForm);
  const now = new Date();
  const periodStart = period === 'day' ? now.toISOString().slice(0,10) : period === 'month' ? `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}` : String(now.getFullYear());
  const filtered = useMemo(() => data.finance.filter((item) => item.date.startsWith(periodStart) && (typeFilter === 'all' || item.type === typeFilter) && `${item.description} ${categoryLabels[item.category]}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>b.date.localeCompare(a.date)), [data.finance,periodStart,typeFilter,search]);
  const periodEntries = data.finance.filter((item) => item.date.startsWith(periodStart));
  const income = periodEntries.filter((item)=>item.type==='income').reduce((sum,item)=>sum+item.amount,0);
  const expense = periodEntries.filter((item)=>item.type==='expense').reduce((sum,item)=>sum+item.amount,0);
  const net = income-expense;
  const chartData = useMemo(() => {
    const count = period === 'year' ? 12 : period === 'month' ? 10 : 7;
    return Array.from({length:count},(_,index)=>{
      const date = new Date();
      let key:string, label:string;
      if(period==='year') { date.setMonth(date.getMonth()-(count-index-1)); key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; label=new Intl.DateTimeFormat('uz-UZ',{month:'short'}).format(date); }
      else if(period==='month') { date.setDate(date.getDate()-(count-index-1)); key=date.toISOString().slice(0,10); label=new Intl.DateTimeFormat('uz-UZ',{day:'numeric'}).format(date); }
      else { date.setDate(date.getDate()-(count-index-1)); key=date.toISOString().slice(0,10); label=new Intl.DateTimeFormat('uz-UZ',{day:'numeric',month:'short'}).format(date); }
      const items=data.finance.filter((entry)=>entry.date.startsWith(key));
      return {label,income:items.filter((entry)=>entry.type==='income').reduce((sum,entry)=>sum+entry.amount,0),expense:items.filter((entry)=>entry.type==='expense').reduce((sum,entry)=>sum+entry.amount,0)};
    });
  },[data.finance,period]);

  function addEntry(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); const amount=Number(form.amount);
    if(!Number.isFinite(amount)||amount<=0){error('Summani to‘g‘ri kiriting.');return;}
    const entry:FinanceEntry={id:makeId('finance'),type:form.type,category:form.category,amount,date:new Date(`${form.date}T12:00:00`).toISOString(),description:form.description.trim()||categoryLabels[form.category],paymentMethod:form.paymentMethod};
    updateData((current)=>({ ...current, finance:[entry,...current.finance], notifications:[{id:makeId('notification'),userId:undefined,type:'payment',title:entry.type==='income'?'Kirim qo‘shildi':'Chiqim qo‘shildi',message:`${formatMoney(entry.amount,current.settings.currency)} · ${entry.description}`,read:false,createdAt:new Date().toISOString()},...current.notifications], auditLog:recordAudit(current,entry.type==='income'?'Kirim qo‘shildi':'Chiqim qo‘shildi','finance',entry.id,user?.id) }));
    success('Moliya yozuvi saqlandi.');setModalOpen(false);setForm(emptyForm);
  }
  function removeEntry(){if(!deleteEntry)return;updateData((current)=>({ ...current,finance:current.finance.filter((item)=>item.id!==deleteEntry.id),auditLog:recordAudit(current,'Moliya yozuvi o‘chirildi','finance',deleteEntry.id,user?.id)}));success('Yozuv o‘chirildi.');setDeleteEntry(null);}

  return <div className="animate-rise-in"><PageHeader eyebrow="Moliyaviy nazorat" title="Moliya" description="Kirim, chiqim va sof foydani davrlar bo‘yicha kuzating." action={<button onClick={()=>setModalOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white hover:bg-ink-soft"><Plus size={14} />Kirim / Chiqim qo‘shish</button>} />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">Ko‘rinish:</p><div className="flex rounded-full bg-[var(--surface)] p-1">{(['day','month','year'] as const).map((item)=><button key={item} onClick={()=>setPeriod(item)} className={`rounded-full px-4 py-2 text-[10px] font-semibold ${period===item?'bg-ink text-white':'text-muted'}`}>{item==='day'?'Kunlik':item==='month'?'Oylik':'Yillik'}</button>)}</div></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Jami kirim" value={formatMoney(income,data.settings.currency)} icon={ArrowUpRight} detail={period==='day'?'Bugungi tushum':period==='month'?'Joriy oy':'Joriy yil'} accent /><StatCard label="Jami chiqim" value={formatMoney(expense,data.settings.currency)} icon={ArrowDownRight} detail="Tanlangan davr" /><StatCard label="Sof foyda" value={formatMoney(net,data.settings.currency)} icon={CircleDollarSign} detail="Kirim minus chiqim" trend={net>=0?8.4:-4.2} /><StatCard label="Yozuvlar" value={periodEntries.length} icon={WalletCards} detail="Tanlangan davrda" /></div>
    <section className="surface mt-5 rounded-3xl p-5 sm:p-6"><div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-champagne">Moliya dinamikasi</p><h2 className="mt-1 font-display text-2xl">Kirim va chiqim</h2></div><div className="h-[255px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{top:8,right:8,left:-14,bottom:0}}><CartesianGrid stroke="var(--line)" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:10}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:9}} tickFormatter={(v)=>`${Math.round(v/1000000)}m`}/><Tooltip formatter={(v)=>formatMoney(Number(v),data.settings.currency)} contentStyle={{borderRadius:12,border:'1px solid var(--line)',background:'var(--surface)',color:'var(--text)',fontSize:11}}/><Bar dataKey="income" name="Kirim" fill="#b99a68" radius={[6,6,0,0]}/><Bar dataKey="expense" name="Chiqim" fill="#85979a" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></section>
    <BulkDeletePanel subject="ta moliya yozuvi" items={filtered.map((entry) => ({ id: entry.id, label: `${entry.description} · ${formatMoney(entry.amount, data.settings.currency)}` }))} note="Faqat tanlangan davr va qidiruvdagi yozuvlar belgilanadi. Bronlar o‘chirilmaydi." onDelete={(ids) => { if (!user || !['admin', 'manager'].includes(user.role)) return; updateData((current) => ({ ...current, finance: current.finance.filter((entry) => !ids.includes(entry.id)), auditLog: recordAudit(current, `${ids.length} ta moliya yozuvi guruhlab o‘chirildi`, 'finance', ids.join(','), user.id) })); success('Belgilangan moliya yozuvlari o‘chirildi.'); }} />
    <section className="surface mt-5 overflow-hidden rounded-3xl"><div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-xs font-semibold">Moliya yozuvlari</p><p className="mt-1 text-[10px] text-muted">{filtered.length} yozuv · {period==='day'?'kunlik':period==='month'?'oylik':'yillik'}</p></div><div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><Select value={typeFilter} onChange={(event)=>setTypeFilter(event.target.value)} className="w-full rounded-full border border-[var(--line)] bg-[var(--page)] px-3 py-2 text-[10px] sm:w-auto"><option value="all">Barcha turlar</option><option value="income">Kirim</option><option value="expense">Chiqim</option></Select><SearchField value={search} onChange={setSearch} label="Moliya yozuvlarini qidirish" placeholder="Izlash..." className="w-full sm:w-56" /></div></div>
      {filtered.length===0?<p className="px-5 py-14 text-center text-xs text-muted">Tanlangan davrda yozuvlar yo‘q.</p>:<ResponsiveTable><table className="w-full min-w-[780px] text-left"><thead className="bg-[var(--page)] text-[9px] uppercase tracking-[.1em] text-muted"><tr><th className="px-5 py-3">Yozuv</th><th className="px-4 py-3">Kategoriya</th><th className="px-4 py-3">Sana</th><th className="px-4 py-3">To‘lov</th><th className="px-4 py-3">Turi</th><th className="px-4 py-3 text-right">Miqdor</th><th className="px-5 py-3 text-right">Amal</th></tr></thead><tbody>{filtered.map((entry)=><tr key={entry.id} className="border-t border-[var(--line)] text-xs"><td className="px-5 py-3.5 font-semibold">{entry.description}</td><td className="px-4 py-3.5">{categoryLabels[entry.category]}</td><td className="px-4 py-3.5 text-muted">{new Date(entry.date).toLocaleDateString('uz-UZ')}</td><td className="px-4 py-3.5">{paymentLabels[entry.paymentMethod]}</td><td className="px-4 py-3.5"><StatusPill status={entry.type}>{entry.type==='income'?'Kirim':'Chiqim'}</StatusPill></td><td className={`px-4 py-3.5 text-right font-semibold ${entry.type==='income'?'text-success':'text-danger'}`}>{entry.type==='income'?'+':'−'}{formatMoney(entry.amount,data.settings.currency)}</td><td className="px-5 py-3.5 text-right"><button title="O‘chirish" onClick={()=>setDeleteEntry(entry)} className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14}/></button></td></tr>)}</tbody></table></ResponsiveTable>}
    </section>
    <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title="Moliya yozuvi qo‘shish" description="Kirim yoki chiqim operatsiyasini kiriting."><form onSubmit={addEntry} className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-[10px] font-semibold">Yozuv turi</span><Select value={form.type} onChange={(event)=>setForm({...form,type:event.target.value as FinanceType,category:event.target.value==='income'?'room_revenue':'utilities'})} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs"><option value="income">Kirim</option><option value="expense">Chiqim</option></Select></label><label className="block"><span className="mb-1.5 block text-[10px] font-semibold">Kategoriya</span><Select value={form.category} onChange={(event)=>setForm({...form,category:event.target.value as FinanceCategory})} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs">{Object.entries(categoryLabels).filter(([key])=>form.type==='income'?['room_revenue','food_and_beverage','other'].includes(key):key!=='room_revenue').map(([key,label])=><option key={key} value={key}>{label}</option>)}</Select></label><label className="block"><span className="mb-1.5 block text-[10px] font-semibold">Summa ({data.settings.currency})</span><input type="number" min="1" required value={form.amount} onChange={(event)=>setForm({...form,amount:event.target.value})} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs"/></label><label className="block"><span className="mb-1.5 block text-[10px] font-semibold">Sana</span><DatePicker label="Sana" required value={form.date} onChange={(date)=>setForm({...form,date})} /></label><label className="block"><span className="mb-1.5 block text-[10px] font-semibold">To‘lov usuli</span><Select value={form.paymentMethod} onChange={(event)=>setForm({...form,paymentMethod:event.target.value as FinancePaymentMethod})} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs">{Object.entries(paymentLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</Select></label><label className="block"><span className="mb-1.5 block text-[10px] font-semibold">Tavsif</span><input value={form.description} onChange={(event)=>setForm({...form,description:event.target.value})} placeholder="Masalan: elektr energiyasi" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs"/></label><div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={()=>setModalOpen(false)} className="rounded-full border border-[var(--line)] px-4 py-2.5 text-xs">Bekor qilish</button><button className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white">Saqlash</button></div></form></Modal>
    <Modal open={!!deleteEntry} onClose={()=>setDeleteEntry(null)} title="Yozuvni o‘chirish" description={`${deleteEntry?.description ?? ''} yozuvi moliya ro‘yxatidan o‘chadi.`}><div className="flex justify-end gap-2"><button onClick={()=>setDeleteEntry(null)} className="rounded-full border border-[var(--line)] px-4 py-2.5 text-xs">Bekor qilish</button><button onClick={removeEntry} className="rounded-full bg-danger px-4 py-2.5 text-xs font-semibold text-white">O‘chirish</button></div></Modal>
  </div>;
}
