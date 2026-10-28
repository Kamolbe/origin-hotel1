import { SettingsIdentity } from '../components/SettingsIdentity';
import { ContactCards } from '../components/ContactCards';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Download, Headphones, Settings, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useUserPreferences, DEFAULT_USER_PREFERENCES } from '../hooks/useUserPreferences';
import { supportedLanguages } from '../i18n';
import type { RoomType } from '../types';

export function GuestSettingsPage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { data, updateData } = useAppData();
  const { success } = useToast();
  const { theme } = useTheme();
  const { preferences, save } = useUserPreferences();
  const { section, editorTab } = useParams();
  const tab = section ?? 'preferences';
  const account = data.users.find((item) => item.id === user?.id);
  const sections = [{ id: 'preferences', label: 'Mening tanlovlarim', icon: Settings }, { id: 'privacy', label: 'Ma’lumotlarim', icon: ShieldCheck }, { id: 'help', label: 'Yordam', icon: Headphones }];
  if (section === 'account') return <Navigate to="/app/settings" replace />;
  if (editorTab || !sections.some((item) => item.id === tab)) return <Navigate to="/app/settings" replace />;
  function exportData() {
    const guestIds = new Set(data.guests.filter((guest) => guest.email.toLowerCase() === user?.email.toLowerCase()).map((guest) => guest.id));
    const bookings = data.bookings.filter((booking) => booking.userId ? booking.userId === user?.id : guestIds.has(booking.guestId));
    const payload = { profile: { name: user?.name, email: user?.email, phone: account?.phone ?? '', nationality: account?.nationality ?? '', createdAt: account?.createdAt }, preferences, bookings };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'mening-mehmonxona-malumotlarim.json'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div><PageHeader eyebrow="Shaxsiy sozlamalar" title="Hisobingiz sizga mos bo‘lsin" description="Profil, til, ko‘rinish va safar tanlovlaringizni bir joydan boshqaring." /><SettingsIdentity withProfile /><nav aria-label="Shaxsiy sozlama bo‘limlari" className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">{sections.map(({ id, label, icon: Icon }) => <Link key={id} to={`/app/settings/${id}`} aria-current={tab === id ? 'page' : undefined} className={`${tab === id ? 'primary-button' : 'secondary-button'} min-w-0 !px-2 gap-2`}><Icon size={15} className="shrink-0" />{label}</Link>)}</nav>
    {tab === 'preferences' && <div className="space-y-5"><section className="surface rounded-3xl p-5 sm:p-7"><h2 className="font-display text-2xl">Til va ko‘rinish</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold">Mening tilim<Select value={i18n.language.split('-')[0]} onChange={(event) => save({ language: event.target.value })} className="field mt-2">{supportedLanguages.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</Select></label><label className="text-xs font-semibold">Mening mavzum<Select value={theme} onChange={(event) => save({ theme: event.target.value as 'light' | 'dark' })} className="field mt-2"><option value="light">Yorug‘</option><option value="dark">Qorong‘i</option></Select></label></div><label className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-[var(--page)] p-4"><span><span className="block text-sm font-semibold">Kamroq animatsiya</span><span className="mt-1 block text-xs leading-5 text-muted">Harakatli effektlarni kamaytirish. Tizim sozlamasi ham hisobga olinadi.</span></span><input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => save({ reducedMotion: event.target.checked })} /></label></section><form className="surface rounded-3xl p-5 sm:p-7" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); save({ defaultGuests: Number(form.get('guests')), roomType: String(form.get('roomType')) as RoomType | 'all', bookingNote: String(form.get('note') ?? '').trim() }); success('Bronlash tanlovlaringiz saqlandi.'); }}><h2 className="font-display text-2xl">Safar tanlovlari</h2><p className="mt-2 text-xs leading-6 text-muted">Yangi xona qidiruvi va bron shaklida boshlang‘ich qiymatlar sifatida ishlatiladi. Har bir bron uchun o‘zgartirishingiz mumkin.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold">Odatdagi mehmonlar soni<Select name="guests" defaultValue={preferences.defaultGuests} className="field mt-2">{[1,2,3,4].map((n) => <option key={n} value={n}>{n} mehmon</option>)}</Select></label><label className="text-xs font-semibold">Afzal xona turi<Select name="roomType" defaultValue={preferences.roomType} className="field mt-2">{['all','Standard','Deluxe','Suite','Family','Presidential'].map((value) => <option key={value} value={value}>{value === 'all' ? 'Barcha turlar' : value}</option>)}</Select></label><label className="text-xs font-semibold sm:col-span-2">Odatdagi bron izohi<textarea name="note" maxLength={500} defaultValue={preferences.bookingNote} className="field mt-2 min-h-24" placeholder="Masalan: imkon bo‘lsa tinchroq xona…" /><span className="mt-2 block font-normal leading-6 text-muted">Izoh bron so‘roviga qo‘shiladi; maxsus so‘rov bajarilishi qabulxona tasdig‘iga bog‘liq.</span></label><button className="primary-button sm:col-span-2">Safar tanlovlarini saqlash</button></div></form><button type="button" onClick={() => { save({ ...DEFAULT_USER_PREFERENCES, language: 'uz', theme: 'light' }); success('Shaxsiy tanlovlar standart holatga qaytarildi.'); }} className="secondary-button">Shaxsiy tanlovlarni tiklash</button></div>}
    {tab === 'privacy' && <section className="surface space-y-5 rounded-3xl p-5 sm:p-7"><h2 className="font-display text-2xl">Ma’lumotlaringiz</h2><p className="text-sm leading-7 text-muted">Profil, bron va shaxsiy tanlovlar hozir ushbu brauzerda saqlanadi. Boshqa qurilmaga avtomatik ko‘chmaydi. Yuklab olinadigan faylga parol va maxsus kodlar kiritilmaydi.</p><button type="button" onClick={exportData} className="primary-button gap-2"><Download size={16} />Ma’lumotlarimni yuklab olish</button><div className="border-t border-[var(--line)] pt-5"><button type="button" onClick={() => { updateData((state) => ({ ...state, notifications: state.notifications.map((note) => note.userId === user?.id ? { ...note, read: true } : note) })); success('Shaxsiy bildirishnomalaringiz o‘qildi.'); }} className="secondary-button">Shaxsiy bildirishnomalarni o‘qilgan qilish</button></div></section>}
    {tab === 'help' && <section aria-label="Safaringizga yordam"><div className="mb-5"><h2 className="font-display text-2xl">Safaringizga yordam</h2><p className="mt-2 text-sm leading-6 text-muted">Savollaringiz bo‘lsa, o‘zingizga qulay usul bilan bog‘laning.</p></div><ContactCards /><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs leading-6 text-muted">Kelish: {data.settings.checkInTime} · Ketish: {data.settings.checkOutTime}</p><Link to="/app/my-stay" className="secondary-button">Kabinetga qaytish</Link></div></section>}
  </div>;
}
