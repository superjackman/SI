/* the one piece of shared state: the page language (src/i18n/lang.ts rules). A plain (no React) zustand store:
   the explorer (src/l4) and the boot helpers read it with getState() and follow it with subscribe(). */
import { createStore } from 'zustand/vanilla';
import type { Lang } from '../i18n/types';
import { htmlLang, initialLang, STORAGE_KEY, urlWithLang } from '../i18n/lang';

interface AppState {
  lang: Lang;
  langSource: 'url' | 'saved' | 'browser' | 'manual';
  setLang: (l: Lang) => void;
}
const init = typeof window !== 'undefined' ? initialLang() : { lang: 'zh' as Lang, source: 'browser' as const };
export const useApp = createStore<AppState>()((set) => ({
  lang: init.lang,
  langSource: init.source,
  setLang: (l) => {
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* private mode */ }
    try { history.replaceState(history.state, '', urlWithLang(location, l)); } catch { /* file: etc. */ }
    document.documentElement.lang = htmlLang(l);
    set({ lang: l, langSource: 'manual' });
  },
}));
