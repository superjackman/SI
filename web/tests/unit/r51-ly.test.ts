// R51 逐层展开 pilot: which stages are layered, zh/en parity, wording rules, colour marks, depth logic, the rendered body
import { describe, it, expect, beforeEach } from 'vitest';
import zh0 from '../../src/dv/zh';
import en0 from '../../src/dv/en';
import { deepFill, fillDvText } from '../../src/dv/nums';
import { dvI } from '../../src/dv/links';
import { mk } from '../../src/dv/view';
import { DEPTH_MAX, depthFor, depthGet, html, openGet, shown, LY_DEPTH } from '../../src/dv/ly';
import type { Ly, Stage } from '../../src/dv/types';

const zh = deepFill(zh0, (s) => fillDvText(s, 'zh')), en = deepFill(en0, (s) => fillDvText(s, 'en'));
import { DV_KEY } from '../../src/dv/links';
const PILOT = [...DV_KEY]; // R52: every station is layered
const CJK = /[\u3000-\u303f\u3400-\u9fff\uff00-\uffef]/;
const all = (y: Ly) => [y.hook, ...y.an, y.jv, ...y.pc, ...y.num, ...y.fx, ...y.fe];
const marks = (s: string) => [...s.matchAll(/⟦([a-z]):/g)].map((m) => m[1]);

describe('R52 layered teaching', () => {
  it('every station is layered, in both languages, every part filled', () => {
    for (const D of [zh, en]) {
      expect(D.st.every((s) => !!s.ly)).toBe(true);
      for (const k of PILOT) { const y = D.st[dvI(k)]!.ly!; expect(y.hook && y.jv && y.an.length && y.pc.length && y.num.length && y.fx.length && y.fe.length, k).toBeTruthy(); expect(['sm','bowl','att','blk','flow','xor','dot']).toContain(y.pic); }
    }
  });
  it('zh and en match: same picture, same number of lines, the same colour marks in the same order; no {#…} left', () => {
    for (const k of PILOT) {
      const a = zh.st[dvI(k)]!.ly!, b = en.st[dvI(k)]!.ly!;
      expect(b.pic).toBe(a.pic);
      for (const f of ['an', 'pc', 'num', 'fx', 'fe'] as const) { expect(b[f].length, `${k} ${f}`).toBe(a[f].length); a[f].forEach((s, j) => expect(marks(b[f][j]!), `${k} ${f}[${j}]`).toEqual(marks(s))); }
      for (const s of [...all(a), ...all(b)]) { expect(s).not.toMatch(/\{#/); expect(s).not.toMatch(/\$|\\[a-z]+\{/); }
    }
  });
  it('wording: en has no Chinese and no “error”; zh says 误差 only in fixed terms', () => {
    for (const k of PILOT) {
      for (const s of all(en.st[dvI(k)]!.ly!)) { expect(s, s).not.toMatch(CJK); expect(s, s).not.toMatch(/\berrors?\b/i); }
      for (const s of all(zh.st[dvI(k)]!.ly!)) expect(s.replace(/均方误差/g, ''), s).not.toMatch(/误差/);
    }
  });
  it('colour marks render as spans, inside formulas too', () => {
    expect(mk('`⟦q:Q⟧ × ⟦k:K^T⟧`')).toBe('<span class="formula"><span class="ly-c ly-q">Q</span> × <span class="ly-c ly-k">K^T</span></span>');
    expect(mk('a ⟦v:b⟧ ⟦c:c⟧ ⟦r:d⟧')).toBe('a <span class="ly-c ly-v">b</span> <span class="ly-c ly-c">c</span> <span class="ly-c ly-r">d</span>');
  });
  describe('depth', () => {
    beforeEach(() => localStorage.clear());
    it('30 秒 = ①, 5 分钟 = ①–③, 深入 = all five; default 5 分钟; what was opened is capped by the depth', () => {
      expect(DEPTH_MAX).toEqual({ s: 1, m: 3, d: 5 }); expect(depthGet()).toBe('m'); expect(openGet('D/2')).toBe(1);
      expect([1, 2, 3, 4, 5].map(depthFor)).toEqual(['s', 'm', 'm', 'd', 'd']);
      expect(shown(5, 's')).toBe(1); expect(shown(5, 'm')).toBe(3); expect(shown(2, 'd')).toBe(2); expect(shown(0, 'd')).toBe(1);
      localStorage.setItem(LY_DEPTH, 'x'); expect(depthGet()).toBe('m'); localStorage.setItem(LY_DEPTH, 'd'); expect(depthGet()).toBe('d');
      localStorage.setItem('si.ly.open', '{"D/2":9}'); expect(openGet('D/2')).toBe(1); localStorage.setItem('si.ly.open', '{"D/2":4}'); expect(openGet('D/2')).toBe(4);
    });
    it('renders five layers, only the first open on a fresh page; the quiz sits in ⑤ and the demo in ③', () => {
      for (const [D, l] of [[zh, 'zh'], [en, 'en']] as const) for (const k of PILOT) {
        const S = D.st[dvI(k)]! as Stage & { ly: Ly }, h = html(S, `D/${k}`, l, mk, '');
        const el = document.createElement('div'); el.innerHTML = h;
        expect(el.querySelectorAll('.ly-l')).toHaveLength(5); expect(el.querySelectorAll('.ly-l:not([hidden])')).toHaveLength(1);
        expect(el.querySelectorAll('.ly-pg button')).toHaveLength(5); expect(el.querySelectorAll('.ly-dep [role="radio"]')).toHaveLength(3);
        expect(el.querySelector('.ly-l[data-ly="3"] [data-vf-part="demo"]')).toBeTruthy(); expect(el.querySelector('.ly-l[data-ly="5"] [data-vf-part="check"]')).toBeTruthy();
        if (l === 'en') expect(el.textContent!, k).not.toMatch(CJK);
      }
    });
  });
});
