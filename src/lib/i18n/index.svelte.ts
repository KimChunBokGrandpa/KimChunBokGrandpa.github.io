/**
 * i18n Store — Simple reactive internationalization using Svelte 5 runes.
 * Supports English, Korean, Japanese.
 */
import { en, type TranslationKey } from './en';
import { ko } from './ko';
import { ja } from './ja';

export type Locale = 'en' | 'ko' | 'ja';

const translations: Record<Locale, Record<TranslationKey, string>> = { ja, en, ko };

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
};

const storageKey = 'retro-pixel-locale';

function syncDocumentLanguage(locale: Locale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
}

function loadLocale(): Locale {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved && saved in translations) return saved as Locale;
  } catch { /* ignore */ }
  // Auto-detect from browser
  const lang = navigator.language.slice(0, 2);
  if (lang === 'ko') return 'ko';
  if (lang === 'ja') return 'ja';
  return 'en';
}

const initialLocale = loadLocale();
syncDocumentLanguage(initialLocale);
let currentLocale = $state<Locale>(initialLocale);

/** Module-level singleton for global access */
export const i18n = {
  get locale() { return currentLocale; },
  set locale(v: Locale) {
    currentLocale = v;
    syncDocumentLanguage(v);
    try { localStorage.setItem(storageKey, v); } catch { /* ignore */ }
  },
  /** Translate a key, with optional {0}, {1} parameter substitution */
  t(key: TranslationKey, ...args: (string | number)[]): string {
    let str = translations[currentLocale]?.[key] ?? translations.en[key] ?? key;
    for (let i = 0; i < args.length; i++) {
      str = str.replace(`{${i}}`, String(args[i]));
    }
    return str;
  },
};
