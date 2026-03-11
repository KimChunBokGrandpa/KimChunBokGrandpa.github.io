/**
 * i18n Store — Simple reactive internationalization using Svelte 5 runes.
 * Supports English, Korean, Japanese.
 */
import { en, type TranslationKey } from './en';
import { ko } from './ko';
import { ja } from './ja';

export type Locale = 'en' | 'ko' | 'ja';

const translations: Record<Locale, Record<TranslationKey, string>> = { ja, en, ko };

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
};

const STORAGE_KEY = 'retro-pixel-locale';

function loadLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in translations) return saved as Locale;
  } catch { /* ignore */ }
  // Auto-detect from browser
  const lang = navigator.language.slice(0, 2);
  if (lang === 'ko') return 'ko';
  if (lang === 'ja') return 'ja';
  return 'en';
}

let currentLocale = $state<Locale>(loadLocale());

/** Module-level singleton for global access */
export const i18n = {
  get locale() { return currentLocale; },
  set locale(v: Locale) {
    currentLocale = v;
    try { localStorage.setItem(STORAGE_KEY, v); } catch { /* ignore */ }
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
