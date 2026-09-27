import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext as Ctx } from './context';
import ja, { type Dict } from './locales/ja';
import en from './locales/en';

/**
 * Locale registry. To add a language (e.g. zh, vi):
 *   1. create locales/zh.ts exporting a `Dict`
 *   2. add it here — the switcher picks it up automatically.
 */
export const LOCALES = { ja, en } satisfies Record<string, Dict>;
export type LocaleId = keyof typeof LOCALES;

const KEY = 'molding-lab/locale';

function initialLocale(): LocaleId {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && saved in LOCALES) return saved as LocaleId;
  } catch {
    /* ignore */
  }
  return navigator.language?.startsWith('ja') ? 'ja' : 'en';
}

interface I18nValue {
  locale: LocaleId;
  d: Dict;
  setLocale: (l: LocaleId) => void;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleId>(initialLocale);
  const d = LOCALES[locale];

  useEffect(() => {
    document.documentElement.lang = d.meta.htmlLang;
  }, [d]);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      d,
      setLocale: (l: LocaleId) => {
        setLocaleState(l);
        try {
          localStorage.setItem(KEY, l);
        } catch {
          /* ignore */
        }
      },
    }),
    [locale, d],
  );
  return <Ctx.Provider value={value as never}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useI18n outside I18nProvider');
  return c as unknown as I18nValue;
}

/** Tiny formatter: fmt('Cycle under {n}s', { n: 24 }) */
export function fmt(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
