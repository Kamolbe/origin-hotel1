import { useState } from 'react';
import { Download, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { BulkDeletePanel } from './BulkDeletePanel';
import { isCalendarDate } from '../services/bookingSearch';
import { periodSummary } from '../services/hotelOperations';
import { formatMoney } from '../services/hotelUtils';
import { makeId } from '../services/storage';
import type { SavedReport } from '../types';

export function SavedReports({ from, to }: { from: string; to: string }) {
  const { user } = useAuth();
  const { data, updateData, serverStatus } = useAppData();
  const { error } = useToast();
  const [title,setTitle] = useState('');
  const [deleteId,setDeleteId] = useState<string | null>(null);
  const [limit,setLimit] = useState(10);
  const canDelete=user?.role==='admin';
  const records=[...(data.reports ?? [])].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const busy=serverStatus==='saving';
  function save() {
    if(!user || !['admin','manager'].includes(user.role))return;
    if(!isCalendarDate(from)||!isCalendarDate(to)||to<from||(Date.parse(to)-Date.parse(from))/86400000>3660){error('Hisobot sanalarini tekshiring. Davr 10 yildan oshmasin.');return;}
    const summary=periodSummary(data,from,to);
    const report:SavedReport={id:makeId('report'),title:title.trim()||`Hisobot · ${from} — ${to}`,from,to,createdAt:new Date().toISOString(),createdBy:user.id,summary:{income:summary.income,expense:summary.expense,net:summary.income-summary.expense,occupancy:summary.occupancy,currency:data.settings.currency,bookingCount:summary.bookings.length,financeCount:summary.finance.length,room_nights:summary.roomNights,days:summary.days}};
    updateData((current)=>({...current,reports:[report,...(current.reports ?? [])]}));setTitle('');
  }
  function remove(ids:string[]) { if(!canDelete)return;updateData((current)=>({...current,reports:(current.reports ?? []).filter((item)=>!ids.includes(item.id))}));setDeleteId(null); }
  function download(report:SavedReport) { const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=`hotel-report-${report.from}-${report.to}.json`;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000); }
  return <section aria-label="Saqlangan hisobotlar" className="portal-panel mt-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="portal-eyebrow">Davr natijalarining arxivi</p><h2 className="portal-section-title">Saqlangan hisobotlar ({records.length})</h2></div><button disabled={busy} className="primary-button gap-2" onClick={save}><Save size={14} />Hisobotni saqlash</button></div><label className="mt-4 block text-xs"><span className="mb-2 block">Hisobot nomi (ixtiyoriy)</span><input className="field" value={title} maxLength={160} onChange={(event)=>setTitle(event.target.value)} placeholder={`${from} — ${to}`} /></label><p className="mt-3 text-xs leading-6 text-muted">Tanlangan davr natijasi saqlanadi; keyingi moliya o‘zgarishlari avval saqlangan hisobotni qayta yozmaydi. {canDelete?'Saqlangan hisobotni o‘chirish asosiy bron yoki moliya yozuvlarini o‘chirmaydi.':'Hisobot qo‘sha olasiz, o‘chirish faqat administratorga ruxsat etilgan.'}</p>
    {canDelete && <BulkDeletePanel subject="ta saqlangan hisobot" items={records.map((item)=>({id:item.id,label:`${item.title} · ${item.from} — ${item.to}`}))} note="Asosiy moliya va bronlar saqlanadi. Faqat tanlangan hisobot nusxalari o‘chiriladi." onDelete={remove} />}
    <div className="mt-4 grid gap-3 lg:grid-cols-2">{records.slice(0,limit).map((report)=><article key={report.id} className="min-w-0 rounded-2xl border border-[var(--line)] p-4"><h3 className="break-words text-sm font-semibold">{report.title}</h3><p className="mt-2 text-xs text-muted">{report.from} — {report.to}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-xs">{[['Kirim',formatMoney(report.summary.income,report.summary.currency)],['Chiqim',formatMoney(report.summary.expense,report.summary.currency)],['Sof natija',formatMoney(report.summary.net,report.summary.currency)],['Bandlik',`${report.summary.occupancy}%`]].map(([label,value])=><div key={label}><dt className="text-muted">{label}</dt><dd className="mt-1 break-words font-semibold">{value}</dd></div>)}</dl><p className="mt-4 text-[10px] leading-5 text-muted">{data.users.find((item)=>item.id===report.createdBy)?.name ?? 'Tizim'} · {new Date(report.createdAt).toLocaleString('uz-UZ')}</p><div className="mt-3 flex flex-wrap gap-2"><button className="secondary-button gap-1" onClick={()=>download(report)}><Download size={13} />Yuklab olish</button>{canDelete && <button aria-label={`${report.title} hisobotini o‘chirish`} className="secondary-button gap-1 text-danger" onClick={()=>setDeleteId(report.id)}><Trash2 size={13} />O‘chirish</button>}</div>{deleteId===report.id && canDelete && <div className="mt-3 space-y-3 border-t border-[var(--line)] pt-3 text-xs"><p>Ushbu saqlangan hisobot o‘chirilsinmi?</p><div className="flex flex-wrap gap-2"><button disabled={busy} className="primary-button" onClick={()=>remove([report.id])}>O‘chirishni tasdiqlash</button><button className="secondary-button" onClick={()=>setDeleteId(null)}>Bekor qilish</button></div></div>}</article>)}</div>{!records.length && <p className="py-6 text-center text-xs text-muted">Hali hisobot saqlanmagan.</p>}{records.length>limit && <button className="secondary-button mt-4 w-full" onClick={()=>setLimit(limit+10)}>Yana hisobotlarni ko‘rish</button>}
  </section>;
}
