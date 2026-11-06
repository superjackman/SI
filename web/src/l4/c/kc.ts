/* R39: the five-part knowledge cards, one JSON per language and per group, loaded only when a card is opened:
   k = K01–K15 (layer 4) + KM01–KM14 (layer 5); k1 = KA01–KA09 (layer 1) + KB01–KB09 (layer 2); k3 = KC01–KC15 (layer 3).
   s = [① name, ② what for, ③ made of, ④ how it works, ⑤ why so] as HTML; mk/ar = which small diagram and lit arrows. */
import type { L } from '../txt';
export interface Card { n: string; hl: string[]; fr: boolean | string[]; bk: boolean; no: string; mk?: 'l1' | 'l2' | 'l3'; ar?: string[]; s: [string, string, string, string, string] }
type G = 'k' | 'k1' | 'k3';
const cache: Partial<Record<string, Promise<Record<string, Card>>>> = {};
const LOAD: Record<G, Record<L, () => Promise<unknown>>> = {
  k: { zh: () => import('./k-zh.json'), en: () => import('./k-en.json') },
  k1: { zh: () => import('./k1-zh.json'), en: () => import('./k1-en.json') },
  k3: { zh: () => import('./k3-zh.json'), en: () => import('./k3-en.json') },
};
export const groupOf = (id: string): G => (/^K[AB]/.test(id) ? 'k1' : id.startsWith('KC') ? 'k3' : 'k');
export function cards(l: L, id = 'K01'): Promise<Record<string, Card>> {
  const g = groupOf(id);
  // R49: {#key} numbers come from the shared table in dv/nums.ts (loaded with the cards, not up front)
  return (cache[g + l] ??= Promise.all([LOAD[g][l](), import('../../dv/nums')]).then(([m, N]) =>
    N.deepFill((m as { default: Record<string, Card> }).default, (s) => N.fillCardText(s, l))));
}
export const isCard = (id: string) => /^K(0[1-9]|1[0-6])$|^KM(0[1-9]|1[0-4])$|^KA0[1-9]$|^KB0[1-9]$|^KC(0[1-9]|1[0-5])$/.test(id);
