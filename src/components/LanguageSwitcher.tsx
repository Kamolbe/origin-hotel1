import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { i18n, supportedLanguages, type SupportedLanguage } from '../i18n';

export function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const { i18n: activeI18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = supportedLanguages.find(({ code }) => code === activeI18n.language.split('-')[0]) ?? supportedLanguages[0];
  const skin = light
    ? 'border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15'
    : 'border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:border-champagne/60 hover:bg-[var(--page)]';

  useEffect(() => {
    const handleOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', handleOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const selectLanguage = (code: SupportedLanguage) => {
    void i18n.changeLanguage(code);
    setOpen(false);
  };

  return <div
    ref={rootRef}
    className="relative"
    onMouseEnter={() => setOpen(true)}
    onMouseLeave={() => setOpen(false)}
  >
    <button
      type="button"
      aria-label="Tilni tanlang"
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={() => setOpen((value) => !value)}
      className={`flex h-10 min-w-[108px] items-center gap-2 rounded-full border px-3 text-xs font-semibold transition ${skin}`}
    >
      <Globe2 size={14} aria-hidden="true" />
      <span aria-hidden="true" className="text-base leading-none">{current.flag}</span>
      <ChevronDown size={13} className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
    </button>

    {open && <div role="menu" aria-label="Tilni tanlang" className="absolute right-0 top-full z-[70] w-[230px] pt-2">
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-lift">
        <p className="px-3 pb-1 pt-2 text-[9px] font-bold uppercase tracking-[.18em] text-champagne">Tilni tanlang</p>
        {supportedLanguages.map((language) => {
          const selected = language.code === current.code;
          return <button
            key={language.code}
            type="button"
            role="menuitem"
            onClick={() => selectLanguage(language.code)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition ${selected ? 'bg-champagne/10 text-[var(--text)]' : 'text-muted hover:bg-[var(--page)] hover:text-[var(--text)]'}`}
          >
            <span aria-hidden="true" className="text-lg leading-none">{language.flag}</span>
            <span className="font-semibold">{language.label}</span>
            {selected && <Check size={14} className="ml-auto text-champagne" aria-hidden="true" />}
          </button>;
        })}
      </div>
    </div>}
  </div>;
}
