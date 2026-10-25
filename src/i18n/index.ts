import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "./locales/ar";
import en from "./locales/en";
import ru from "./locales/ru";
import tr from "./locales/tr";
import uz from "./locales/uz";
import zh from "./locales/zh";

export const LANGUAGE_STORAGE_KEY = "originhotel-language";

export const supportedLanguages = [
  { code: "uz", label: "O‘zbekcha", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "zh", label: "简体中文", flag: "🇨🇳" },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]["code"];

const isSupportedLanguage = (value: string): value is SupportedLanguage =>
  supportedLanguages.some(({ code }) => code === value);

const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window === "undefined") return "uz";

  try {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage && isSupportedLanguage(savedLanguage) ? savedLanguage : "uz";
  } catch {
    return "uz";
  }
};

const syncDocumentLanguage = (language: string): void => {
  if (typeof document === "undefined") return;

  const normalizedLanguage = language.toLowerCase().split("-")[0];
  document.documentElement.lang = normalizedLanguage;
  document.documentElement.dir = normalizedLanguage === "ar" ? "rtl" : "ltr";
};

const persistLanguage = (language: string): void => {
  const normalizedLanguage = language.toLowerCase().split("-")[0];
  if (!isSupportedLanguage(normalizedLanguage)) return;

  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
    }
  } catch {
    // Language switching still works when storage is unavailable.
  }

  syncDocumentLanguage(normalizedLanguage);
};

const initialLanguage = getInitialLanguage();

const resources = {
  uz: { translation: uz },
  ru: { translation: ru },
  en: { translation: en },
  tr: { translation: tr },
  ar: { translation: ar },
  zh: { translation: zh },
} as const;

i18n.on("languageChanged", persistLanguage);

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "uz",
  supportedLngs: supportedLanguages.map(({ code }) => code),
  load: "languageOnly",
  interpolation: { escapeValue: false },
  returnNull: false,
});

syncDocumentLanguage(initialLanguage);

export { i18n };
export default i18n;
