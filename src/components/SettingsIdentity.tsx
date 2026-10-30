import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Mail, Pencil, ShieldCheck, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';

export function SettingsIdentity({ withProfile = false, embedded = false, showCompletion = false }: { withProfile?: boolean; embedded?: boolean; showCompletion?: boolean }) {
  const { user, updateProfile } = useAuth();
  const { data } = useAppData();
  const { success } = useToast();
  const [editing, setEditing] = useState(false);
  if (!user) return null;
  const account = data.users.find((item) => item.id === user.id);
  const guest = data.guests.find((item) => item.email.toLowerCase() === user.email.toLowerCase());
  const role = user.role === 'admin' ? 'Administrator' : user.role === 'manager' ? 'Menejer' : 'Mehmon';
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const formatDate = (value?: string) => value ? new Date(value).toLocaleString('uz-UZ') : 'Qayd etilmagan';
  const fields = [
    ['Telefon', account?.phone || guest?.phone || 'Kiritilmagan'],
    ['Fuqarolik', account?.nationality || guest?.nationality || 'Kiritilmagan'],
    ['Ro‘yxatdan o‘tgan', formatDate(account?.createdAt)],
    ['Oxirgi kirish', formatDate(account?.lastLoginAt)],
  ];
  const missing = [['Ism va familiya', user.name], ['Email', user.email], ['Telefon', account?.phone || guest?.phone], ['Fuqarolik', account?.nationality || guest?.nationality]].filter(([, value]) => !value?.trim()).map(([label]) => label);
  const completion = Math.round((4 - missing.length) / 4 * 100);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (updateProfile({ name: String(form.get('name') ?? '').trim(), phone: String(form.get('phone') ?? '').trim(), nationality: String(form.get('nationality') ?? '').trim() })) {
      success('Shaxsiy ma’lumotlaringiz saqlandi.');
      setEditing(false);
    }
  }
  const actionClass = 'secondary-button min-w-0 gap-1.5 !px-2 !text-[10px] sm:!px-5 sm:!text-xs';
  return <section aria-label="Kirilgan hisob" className={embedded ? 'min-w-0' : 'surface mb-6 rounded-3xl p-4 sm:p-6'}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-lg font-semibold text-champagne sm:h-14 sm:w-14">{initials || <UserRound size={24} />}</span>
        <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Kirilgan hisob</p><h2 className="mt-1 break-words text-base font-semibold sm:text-lg">{user.name}</h2><p className="mt-2 flex min-w-0 items-start gap-2 text-xs text-muted"><Mail size={14} className="shrink-0" /><span className="break-all">{user.email}</span></p><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold"><span className="inline-flex items-center gap-1.5 rounded-full bg-champagne/15 px-3 py-1.5"><ShieldCheck size={12} />{role}</span><span className="rounded-full bg-[var(--page)] px-3 py-1.5">{account?.isActive ? 'Faol hisob' : 'Hisob holati: nofaol'}</span></div></div>
      </div>
      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
        {withProfile ? <button type="button" aria-expanded={editing} aria-controls="settings-profile-editor" onClick={() => setEditing((value) => !value)} className={actionClass}>{editing ? <X size={14} /> : <Pencil size={14} />}{editing ? 'Yopish' : 'Profilni tahrirlash'}</button> : <Link to="/app/profile" className={actionClass}><UserRound size={14} />Profilni tahrirlash</Link>}
        <Link to="/" className={actionClass}>Saytni ko‘rish<ArrowUpRight size={14} /></Link>
      </div>
    </div>
    {showCompletion && <div className="mt-6 rounded-2xl bg-[var(--page)] p-4"><div className="flex items-center justify-between gap-3 text-xs"><h3 className="font-semibold">Profilning to‘ldirilishi</h3><span className="font-bold tabular-nums">{completion}%</span></div><div role="progressbar" aria-label="Profilning to‘ldirilishi" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full rounded-full bg-champagne" style={{ width: `${completion}%` }} /></div><p className="mt-2 text-xs leading-6 text-muted">{missing.length ? `To‘ldirish mumkin: ${missing.join(', ')}. Yuqoridagi “Profilni tahrirlash” tugmasini bosing.` : 'Asosiy profil ma’lumotlaringiz to‘liq kiritilgan.'}</p></div>}
    {withProfile && <div className="mt-5 border-t border-[var(--line)] pt-5">
      {editing ? <form id="settings-profile-editor" aria-label="Hisob ma’lumotlarini tahrirlash" onSubmit={save} className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold">Ism va familiya<input name="name" required minLength={2} maxLength={100} defaultValue={user.name} className="field mt-2" /></label><label className="text-xs font-semibold">Telefon raqamingiz<input name="phone" type="tel" maxLength={30} defaultValue={account?.phone || guest?.phone || ''} className="field mt-2" placeholder="+998…" /></label><label className="text-xs font-semibold sm:col-span-2">Fuqarolik<input name="nationality" aria-label="Fuqarolik" autoComplete="country-name" maxLength={80} defaultValue={account?.nationality || guest?.nationality || ''} className="field mt-2" placeholder="Masalan, O‘zbekiston" /><span className="mt-2 block text-[11px] font-normal leading-5 text-muted">Fuqaroligingizni kiriting va Saqlash tugmasi bilan tasdiqlang.</span></label><p className="text-[11px] leading-6 text-muted sm:col-span-2">Email kirish hisobingizga bog‘langan: {user.email}</p><div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:flex sm:justify-end"><button type="button" onClick={() => setEditing(false)} className="secondary-button">Bekor qilish</button><button className="primary-button gap-2"><Check size={14} />Saqlash</button></div></form> : <dl className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4">{fields.map(([label, value]) => <div key={label} className="min-w-0 rounded-2xl bg-[var(--page)] p-3 sm:p-4"><dt className="text-[9px] font-semibold uppercase tracking-wider text-muted">{label}</dt><dd className="mt-2 break-words text-xs leading-6">{value}</dd></div>)}</dl>}
    </div>}
    {!withProfile && account?.lastLoginAt && <p className="mt-4 border-t border-[var(--line)] pt-4 text-[11px] text-muted">Oxirgi kirish: {formatDate(account.lastLoginAt)}</p>}
  </section>;
}
