import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

export const LOCALE_STORAGE_KEY = 'sovereign-ui-locale';
export type AppLocale = 'en' | 'fr';

export function getStoredLocale(): AppLocale {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === 'fr' ? 'fr' : 'en';
}

export function setStoredLocale(locale: AppLocale): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}

let initialized = false;

/** Idempotent i18n bootstrap — safe to call from dashboards and console plugins. */
export function initI18n(locale?: AppLocale): typeof i18n {
  const lng = locale ?? getStoredLocale();
  if (!initialized) {
    void i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        fr: { translation: fr },
      },
      lng,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      returnNull: false,
    });
    initialized = true;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lng;
    }
  } else if (i18n.language !== lng) {
    void i18n.changeLanguage(lng);
  }
  return i18n;
}

export { i18n };
export { SovereignI18nProvider } from './SovereignI18nProvider';
export type { SovereignI18nProviderProps } from './SovereignI18nProvider';
export { LanguageToggle } from './LanguageToggle';
export type { LanguageToggleProps } from './LanguageToggle';
