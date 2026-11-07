// R47 自底向上 · 推导之路 (#D): content shape, zh/en parity, card links, approximation marks, routes
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zh0 from '../../src/dv/zh';
import en0 from '../../src/dv/en';
import { deepFill, fillDvText } from '../../src/dv/nums';
// R49: pages read {#key} numbers from dv/nums.ts — test what the reader sees
const zh = deepFill(zh0, (s) => fillDvText(s, 'zh')), en = deepFill(en0, (s) => fillDvText(s, 'en'));
import { DV_ALIAS, DV_K, DV_KEY, DV_LV, DV_N, DV_NM, DV_OF, dvI, isDv } from '../../src/dv/links';
import { seenKeys } from '../../src/dv/view';
import { mk } from '../../src/dv/view';
import type { Card } from '../../src/l4/c/kc';
import { REC_KEYS } from '../../src/store/prefs';

const C = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/l4/c');
const card = (l: string) => Object.assign({}, ...['k', 'k1', 'k3'].map((g) => JSON.parse(fs.readFileSync(path.join(C, `${g}-${l}.json`), 'utf8')) as Record<string, Card>)) as Record<string, Card>;
const CJK = /[\u3000-\u303f\u3400-\u9fff\uff00-\uffef]/;
const text = (s: (typeof zh.st)[number]) => [s.n, s.s, s.e, s.q, ...s.i, ...s.f, ...s.x, s.lo, s.h].join('\n');

describe('R47 derivation path', () => {
  it('23 stations (0, P, 1–7, 8a, 8b, 9, E, 10–14, S, 15a, 15b, A, 16) in both languages, every field filled; the last one is the recap', () => {
    for (const D of [zh, en]) {
      expect(D.st).toHaveLength(DV_N); expect(DV_N).toBe(23); expect(DV_KEY.join(' ')).toBe('0 P 1 2 3 4 5 6 7 8a 8b 9 E 10 11 12 13 14 S 15a 15b A 16'); expect(D.t && D.sub && D.how).toBeTruthy();
      D.st.forEach((s, i) => {
        for (const k of ['n', 's', 'q', 'lo', 'h'] as const) expect(s[k].trim(), `${i}.${k}`).not.toBe('');
        expect(s.i.length, `${i}.i`).toBeGreaterThan(0);
        if (i < DV_N - 1) { expect(s.e.trim(), `${i}.e`).not.toBe(''); expect(s.f.length, `${i}.f`).toBeGreaterThan(0); expect(s.x.length, `${i}.x`).toBeGreaterThan(0); }
      });
      expect(D.st[DV_N - 1]!.e).toBe('');
    }
  });
  it('the same structure in zh and en; English has no Chinese characters; names match the map list', () => {
    zh.st.forEach((s, i) => { const e = en.st[i]!; expect([e.i.length, e.f.length, e.x.length], `stage ${i}`).toEqual([s.i.length, s.f.length, s.x.length]); });
    expect(CJK.test([en.t, en.sub, en.how, ...en.st.map(text)].join('\n'))).toBe(false);
    expect(zh.st.map((s) => s.n)).toEqual(DV_NM.map((x) => x[0])); expect(en.st.map((s) => s.n)).toEqual(DV_NM.map((x) => x[1]));
  });
  it('approximations and empirical claims stay marked {~…} in both languages (~20 tokens/param, ~16 bytes/param, FFN ~4×, scaling laws, emergence)', () => {
    const marks = (D: typeof zh, i: number) => (text(D.st[i]!).match(/\{~[^}]+\}/g) ?? []).length;
    for (const D of [zh, en]) {
      for (const [i, n] of [[6, 1], ['8a', 0], ['8b', 2], [9, 4], [11, 3], [12, 1], ['15b', 2]] as const) expect(marks(D, dvI(i)), `stage ${i}`).toBe(n);
      expect(text(D.st[dvI(9)]!)).toMatch(/20/); expect(text(D.st[dvI(11)]!)).toMatch(/16/); expect(text(D.st[dvI('8b')]!)).toMatch(/4/);
    }
    expect(mk('a {~经验观察} b')).toContain('<span class="dv-ap">≈ 经验观察</span>');
  });
  it('the corrected attributions (GRPO from DeepSeekMath, MCP Nov 2024, Bahdanau 2014 / ICLR 2015, RoPE 2021)', () => {
    for (const D of [zh, en]) {
      const t = D.st.map(text).join('\n');
      expect(t).toMatch(/GRPO[^\n]*DeepSeekMath[^\n]*2024/); expect(t).toMatch(/MCP[^\n]*2024/); expect(t).toMatch(/Bahdanau[^\n]*2014[^\n]*ICLR 2015/); expect(t).toMatch(/RoPE[^\n]*2021/);
    }
  });
  it('markup is escaped before the marks are applied', () => {
    expect(mk('<b>x</b> **k** `f`')).toBe('&lt;b&gt;x&lt;/b&gt; <span class="k">k</span> f');
  });
  it('every linked card exists in both languages; each card links back to the first stage that uses it', () => {
    for (const l of ['zh', 'en']) { const all = card(l); for (const ks of DV_K) for (const k of ks) expect(all[k], `${l} ${k}`).toBeTruthy(); }
    expect(DV_K).toHaveLength(DV_N); expect(DV_LV).toHaveLength(DV_N);
    expect(DV_OF.KM02).toBe(dvI(6)); expect(DV_OF.KM10).toBe(dvI(2)); expect(DV_OF.K07).toBe(dvI('8a')); expect(DV_OF.K11).toBe(dvI('8b')); expect(DV_OF.K01).toBe(dvI('8b'));
    for (const [k, i] of Object.entries(DV_OF)) { expect(DV_K[i]).toContain(k); expect(i).toBeLessThan(DV_N - 1); }
  });
  it('routes: #D and #D/<station> only (the old #D/8 is an alias of 8a); the layers climb 5 → 1 then the recap; 清空记录 clears what was read', () => {
    expect(['D', 'D/0', 'D/P', 'D/8a', 'D/8b', 'D/9', 'D/E', 'D/S', 'D/15a', 'D/15b', 'D/A', 'D/16', 'D/8', 'D/15'].every(isDv)).toBe(true); expect(DV_ALIAS['D/8']).toBe('D/8a'); expect(DV_ALIAS['D/15']).toBe('D/15a');
    expect(['D/17', 'D/-1', 'D/x', 'D/', 'DD', 'D/01x', 'D/8c', 'D/9a', 'D/15c'].some(isDv)).toBe(false);
    // 读过 stored before the split (plain numbers) reads as the same steps; 8 = both halves
    expect(seenKeys([0, 7, 8, 9, 15, 16, 17, 'x'])).toEqual(['0', '7', '8a', '8b', '9', '15a', '15b', '16']); expect(seenKeys(['8a', 2, '8a'])).toEqual(['8a', '2']); expect(seenKeys(null)).toEqual([]);
    for (let i = 1; i < DV_N - 1; i++) expect(DV_LV[i]!).toBeLessThanOrEqual(DV_LV[i - 1]!);
    expect([DV_LV[0], DV_LV[DV_N - 2], DV_LV[DV_N - 1]]).toEqual([5, 1, 0]);
    expect(REC_KEYS).toContain('si.dv.seen');
  });
});
