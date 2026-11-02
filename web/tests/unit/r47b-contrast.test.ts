// R47b 推导之路 contrast: the ①–⑤ chips, layer badges, step numbers, ≈ / 遗留 chips and formula boxes read ≥ 4.5:1 (WCAG AA)
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LBG, LCOL } from '../../src/l4/progress';

const S = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
const css = ['l4/l4.css', 'px/px.css', 'dv/dv.css'].map((f) => fs.readFileSync(path.join(S, f), 'utf8')).join('\n');
const view = fs.readFileSync(path.join(S, 'dv/view.ts'), 'utf8');
const rgb = (h: string) => { const x = h.replace('#', ''); const f = x.length === 3 ? x.split('').map((c) => c + c).join('') : x.slice(0, 6); return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)); };
const lum = (h: string) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
export const ratio = (a: string, b: string) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
/** the declarations of the first rule whose selector list contains `sel` exactly */
const rule = (sel: string) => { for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) if (m[1]!.split(',').map((s) => s.replace(/\/\*[\s\S]*?\*\//g, '').trim()).includes(sel)) return m[2]!; return ''; };
const prop = (sel: string, p: string) => (rule(sel).match(new RegExp(`(?:^|;)\\s*${p}\\s*:\\s*(#[0-9a-fA-F]{3,8})`)) ?? [])[1] ?? '';
const PAGE = '#0a1532'; /* the explorer's panel behind the path */

describe('R47b derivation-path contrast', () => {
  it('the ①–⑤ section chips: dark ink on each pastel, and .px h3 cannot repaint it', () => {
    const ink = prop('.px h3.l4-kh', 'color'); expect(ink).toBe(prop('.l4-kh', 'color'));
    for (const c of [1, 2, 3, 4, 5]) { const bg = prop(`.l4-kh.c${c}`, 'background'); expect(bg, `c${c}`).toMatch(/^#/); expect(ratio(ink, bg), `.l4-kh.c${c} ${ink} on ${bg}`).toBeGreaterThanOrEqual(4.5); }
  });
  it('layer badges and step numbers: white on the deeper layer fill, dark ink on gold', () => {
    LBG.forEach((c, i) => { expect(ratio('#ffffff', c), `layer ${i + 1} ${c}`).toBeGreaterThanOrEqual(4.5); expect(c === LCOL[i] || ratio('#ffffff', LCOL[i]!) < 4.5).toBe(true); });
    expect(rule('.l4-lt')).toMatch(/background:\s*var\(--cb,\s*var\(--c\)\)/); expect(rule('.dv-n')).toMatch(/background:\s*var\(--cb,\s*var\(--c\)\)/);
    const g = view.match(/--cb:\$\{GOLD\};--ct:(#[0-9a-f]{6})/)?.[1], GOLD = view.match(/GOLD = '(#[0-9a-f]{6})'/)?.[1];
    expect(g && GOLD).toBeTruthy(); expect(ratio(g!, GOLD!)).toBeGreaterThanOrEqual(4.5);
  });
  it('≈ chips, 遗留 chips and lines, formula boxes, keywords, the start box and the try-it box', () => {
    const pairs: [string, string, string][] = [
      ['.dv-ap', prop('.dv-ap', 'color'), PAGE], ['.dv-lk span', prop('.dv-lk span', 'color'), PAGE], ['.dv-lk', prop('.dv-lk', 'color'), PAGE],
      ['.l4-ks .formula', prop('.l4-ks .formula', 'color'), prop('.l4-ks .formula', 'background')], ['.l4-ks .k', prop('.l4-ks .k', 'color'), PAGE],
      ['.dv-from span', prop('.dv-from span', 'color'), prop('.dv-from', 'background')], ['.dv-from', prop('.dv-from', 'color'), prop('.dv-from', 'background')],
      ['.dv-do b', prop('.dv-do b', 'color'), prop('.dv-do', 'background')], ['.dv-do', prop('.dv-do', 'color'), prop('.dv-do', 'background')],
      ['.dv-t i', prop('.dv-t i', 'color'), PAGE], ['.dv-rd', prop('.dv-rd', 'color'), PAGE], ['.dv-gp', prop('.dv-gp', 'color'), PAGE], ['.dv-kid', prop('.dv-kid', 'color'), PAGE],
    ];
    for (const [s, fg, bg] of pairs) { expect(fg && bg, s).toBeTruthy(); expect(ratio(fg, bg), `${s} ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5); }
  });
});
