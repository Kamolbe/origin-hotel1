import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

export function SettingsIdentity() {
  const { user } = useAuth();
  const { data } = useAppData();
  if (!user) return null;
  const account = data.users.find((item) => item.id === user.id);
  const role = user.role === 'admin' ? 'Administrator' : user.role === 'manager' ? 'Menejer' : 'Mehmon';
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return <section aria-label="Kirilgan hisob" className="surface mb-6 rounded-3xl p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-4"><span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink text-lg font-semibold text-champagne">{initials || <UserRound size={24} />}</span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Kirilgan hisob</p><h2 className="mt-1 break-words text-lg font-semibold">{user.name}</h2><p className="mt-2 flex min-w-0 items-start gap-2 text-xs text-muted"><Mail size={14} className="shrink-0" /><span className="break-all">{user.email}</span></p><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold"><span className="inline-flex items-center gap-1.5 rounded-full bg-champagne/15 px-3 py-1.5"><ShieldCheck size={12} />{role}</span><span className="rounded-full bg-[var(--page)] px-3 py-1.5">{account?.isActive ? 'Faol hisob' : 'Hisob holati: nofaol'}</span></div></div></div><div className="flex flex-wrap gap-2"><Link to="/app/profile" className="secondary-button gap-2"><UserRound size={14} />Profilni tahrirlash</Link><Link to="/" className="secondary-button gap-2">Saytni ko‘rish<ArrowUpRight size={14} /></Link></div></div>{account?.lastLoginAt && <p className="mt-5 border-t border-[var(--line)] pt-4 text-[11px] text-muted">Oxirgi kirish: {new Date(account.lastLoginAt).toLocaleString('uz-UZ')}</p>}</section>;
}
