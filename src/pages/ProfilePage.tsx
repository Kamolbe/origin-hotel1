import { useTranslation } from 'react-i18next';
import { PersonalDataSettings } from '../components/PersonalDataSettings';
import { SettingsIdentity } from '../components/SettingsIdentity';
import { Select } from '../components/Select';
import { useTheme } from '../context/ThemeContext';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { supportedLanguages } from '../i18n';

export function ProfilePage() {
  const { i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { preferences, save } = useUserPreferences();
  return <div className="surface animate-rise-in rounded-3xl p-4 sm:p-7" aria-label="Shaxsiy profil">
    <SettingsIdentity withProfile embedded showCompletion />
    <section aria-label="Shaxsiy ko‘rinish" className="mt-6 border-t border-[var(--line)] pt-6">
      <h2 className="font-display text-2xl">Sizga mos ko‘rinish</h2>
      <p className="mt-2 text-xs leading-6 text-muted">Til va ko‘rinish tanlovlari shaxsiy hisobingizga saqlanadi.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="min-w-0 text-xs font-semibold"><span className="mb-2 block">Mening tilim</span><Select aria-label="Mening tilim" value={i18n.language.split('-')[0]} onChange={(event) => { const language = event.target.value; void i18n.changeLanguage(language); save({ language }); }} className="field">{supportedLanguages.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}</Select></label>
        <label className="min-w-0 text-xs font-semibold"><span className="mb-2 block">Mening mavzum</span><Select aria-label="Mening mavzum" value={theme} onChange={(event) => { const theme = event.target.value as 'light' | 'dark'; setTheme(theme); save({ theme }); }} className="field"><option value="light">Yorug‘</option><option value="dark">Qorong‘i</option></Select></label>
      </div>
      <label className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-[var(--page)] p-4"><span><span className="block text-sm font-semibold">Kamroq animatsiya</span><span className="mt-1 block text-xs leading-5 text-muted">Harakatli effektlarni kamaytirish.</span></span><input aria-label="Kamroq animatsiya" type="checkbox" checked={preferences.reducedMotion} onChange={(event) => save({ reducedMotion: event.target.checked })} className="h-4 w-4 shrink-0 accent-[var(--champagne)]" /></label>
    </section>
    <div className="mt-6 border-t border-[var(--line)] pt-6"><PersonalDataSettings embedded /></div>
  </div>;
}
