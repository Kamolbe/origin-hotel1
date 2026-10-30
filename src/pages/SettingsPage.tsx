import { canEditSite } from '../services/managerTeam';
import { CloudStorageSettings } from '../components/CloudStorageSettings';
import { SettingsIdentity } from '../components/SettingsIdentity';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AccountSummary } from '../components/AccountSummary';
import { GuestSettingsPage } from './GuestSettingsPage';
import { RolesOverview } from '../components/RolesOverview';
import { SiteContentSettings } from '../components/SiteContentSettings';
import { HotelContactSettings } from '../components/HotelContactSettings';
import { Select } from '../components/Select';
import { useState, type ReactNode } from 'react';
import { Activity, DatabaseBackup, Database, Globe2, LockKeyhole, Mail, Menu, Palette, Search, ShieldCheck, Upload, UsersRound, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';

const sections = [
  { id: 'site', title: 'Sayt muharriri', icon: Globe2 },
  { id: 'hotel', title: 'Mehmonxona va aloqa', icon: Globe2 },
  { id: 'security', title: 'Xavfsizlik', icon: ShieldCheck },
  { id: 'roles', title: 'Rollar', icon: UsersRound },
  { id: 'communication', title: 'Xabarlar', icon: Mail },
  { id: 'content', title: 'Kontent va media', icon: Upload },
  { id: 'seo', title: 'SEO va integratsiya', icon: Search },
  { id: 'interface', title: 'Menyu va interfeys', icon: Palette },
  { id: 'operations', title: 'Backup va tizim', icon: Database },
] as const;


export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { data, updateData } = useAppData();
  const { theme, toggleTheme } = useTheme();
  const { success } = useToast();
  const { section, editorTab } = useParams();
  const navigate = useNavigate();
  const selectedSection = sections.find((item) => item.id === section);
  const active = selectedSection?.id;
  const settings = data.settings;

  const updateSettings = (patch: (current: typeof settings) => typeof settings) => {
    if (!canEditSite(user, data.users)) return;
    updateData((current) => ({ ...current, settings: patch(current.settings) }));
  };

  const saveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const phone = String(form.get('phone') ?? '').trim();
    if (updateProfile({ name, phone })) success('Profil sozlamalari saqlandi.');
  };

  if (!canEditSite(user, data.users)) return <GuestSettingsPage />;
  if ((section && !selectedSection) || (editorTab && section !== 'site')) return <Navigate to="/app/settings" replace />;
  if (!section) return <div className="animate-rise-in"><PageHeader eyebrow="Tizim boshqaruvi" title="Sozlamalar" description="Hisobingiz va boshqaruv sozlamalarini bir joydan boshqaring." /><SettingsIdentity /><CloudStorageSettings /><nav aria-label="Admin sozlama bo‘limlari" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{sections.map(({ id, title, icon: Icon }) => <Link key={id} to={`/app/settings/${id}`} className="surface flex min-h-28 items-center gap-4 rounded-2xl p-5 transition hover:border-champagne"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-champagne/10 text-champagne"><Icon size={21} /></span><span className="text-sm font-semibold">{title}</span></Link>)}</nav></div>;

  return <div className="animate-rise-in">
    <PageHeader eyebrow="Tizim boshqaruvi" title={selectedSection?.title ?? 'Sozlamalar'} description="O‘zgarishlarni shu bo‘limdan boshqaring." />
      <div className="space-y-5">
        {active === 'site' && canEditSite(user, data.users) && <SiteContentSettings />}
        {active === 'hotel' && canEditSite(user, data.users) && <HotelContactSettings />}
        {active === 'security' && <>
          <AccountSummary />
          <Panel title="Profil va parol himoyasi" icon={LockKeyhole}><form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2"><Field label="Ism"><input name="name" defaultValue={user?.name} className="field" /></Field><Field label="Telefon"><input name="phone" defaultValue={data.users.find((item) => item.id === user?.id)?.phone ?? ''} className="field" /></Field><div className="sm:col-span-2 flex justify-end"><button className="primary-button">Profilni saqlash</button></div></form></Panel>
          {canEditSite(user, data.users) && <Panel title="Kiruvchilarga oid xavfsizlik" icon={ShieldCheck}><Toggle label="Kuchli parol talab qilish" checked={settings.security.requireStrongPasswords} onChange={(value) => updateSettings((current) => ({ ...current, security: { ...current.security, requireStrongPasswords: value } }))} /><Toggle label="SSL / HTTPS majburiy" checked={settings.security.sslHttps} onChange={(value) => updateSettings((current) => ({ ...current, security: { ...current.security, sslHttps: value } }))} /><Toggle label="Ikki bosqichli tasdiqlash" checked={settings.security.twoFactorEnabled} onChange={(value) => updateSettings((current) => ({ ...current, security: { ...current.security, twoFactorEnabled: value } }))} /><IpBlockList value={settings.security.blockedIps} onSave={(blockedIps) => updateSettings((current) => ({ ...current, security: { ...current.security, blockedIps } }))} /></Panel>}
        </>}
        {active === 'roles' && <Panel title="Foydalanuvchi rollari va ruxsatlar" icon={UsersRound}><RolesOverview roles={settings.roles} /></Panel>}
        {active === 'communication' && <><Panel title="Email (SMTP)" icon={Mail}><Toggle label="SMTP bildirishnomalar" checked={settings.integrations.smtpEnabled} onChange={(value) => updateSettings((current) => ({ ...current, integrations: { ...current.integrations, smtpEnabled: value } }))} /><div className="grid gap-3 sm:grid-cols-2"><Field label="SMTP host"><input value={settings.integrations.smtpHost} onChange={(event) => updateSettings((current) => ({ ...current, integrations: { ...current.integrations, smtpHost: event.target.value } }))} className="field" placeholder="smtp.example.com" /></Field><Field label="Port"><input type="number" value={settings.integrations.smtpPort} onChange={(event) => updateSettings((current) => ({ ...current, integrations: { ...current.integrations, smtpPort: Number(event.target.value) } }))} className="field" /></Field></div></Panel><Panel title="SMS xabarnomalar" icon={Wifi}><Toggle label="SMS bildirishnomalar" checked={settings.integrations.smsEnabled} onChange={(value) => updateSettings((current) => ({ ...current, integrations: { ...current.integrations, smsEnabled: value } }))} /><Field label="Provider"><input value={settings.integrations.smsProvider} onChange={(event) => updateSettings((current) => ({ ...current, integrations: { ...current.integrations, smsProvider: event.target.value } }))} className="field" placeholder="Eskiz, Twilio" /></Field></Panel></>}
        {active === 'content' && <Panel title="Sharhlar va media yuklash" icon={Upload}><Toggle label="Sharhlarni qabul qilish" checked={settings.content.commentsEnabled} onChange={(value) => updateSettings((current) => ({ ...current, content: { ...current.content, commentsEnabled: value } }))} /><div className="grid gap-3 sm:grid-cols-2"><Field label="Moderatsiya"><Select value={settings.content.commentsModeration} onChange={(event) => updateSettings((current) => ({ ...current, content: { ...current.content, commentsModeration: event.target.value as 'auto' | 'manual' } }))} className="field"><option value="auto">Avtomatik</option><option value="manual">Qo‘lda tekshirish</option></Select></Field><Field label="Maksimal hajm (MB)"><input type="number" min="1" value={settings.content.maxUploadMb} onChange={(event) => updateSettings((current) => ({ ...current, content: { ...current.content, maxUploadMb: Number(event.target.value) } }))} className="field" /></Field></div><div className="mt-4"><p className="mb-2 text-[10px] font-semibold text-muted">Ruxsat berilgan formatlar</p><div className="flex flex-wrap gap-2">{settings.content.allowedFormats.map((format) => <span key={format} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[10px]">{format}</span>)}</div></div></Panel>}
        {active === 'seo' && <><Panel title="SEO meta ma’lumotlari" icon={Globe2}><div className="grid gap-3"><Field label="Standart sarlavha"><input value={settings.seo.title} onChange={(event) => updateSettings((current) => ({ ...current, seo: { ...current.seo, title: event.target.value } }))} className="field" /></Field><Field label="Meta tavsif"><textarea value={settings.seo.description} onChange={(event) => updateSettings((current) => ({ ...current, seo: { ...current.seo, description: event.target.value } }))} className="field min-h-24" /></Field><Field label="Kalit so‘zlar"><input value={settings.seo.keywords} onChange={(event) => updateSettings((current) => ({ ...current, seo: { ...current.seo, keywords: event.target.value } }))} className="field" /></Field></div></Panel><Panel title="Tahlil va indeksatsiya" icon={Activity}><div className="grid gap-3 sm:grid-cols-3"><Field label="Google Analytics"><input value={settings.seo.googleAnalyticsId} onChange={(event) => updateSettings((current) => ({ ...current, seo: { ...current.seo, googleAnalyticsId: event.target.value } }))} className="field" placeholder="G-..." /></Field><Field label="Yandex Metrika"><input value={settings.seo.yandexMetrikaId} onChange={(event) => updateSettings((current) => ({ ...current, seo: { ...current.seo, yandexMetrikaId: event.target.value } }))} className="field" /></Field><Field label="Facebook Pixel"><input value={settings.seo.facebookPixelId} onChange={(event) => updateSettings((current) => ({ ...current, seo: { ...current.seo, facebookPixelId: event.target.value } }))} className="field" /></Field></div><Toggle label="Sitemap avtogeneratsiyasi" checked={settings.seo.sitemapEnabled} onChange={(value) => updateSettings((current) => ({ ...current, seo: { ...current.seo, sitemapEnabled: value } }))} /><Field label="robots.txt"><textarea value={settings.seo.robotsDirectives} onChange={(event) => updateSettings((current) => ({ ...current, seo: { ...current.seo, robotsDirectives: event.target.value } }))} className="field min-h-28 font-mono" /></Field></Panel></>}
        {active === 'interface' && <><Panel title="Mavzu, rang va shrift" icon={Palette}><button type="button" onClick={toggleTheme} className="w-full rounded-xl border border-[var(--line)] p-4 text-left text-sm">Mavzu: <b>{theme === 'light' ? 'Yorug‘' : 'Qorong‘i'}</b></button><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Asosiy rang"><input type="color" value={settings.interface.accentColor} onChange={(event) => updateSettings((current) => ({ ...current, interface: { ...current.interface, accentColor: event.target.value } }))} className="field h-12" /></Field><Field label="Sahifa foni"><input type="color" value={settings.interface.pageColor ?? '#f5f4f0'} onChange={(event) => updateSettings((current) => ({ ...current, interface: { ...current.interface, pageColor: event.target.value } }))} className="field h-12" /></Field><Field label="Karta foni"><input type="color" value={settings.interface.surfaceColor ?? '#ffffff'} onChange={(event) => updateSettings((current) => ({ ...current, interface: { ...current.interface, surfaceColor: event.target.value } }))} className="field h-12" /></Field><Field label="Matn rangi"><input type="color" value={settings.interface.textColor ?? '#17262d'} onChange={(event) => updateSettings((current) => ({ ...current, interface: { ...current.interface, textColor: event.target.value } }))} className="field h-12" /></Field><Field label="Shrift"><Select value={settings.interface.font} onChange={(event) => updateSettings((current) => ({ ...current, interface: { ...current.interface, font: event.target.value as 'Manrope' | 'Inter' | 'Georgia' } }))} className="field"><option>Manrope</option><option>Inter</option><option>Georgia</option></Select></Field></div><p className="mt-4 text-xs leading-6 text-muted">Fon va matn ranglari yorug‘ mavzuga qo‘llanadi; qorong‘i mavzu o‘z kontrastini saqlaydi.</p><button type="button" className="secondary-button mt-3" onClick={() => updateSettings((current) => ({ ...current, interface: { ...current.interface, accentColor: '#b99a68', font: 'Manrope', pageColor: undefined, surfaceColor: undefined, textColor: undefined } }))}>Standart dizaynni tiklash</button></Panel><Panel title="Menyular va sahifa bloklari" icon={Menu}><p className="text-xs leading-6 text-muted">Menyu yozuvlarini Sayt muharriri → Matnlar bo‘limida, ko‘rinadigan bloklarni Sahifa bo‘limlari ichida boshqaring.</p><button type="button" onClick={() => navigate('/app/settings/site')} className="secondary-button mt-4">Sayt muharririni ochish</button></Panel></>}
        {active === 'operations' && <><Panel title="Avtomatik zaxira" icon={DatabaseBackup}><Toggle label="Avtomatik backup" checked={settings.operations.backupEnabled} onChange={(value) => updateSettings((current) => ({ ...current, operations: { ...current.operations, backupEnabled: value } }))} /><div className="grid gap-3 sm:grid-cols-2"><Field label="Takrorlanish"><Select value={settings.operations.backupFrequency} onChange={(event) => updateSettings((current) => ({ ...current, operations: { ...current.operations, backupFrequency: event.target.value as 'daily' | 'weekly' } }))} className="field"><option value="daily">Har kun</option><option value="weekly">Har hafta</option></Select></Field><Field label="Vaqt"><input type="time" value={settings.operations.backupTime} onChange={(event) => updateSettings((current) => ({ ...current, operations: { ...current.operations, backupTime: event.target.value } }))} className="field" /></Field></div></Panel><Panel title="Tizim holati va texnik rejim" icon={Activity}><SystemStatus /><Toggle danger label="Texnik xizmat rejimi" checked={settings.operations.maintenanceMode} onChange={(value) => updateSettings((current) => ({ ...current, operations: { ...current.operations, maintenanceMode: value } }))} /></Panel></>}
      </div>
  </div>;
}


function Panel({ title, icon: Icon, children }: { title: string; icon: typeof ShieldCheck; children: ReactNode }) { return <section className="settings-panel surface overflow-hidden rounded-2xl"><div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-champagne/10 text-champagne"><Icon size={17} /></span><h2 className="font-display text-xl">{title}</h2></div><div className="space-y-4 p-5">{children}</div></section>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-muted">{label}</span>{children}</label>; }
function Toggle({ label, checked, onChange, danger = false }: { label: string; checked: boolean; onChange: (value: boolean) => void; danger?: boolean }) { return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--line)] px-4 py-3"><span className={`text-xs font-semibold ${danger ? 'text-danger' : ''}`}>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[var(--champagne)]" /></label>; }
function IpBlockList({ value, onSave }: { value: string[]; onSave: (value: string[]) => void }) { const [draft, setDraft] = useState(value.join('\n')); return <div><label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-muted">Bloklangan IP manzillar (har qatorda bitta)</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="field min-h-24 font-mono" /></label><button type="button" onClick={() => onSave(draft.split(/\n|,/).map((item) => item.trim()).filter(Boolean))} className="secondary-button mt-3">IP ro‘yxatini saqlash</button></div>; }
function EditableList({ label, value, onSave }: { label: string; value: string[]; onSave: (value: string[]) => void }) { const [draft, setDraft] = useState(value.join('\n')); return <div><label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-muted">{label} (har qatorda bitta)</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="field min-h-24" /></label><button type="button" onClick={() => onSave(draft.split('\n').map((item) => item.trim()).filter(Boolean))} className="secondary-button mt-3">Ro‘yxatni saqlash</button></div>; }
function SystemStatus() { return <div className="grid gap-3 sm:grid-cols-3"><StatusMetric label="Xotira" value="64%" /><StatusMetric label="Tizim" value="Frontend demo" /><StatusMetric label="Ma’lumotlar" value="localStorage" /></div>; }
function StatusMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[var(--line)] bg-[var(--page)] p-4"><p className="text-[9px] uppercase tracking-widest text-muted">{label}</p><p className="mt-2 text-sm font-semibold">{value}</p></div>; }
