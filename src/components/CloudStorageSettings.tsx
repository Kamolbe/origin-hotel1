import { usesHotelServer } from '../services/hotelServer';
import { useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCloudSync } from '../context/CloudSyncContext';

export function CloudStorageSettings() {
  const { user } = useAuth();
  const cloud = useCloudSync();
  const [password, setPassword] = useState('');
  const [confirmReload, setConfirmReload] = useState(false);
  if (usesHotelServer() || user?.role !== 'admin') return null;
  return <section aria-label="Bulutda saqlash" className="surface mb-6 space-y-4 rounded-3xl p-5 sm:p-6"><div className="flex items-center gap-3"><Cloud size={23} className="text-champagne" /><h2 className="font-display text-2xl">Bulutda saqlash</h2></div><p className="text-xs leading-6 text-muted">Firebase serveri ulanganidan so‘ng admin o‘zgarishlari avtomatik saqlanadi, sayt rasmlari, xona va aloqa ma’lumotlari barcha qurilmalarda ko‘rinadi. Ulanishda avval bulutdagi nusxa yuklanadi. Mahalliy demo parollari bulutga yuborilmaydi.</p><CloudSaveStatus />{!cloud.connected ? <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void cloud.connect(String(new FormData(event.currentTarget).get('email')), password).then(() => setPassword('')); }}><label className="text-xs font-semibold">Bulut admin emaili<input name="email" type="email" defaultValue="admin@admin.com" required className="field mt-2" /></label><label className="text-xs font-semibold">Serverda sozlangan bulut paroli<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="field mt-2" /></label><button disabled={cloud.status === 'loading'} className="primary-button gap-2 sm:col-span-2"><Cloud size={16} />{cloud.status === 'loading' ? 'Ulanmoqda…' : 'Bulutga ulanish'}</button></form> : <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void cloud.retry()} className="secondary-button gap-2" disabled={cloud.status === 'saving'}><RefreshCw size={14} />Qayta saqlash</button><button type="button" onClick={() => setConfirmReload(true)} className="secondary-button">Bulutdan qayta yuklash</button><button type="button" onClick={cloud.disconnect} className="secondary-button gap-2"><CloudOff size={14} />Ulanishni uzish</button></div>}{confirmReload && <div className="rounded-2xl border border-[var(--line)] p-4 text-xs"><p className="leading-6">Saqlanmagan mahalliy o‘zgarishlar bulutdagi nusxa bilan almashtiriladi.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" className="secondary-button" onClick={() => setConfirmReload(false)}>Bekor qilish</button><button type="button" className="primary-button" onClick={() => { setConfirmReload(false); void cloud.reload().catch(() => {}); }}>Ha, qayta yuklash</button></div></div>}<p className="text-[11px] leading-5 text-muted">Ulanish ishlamasa: README’dagi “Firebase orqali doimiy saqlash” sozlamalarini Vercel’da kiriting. Baza va zaxira nusxalarini yuritish kerak; cheksiz saqlanish kafolatlanmaydi.</p></section>;
}
export function CloudSaveStatus({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const cloud = useCloudSync();
  if (usesHotelServer() || user?.role !== 'admin' || (compact && !cloud.connected && cloud.status !== 'error')) return null;
  const labels = { local: 'Faqat shu brauzerda', loading: 'Bulutdan yuklanmoqda…', saving: 'Bulutga saqlanmoqda…', synced: 'Bulutga saqlandi', error: 'Bulutga saqlanmadi' };
  return <div role="status" className={`${compact ? 'mb-4' : ''} rounded-xl ${cloud.status === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-[var(--page)] text-muted'} px-3 py-2 text-[11px] leading-5`}><span className="font-semibold">{labels[cloud.status]}</span>{cloud.savedAt && cloud.status === 'synced' && <span> · {new Date(cloud.savedAt).toLocaleString('uz-UZ')}</span>}{cloud.message && <p>{cloud.message}</p>}</div>;
}
