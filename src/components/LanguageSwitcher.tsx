import { Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { i18n, supportedLanguages, type SupportedLanguage } from '../i18n';

export function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const { i18n: activeI18n } = useTranslation();
  const current = supportedLanguages.find(({ code }) => code === activeI18n.language.split('-')[0]) ?? supportedLanguages[0];
  const skin = light
    ? 'border-white/20 bg-white/10 text-white hover:bg-white/15'
    : 'border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--page)]';

  return (
    <label className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${skin}`}>
      <Globe2 size={14} aria-hidden="true" />
      <span aria-hidden="true">{current.flag}</span>
      <select
        aria-label="Tilni tanlang"
        value={current.code}
        onChange={(event) => void i18n.changeLanguage(event.target.value as SupportedLanguage)}
        className="max-w-[108px] cursor-pointer appearance-none bg-transparent outline-none"
      >
        {supportedLanguages.map((language) => (
          <option key={language.code} value={language.code} className="text-ink">{language.flag} {language.label}</option>
        ))}
      </select>
    </label>
  );
}
