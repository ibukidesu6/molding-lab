import { createContext } from 'react';
import type { Dict } from './locales/ja';

export interface I18nCtx {
  locale: string;
  d: Dict;
  setLocale: (l: string) => void;
}

/** Kept in its own module so editing a dictionary (HMR) doesn't recreate the context. */
export const I18nContext = createContext<I18nCtx | null>(null);
