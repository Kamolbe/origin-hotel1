import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { hotelRequest, usesHotelServer } from '../services/hotelServer';
import { Logo } from '../components/Logo';

export function CompleteProfilePage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { data, replaceServerData, updateData } = useAppData();
  const account = data.users.find((item)=>item.id===user?.id);
  const parts = user?.name.split(' ') ?? [];
  const [form,setForm] = useState({firstName:parts[0] ?? '',lastName:parts.slice(1).join(' '),phone:account?.phone ?? '+998',confirmed:false});
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  if(!user) return <Navigate to="/login" replace />;
  const requested = (location.state as { returnTo?: string } | null)?.returnTo;
  const destination = requested?.startsWith('/') && !requested.startsWith('//') && !['/login','/complete-profile'].includes(requested) ? requested : user.role==='user'?'/app/my-stay':'/app';
  if(!account?.profileRequired) return <Navigate to={destination} replace state={location.state} />;
  async function submit(event:FormEvent) {
    event.preventDefault();if(busy)return;
    const phone=form.phone.replace(/[\s()-]/g,'');
    if(!form.firstName.trim() || !form.lastName.trim() || !/^\+?\d{9,15}$/.test(phone) || !form.confirmed){setError('Ism, familiya va telefoningizni to‘liq kiriting, keyin tasdiqlang.');return;}
    setBusy(true);setError('');
    try {
      if(usesHotelServer()) replaceServerData(await hotelRequest('auth/complete-profile','POST',{...form,phone}));
      else updateData((current)=>({...current,users:current.users.map((item)=>item.id===user!.id?{...item,name:`${form.firstName.trim()} ${form.lastName.trim()}`,phone,profileRequired:false}:item)}));
    } catch(cause){setError(cause instanceof Error?cause.message:'Saqlash bajarilmadi.');}finally{setBusy(false);}
  }
  return <main className="grid min-h-screen place-items-center bg-[var(--page)] px-4 py-10"><section className="portal-panel w-full max-w-lg"><Logo /><div className="mt-7 flex items-center gap-2 text-xs text-emerald-600"><ShieldCheck size={17} />Google orqali hisobga kirildi</div><h1 className="mt-4 font-display text-3xl">Ma’lumotlaringizni tasdiqlang</h1><p className="mt-3 break-all text-sm text-muted">{user.email}</p><p className="mt-3 text-xs leading-6 text-muted">Bron bo‘yicha bog‘lanish uchun ism, familiya va telefoningiz kerak. Telefon raqami SMS orqali hali tekshirilmaydi.</p><form onSubmit={submit} className="mt-5 space-y-4">{([['firstName','Ism'],['lastName','Familiya'],['phone','Telefon raqami']] as const).map(([key,label])=><label className="block text-xs" key={key}><span className="mb-2 block">{label}</span><input className="field" required maxLength={key==='phone'?25:80} autoComplete={key==='firstName'?'given-name':key==='lastName'?'family-name':'tel'} type={key==='phone'?'tel':'text'} value={form[key]} onChange={(event)=>setForm({...form,[key]:event.target.value})} /></label>)}<label className="flex items-start gap-3 text-xs leading-6"><input required className="mt-1" type="checkbox" checked={form.confirmed} onChange={(event)=>setForm({...form,confirmed:event.target.checked})} /><span>Ism, familiya va aloqa raqamim to‘g‘riligini tasdiqlayman.</span></label>{error && <p role="alert" className="text-xs text-danger">{error}</p>}<button disabled={busy} className="primary-button w-full gap-2"><Check size={15} />{busy?'Saqlanmoqda…':'Tasdiqlash va davom etish'}</button></form><button className="secondary-button mt-3 w-full" onClick={logout}>Hisobdan chiqish</button></section></main>;
}
