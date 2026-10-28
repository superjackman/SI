/* R39: one page of layers 1, 2, 3 or 5, already in the reader's language. */
import type { Mode, View } from './geo';

export interface LxPg {
  id: string; mode: Mode; v: View | null;
  /** the top bar (HTML), the crumb ([text, href | null]) and the info box: title, what / parts / how / why */
  top: string; crumb: [string, string | null][]; ttl: string; info: [string, string, string, string];
  /** the card for this page; `math` = a layer-5 card for 看数学, or `mg` = [label, hash] back into layer 4 */
  k: string; math: string | null; mg?: [string, string];
  hint: string; dots: [number, number] | null; ent?: [string, string, boolean?][]; next: string;
  /** panel HTML; `xl` = the glowing panel; `px` = where the panel starts in left mode (design units) */
  panel: string; xl?: boolean; px?: number;
  /** chart pages (layer 5): a picture panel above the text panel */
  chart?: string;
  /** node / frame id → the hash a tap goes to */
  go: Record<string, string>;
}
