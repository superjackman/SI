export type Lang = 'zh' | 'en';
/** Every user-visible string is a pair. One-off text is written inline as a Bi; shared text lives in CODES. */
export interface Bi { zh: string; en: string }
