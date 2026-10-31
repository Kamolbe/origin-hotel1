import { useState } from 'react';
import { Clock3, ShieldCheck, Trash2 } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { hotelRequest, usesHotelServer } from '../services/hotelServer';
import { recordAudit } from '../services/hotelUtils';
import { BulkDeletePanel } from './BulkDeletePanel';
import { DeleteConfirmation } from './DeleteConfirmation';
import { SearchField } from './SearchField';

const labels: Record<string,string> = {save:'Ma’lumot yangilandi',profile:'Hisob yangilandi',delete:'Yozuv o‘chirildi','site visit deleted':'Sayt tashrifi o‘chirildi','site settings updated':'Sayt sozlamalari yangilandi','manager sessions revoked':'Manager sessiyalari tugatildi','site editor permission changed':'Sayt tahrirlash huquqi o‘zgartirildi',user:'Hisob',booking:'Bron',room:'Xona',finance:'Moliya',financeentry:'Moliya',guest:'Mehmon',sitestate:'Tizim',staffmember:'Ishchi',salarypayment:'Ish haqi',reportsnapshot:'Hisobot'};
export function AccountHistory() {
  const { data, updateData, refreshData, serverStatus } = useAppData();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [removing, setRemoving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canDelete = user?.role === 'admin';
  const records = data.auditLog.filter((entry) => `${entry.action} ${entry.actorName ?? data.users.find((item)=>item.id===entry.userId)?.name ?? ''} ${entry.actorEmail ?? ''} ${entry.entityType} ${entry.details?.record ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  const pages = Math.max(1, Math.ceil(records.length / 10));
  const currentPage = Math.min(page, pages - 1);
  const disabled = busy || serverStatus === 'saving';
  async function remove(ids: string[]) {
    if (!canDelete || disabled || !ids.length) return;
    setBusy(true);
    try {
      if (usesHotelServer()) { await hotelRequest('account-history','POST',{ids}); refreshData(); }
      else updateData((state)=>{const next={...state,auditLog:state.auditLog.filter((item)=>!ids.includes(item.id))};return {...next,auditLog:recordAudit(next,'Hisoblar tarixi tozalandi','user',ids.join(','),user.id)};});
      setRemoving(null); success('Tanlangan tarix yozuvlari o‘chirildi.');
    } catch (cause) { error(cause instanceof Error ? cause.message : 'Tarixni o‘chirib bo‘lmadi.'); }
    finally { setBusy(false); }
  }
  return <section aria-label="Hisoblar tarixi" className="surface mt-6 overflow-hidden rounded-3xl">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] p-5 sm:p-6"><div className="flex min-w-0 items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-champagne/10 text-champagne"><Clock3 size={20}/></span><div><p className="text-[9px] font-bold uppercase tracking-widest text-muted">Hisoblar nazorati</p><h2 className="mt-1 font-display text-2xl">Hisoblar va faoliyat tarixi</h2><p className="mt-2 text-xs leading-6 text-muted">O‘chirilgan hisoblarning saqlanib qolgan qaydlari ham ko‘rinadi. Tarixni tozalash hisoblar, bronlar yoki moliyani o‘chirmaydi.</p></div></div><span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--page)] px-3 py-2 text-[10px] font-semibold"><ShieldCheck size={13}/>{canDelete?'Admin boshqaruvi':'Faqat ko‘rish'}</span></div>
    <div className="p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><SearchField label="Hisoblar tarixini qidirish" value={query} onChange={(value)=>{setQuery(value);setPage(0);}} placeholder="Ism, email yoki amal…" className="w-full sm:max-w-sm"/><span aria-live="polite" className="text-xs text-muted">{busy?'O‘chirilmoqda…':`${records.length} ta qayd`}</span></div>
      {canDelete && <BulkDeletePanel subject="ta tarix qaydi" items={disabled?[]:records.map((entry)=>({id:entry.id,label:`${labels[entry.action] ?? entry.action} · ${entry.actorName ?? 'Tizim'} · ${new Date(entry.createdAt).toLocaleString('uz-UZ')}`}))} note="Joriy qidiruvdagi qaydlar tanlanadi. Tozalash amali alohida yangi qayd sifatida saqlanadi." onDelete={(ids)=>void remove(ids)}/>}
      <div className="mt-4 space-y-3">{records.slice(currentPage*10,(currentPage+1)*10).map((entry)=><article key={entry.id} className="flex min-w-0 items-start gap-3 rounded-2xl border border-[var(--line)] p-4"><span className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--page)] text-muted sm:grid"><Clock3 size={15}/></span><div className="min-w-0 flex-1"><h3 className="break-words text-xs font-semibold">{labels[entry.action] ?? entry.action}</h3><p className="mt-1.5 break-words text-xs text-muted">{entry.actorName ?? data.users.find((item)=>item.id===entry.userId)?.name ?? 'Arxivdagi hisob'}<span className="ml-2 rounded-full bg-[var(--page)] px-2 py-1 text-[9px]">{labels[entry.entityType] ?? entry.entityType}</span></p>{!!entry.details?.record && String(entry.entityType)!=='sitestate' && <p className="mt-2 break-words text-[11px] text-muted">{String(entry.details.record)}</p>}<time className="mt-2 block text-[10px] text-muted">{new Date(entry.createdAt).toLocaleString('uz-UZ')}</time></div>{canDelete && <button type="button" disabled={disabled} aria-label={`${entry.action} tarix qaydini o‘chirish`} onClick={()=>setRemoving(entry.id)} className="shrink-0 rounded-xl p-2.5 text-danger transition hover:bg-rose-500/10 disabled:opacity-40"><Trash2 size={15}/></button>}</article>)}</div>
      {!records.length && <p className="rounded-2xl bg-[var(--page)] p-7 text-center text-xs text-muted">Tanlangan qidiruv bo‘yicha tarix topilmadi.</p>}
      {pages>1 && <nav aria-label="Hisoblar tarixi sahifalari" className="mt-5 flex items-center justify-between gap-2 border-t border-[var(--line)] pt-4"><button className="secondary-button disabled:opacity-40" disabled={!currentPage} onClick={()=>setPage(currentPage-1)}>Oldingi</button><span className="text-xs text-muted">{currentPage+1} / {pages}</span><button className="secondary-button disabled:opacity-40" disabled={currentPage+1>=pages} onClick={()=>setPage(currentPage+1)}>Keyingi</button></nav>}
    </div>
    <DeleteConfirmation open={!!removing} onClose={()=>setRemoving(null)} onConfirm={()=>{if(removing)void remove([removing]);}} disabled={disabled} title="Tarix qaydini o‘chirish" description="Faqat tanlangan tarix qaydi o‘chiriladi. Hisoblar, bronlar va moliya saqlanadi. Tozalash amali yangi qayd sifatida yoziladi."/>
  </section>;
}
