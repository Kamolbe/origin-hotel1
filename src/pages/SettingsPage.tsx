import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { data, updateData } = useAppData();
  const { theme, toggleTheme } = useTheme();
  const { success } = useToast();

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const phone = String(form.get('phone') ?? '').trim();
    if (updateProfile({ name, phone })) success('Profil sozlamalari saqlandi.');
  }

  function changeCurrency(currency: 'UZS' | 'USD' | 'EUR') {
    updateData((current) => ({ ...current, settings: { ...current.settings, currency } }));
  }

  return <div><PageHeader eyebrow="Shaxsiy va tizim" title="Sozlamalar" description="Profil, tashqi ko‘rinish va mehmonxona parametrlari." />
    <div className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="surface rounded-3xl p-5 sm:p-7"><h2 className="font-display text-2xl">Profil</h2><label className="mt-5 block"><span className="mb-1.5 block text-xs font-semibold">Ism</span><input name="name" defaultValue={user?.name} required className="w-full rounded-xl border border-[var(--line)] bg-[var(--page)] px-4 py-3 text-sm" /></label><label className="mt-4 block"><span className="mb-1.5 block text-xs font-semibold">Telefon</span><input name="phone" defaultValue={data.users.find((item) => item.id === user?.id)?.phone ?? ''} className="w-full rounded-xl border border-[var(--line)] bg-[var(--page)] px-4 py-3 text-sm" /></label><button className="mt-5 rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white">Saqlash</button></form>
      <section className="surface rounded-3xl p-5 sm:p-7"><h2 className="font-display text-2xl">Tashqi ko‘rinish va valyuta</h2><button type="button" onClick={toggleTheme} className="mt-5 w-full rounded-xl border border-[var(--line)] p-4 text-left text-sm">Mavzu: <b>{theme === 'light' ? 'Yorug‘' : 'Qorong‘i'}</b></button><label className="mt-4 block"><span className="mb-1.5 block text-xs font-semibold">Valyuta</span><select value={data.settings.currency} onChange={(event) => changeCurrency(event.target.value as 'UZS' | 'USD' | 'EUR')} className="w-full rounded-xl border border-[var(--line)] bg-[var(--page)] px-4 py-3 text-sm"><option>UZS</option><option>USD</option><option>EUR</option></select></label></section>
    </div>
  </div>;
}
