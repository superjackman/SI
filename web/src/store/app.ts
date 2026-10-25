import { create } from 'zustand';
import type { Lang } from '../i18n/types';
import { htmlLang, initialLang, STORAGE_KEY, urlWithLang } from '../i18n/lang';
import { parseHash } from '../router/hash';
import { isStation } from '../legacy/kb';

export interface DrillEntry { from: string; to: string; y: number; open: string | null; ph?: boolean }
export interface Popup { id: string; tab: number }
export type Sheet = 'toc' | 'lab' | 'prog' | 'next' | 'more';
interface AppState {
  lang: Lang;
  langSource: 'url' | 'saved' | 'browser' | 'manual';
  station: string;
  /** bumps on every navigation so effects (scroll) re-run even for the same station */
  navSeq: number;
  popup: Popup | null;
  /** cards opened from inside a popup (↩ inside the popup) */
  cardStack: string[];
  /** station drills (↩ in the crumb / floating) */
  drill: DrillEntry[];
  drawerOpen: boolean;
  /** R22: the bottom bar's sheets (and the ☰ menu's progress / map sheets) */
  sheetOpen: Sheet | false;
  searchOpen: boolean;
  toast: { text: string; n: number } | null;
  full: { host: HTMLElement; station: string } | null;
  /** 使用时 / 训练时 (live: not persisted) */
  mode: 'use' | 'train';
  /** detail level 1 宏观 · 2 中观 · 3 微观 (live LS aiexp.v2.zoom) */
  zoom: 1 | 2 | 3;
  /** guided tour: current step, null when off */
  tour: number | null;
  setLang: (l: Lang) => void;
  set: (p: Partial<AppState>) => void;
}
const init = typeof window !== 'undefined' ? initialLang() : { lang: 'zh' as Lang, source: 'browser' as const };
const r0 = typeof window !== 'undefined' ? parseHash(location.hash) : { station: null, node: null };

function initialZoom(): 1 | 2 | 3 {
  try { const v = JSON.parse(localStorage.getItem('aiexp.v2.zoom') ?? '3') as unknown; return v === 1 || v === 2 ? v : 3; } catch { return 3; }
}
export const useApp = create<AppState>()((set) => ({
  lang: init.lang,
  langSource: init.source,
  station: isStation(r0.station) ? r0.station : 'H', /* R27: the short home page */
  navSeq: 0,
  popup: null,
  cardStack: [],
  drill: [],
  drawerOpen: false,
  sheetOpen: false,
  searchOpen: false,
  toast: null,
  full: null,
  mode: 'use',
  zoom: initialZoom(),
  tour: null,
  setLang: (l) => {
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* private mode */ }
    try { history.replaceState(history.state, '', urlWithLang(location, l)); } catch { /* file: etc. */ }
    document.documentElement.lang = htmlLang(l);
    set({ lang: l, langSource: 'manual' });
  },
  set: (p) => set(p),
}));
export const initialNode = r0.node;
