import type { Bi } from './types';
/** Text used in more than one place gets a code here (zh + en side by side). Typos in keys fail type-checking. */
export const CODES = {
  'site.title': { zh: '大白话拆解 AI', en: 'AI, explained plainly' },
  'upd.banner': { zh: '有新版本，点此刷新', en: 'A new version is available, tap to refresh' },
  'ui.close': { zh: '关闭', en: 'Close' },
} as const satisfies Record<string, Bi>;
export type Code = keyof typeof CODES;
