/* R42: one crumb shape everywhere — 首页 › 第N层 <its colloquial name> › … ; the name shortens to 第N层 when the trail is long,
   and the 解码块 grouping (not a page) is dropped */
import { UI, tx, type L } from './txt';

export type Crumb = [string, string | null][];
const LAYER = /^(?:第\s*(\d)\s*层|Layer\s*(\d))/;
export function normCrumb(c: Crumb, l: L): Crumb {
  const home = tx(UI.home, l);
  let out: Crumb = c.filter(([t]) => !/^(解码块|Decoder block)$/.test(t.trim()));
  if (!out.length || out[0]![0] !== home) out = [[home, '#home'], ...out];
  out = out.map(([t, h], i) => [i > 1 ? t.replace(/^M\d+[a-z]?\s+/, '') : t, h]); // no ids in the trail (M8 归一化 → 归一化)
  const it = out[1]; if (!it) return out;
  const m = LAYER.exec(it[0].trim()); const n = m ? Number(m[1] ?? m[2]) : /^Transformer\b/.test(it[0].trim()) ? 4 : 0;
  if (n >= 1 && n <= 5) {
    const lv = tx(UI.lv[n - 1]!, l);
    const full = `${lv} ${tx(UI.lvN[n - 1]!, l)}`, u = (t: string) => [...t].reduce((a, ch) => a + (ch.charCodeAt(0) > 0x2e80 ? 2 : 1), 0);
    /* the colloquial name only when the whole trail stays short (en names are long: Layer 3 How a big model is made) */
    const w = out.reduce((a, [t], i) => a + (i === 1 ? u(full) : u(t)) + 3, 0);
    out[1] = [out.length <= 3 && w <= 50 ? full : lv, it[1]];
  }
  return out;
}
