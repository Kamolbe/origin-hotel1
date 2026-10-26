import { Link } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

export function AccountSummary() {
  const { user } = useAuth();
  const { data } = useAppData();
  const account = data.users.find((item) => item.id === user?.id);
  const guest = data.guests.find((item) => item.email.toLowerCase() === user?.email.toLowerCase());
  const date = (value?: string) => value ? new Date(value).toLocaleString('uz-UZ') : 'Qayd etilmagan';
  const fields = [
    ['Ism va familiya', user?.name], ['Email', user?.email], ['Telefon', account?.phone || guest?.phone || 'Kiritilmagan'],
    ['Hisob turi', user?.role === 'admin' ? 'Administrator' : user?.role === 'manager' ? 'Manager' : 'Mehmon'],
    ['Ro‘yxatdan o‘tgan', date(account?.createdAt)], ['Oxirgi kirish', date(account?.lastLoginAt)],
    ['Hisob holati', account?.isActive ? 'Faol' : 'Nofaol'], ['Fuqarolik', guest?.nationality || 'Kiritilmagan'],
  ];
  return <section className="surface rounded-3xl p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="flex items-center gap-3 font-display text-2xl"><UserRound size={23} className="text-champagne" />Shaxsiy ma’lumotlar</h2><Link to="/app/profile" className="secondary-button">Profilni tahrirlash</Link></div><dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</dt><dd className="mt-1.5 break-words text-sm font-medium">{value}</dd></div>)}</dl></section>;
}
