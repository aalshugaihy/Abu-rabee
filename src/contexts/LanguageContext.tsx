import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { translations, Locale, TranslationKey } from '../i18n/translations';

type LanguageContextValue = {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'abu-rabee.locale';

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ar';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'ar' || stored === 'en') return stored;
  return 'ar';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);

  const dir: 'rtl' | 'ltr' = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, dir]);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);
  const toggleLocale = useCallback(() => setLocaleState((p) => (p === 'ar' ? 'en' : 'ar')), []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = translations[locale] as Record<string, string>;
      return dict[key] ?? key;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, dir, setLocale, toggleLocale, t }), [locale, dir, setLocale, toggleLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
