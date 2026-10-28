/* R38: the five-part knowledge cards (K01–K15) and the layer-5 maths cards (KM01–KM12), one JSON per language,
   loaded only when a card is opened. s = [① name, ② what for, ③ made of, ④ how it works, ⑤ why so] as HTML. */
import type { L, Nd } from '../txt';
export interface Card { n: string; hl: Nd[]; fr: boolean; bk: boolean; no: string; s: [string, string, string, string, string] }
const cache: Partial<Record<L, Promise<Record<string, Card>>>> = {};
export function cards(l: L): Promise<Record<string, Card>> {
  return (cache[l] ??= (l === 'en' ? import('./k-en.json') : import('./k-zh.json')).then((m) => (m as unknown as { default: Record<string, Card> }).default));
}
export const isCard = (id: string) => /^K(0[1-9]|1[0-5])$|^KM(0[1-9]|1[0-2])$/.test(id);
