import { CODES, type Code } from './codes';
import type { Bi, Lang } from './types';
import { useApp } from '../store/app';

export const pick = (b: Bi, l: Lang): string => b[l];
/** shared text by code */
export function useT(): (c: Code) => string {
  const lang = useApp((s) => s.lang);
  return (c) => CODES[c][lang];
}
/** one-off text written inline in both languages */
export function useTx(): (b: Bi) => string {
  const lang = useApp((s) => s.lang);
  return (b) => b[lang];
}
export function L(props: Bi) {
  const lang = useApp((s) => s.lang);
  return <>{props[lang]}</>;
}
/** shared text by code, outside React (imperative shell code) */
export const tx = (c: Code, l: Lang): string => CODES[c][l];
