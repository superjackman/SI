import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { LX, LX_ALL, LIVE, isLx, layerOf, lxHash, lxFrom, lxNext, lxPrev } from '../../src/lx/ids';
import { geo } from '../../src/lx/geo';
import { page as p1 } from '../../src/lx/p1';
import { page as p3, dia3 } from '../../src/lx/p3';
import { page as p5, dia5 } from '../../src/lx/p5';
import { K_MATH } from '../../src/l4/txt';
import { CFG, Model, buildDict } from '../../src/l4/tf/model';
import { DEMO } from '../../src/l4/tf/core';

const json = (f: string) => JSON.parse(fs.readFileSync(`src/l4/c/${f}`, "utf8")) as Record<string, { n: string; s: string[] }>;
const live = (n: number) => LIVE.includes(n);

describe('R39 layer ids', () => {
  it('every page hash round-trips through the L4 parser form', () => {
    for (const id of LX_ALL) { const h = lxHash(id).slice(1); expect(lxFrom(h)).toBe(id); expect(isLx(id)).toBe(true); }
  });
  it('reading order: next / prev chain covers each layer and leads on', () => {
    for (const n of [1, 2, 3, 5] as const) {
      const o = LX[n]; for (const id of o) expect(layerOf(id)).toBe(n);
      for (let i = 0; i + 1 < o.length; i++) { expect(lxNext(o[i]!)).toBe(lxHash(o[i + 1]!)); expect(lxPrev(o[i + 1]!)).toBe(lxHash(o[i]!)); }
    }
    expect(lxNext('L1-6')).toBe('#L2'); expect(lxNext('L2-7')).toBe('#L3'); expect(lxPrev('L1')).toBe('#home');
    expect(lxFrom('L1/9')).toBeNull(); expect(lxFrom('L2/P')).toBeNull();
  });
  it('layers 1 to 4 are live', () => { expect(live(1) && live(2) && live(3) && live(4)).toBe(true); });
});

describe('R39 layer 1 + 2 pages', () => {
  const ids = [...LX[1], ...LX[2]];
  it('each page has a title, four info lines, a card and a panel in both languages', () => {
    for (const id of ids) for (const l of ['zh', 'en'] as const) {
      const p = p1(id, l); expect(p.id).toBe(id); expect(p.ttl.length).toBeGreaterThan(0);
      expect(p.info.every((s) => s.length > 0)).toBe(true); expect(p.k).toMatch(/^K[AB]\d\d$/); expect(p.panel.length).toBeGreaterThan(20);
      if (l === 'en') expect(p.panel + p.ttl + p.info.join('')).not.toMatch(/[\u4e00-\u9fff]/);
    }
  });
  it('geometry: nodes stay on screen and the panel sits below (full) or right of (left) the diagram', () => {
    for (const id of ids) for (const [W, H] of [[360, 400], [390, 560]] as const) {
      const p = p1(id, 'zh'); if (!p.v) continue;
      for (const k of [1, 0.82]) {
        const g = geo(p.v, W, H, p.mode, p.px ?? 170, k);
        for (const n of g.nodes) { expect(n.x).toBeGreaterThanOrEqual(0); expect(n.x + n.w).toBeLessThanOrEqual(W + 0.5); }
        const P = g.panel; if (!P) continue;
        expect(P.x + P.w).toBeLessThanOrEqual(W); expect(P.y + P.h).toBeLessThanOrEqual(H);
        if (p.mode === 'left') for (const n of g.nodes) expect(n.x + n.w).toBeLessThanOrEqual(P.x + 0.5);
        else for (const n of g.nodes) expect(n.y + n.h).toBeLessThanOrEqual(P.y + 0.5);
      }
    }
  });
  it('a smaller k shrinks the diagram and widens a left panel', () => {
    const p = p1('L2-7', 'en'); const a = geo(p.v!, 360, 420, 'left', p.px ?? 170, 1), b = geo(p.v!, 360, 420, 'left', p.px ?? 170, 0.85);
    expect(b.panel!.w).toBeGreaterThan(a.panel!.w);
  });
});

describe('R39 cards KA / KB', () => {
  const zh = json('k1-zh.json'), en = json('k1-en.json');
  it('14 cards, same ids in both languages, five parts each, en has no Chinese', () => {
    const ids = Object.keys(zh).sort(); expect(ids).toEqual([...'123456'].map((d) => 'KA0' + d).concat([...'12345678'].map((d) => 'KB0' + d)));
    expect(Object.keys(en).sort()).toEqual(ids);
    for (const id of ids) {
      expect(zh[id]!.s).toHaveLength(5); expect(en[id]!.s).toHaveLength(5);
      for (const s of [...zh[id]!.s, ...en[id]!.s]) expect(s.trim().length).toBeGreaterThan(0);
      expect(JSON.stringify(en[id])).not.toMatch(/[\u4e00-\u9fff]/);
    }
  });
});

/* the example characters the English pages keep (each glossed), as layer 4 does */
const EXC = /[^天空是什么颜色蓝的。？绿红草通常用户助手点击领包]/u;
const cjk = (t: string) => [...t.replace(/<[^>]+>/g, '')].filter((c) => /[\u4e00-\u9fff]/.test(c));
describe('R39 layer 3 pages', () => {
  it('13 pages: title, four info lines, a KC card, a panel (none on the overview), dots; en keeps only glossed example chars', () => {
    for (const id of LX[3]) for (const l of ['zh', 'en'] as const) {
      const p = p3(id, l); expect(p.id).toBe(id); expect(p.ttl.length).toBeGreaterThan(0); expect(p.v).not.toBeNull();
      expect(p.info.every((s) => s.length > 0)).toBe(true); expect(p.k).toMatch(/^KC(0[1-9]|1[0-2])$/);
      if (id === 'L3') { expect(p.panel).toBe(''); expect(p.v!.np).toBe(true); expect(p.ent).toHaveLength(3); } else expect(p.panel.length).toBeGreaterThan(40);
      if (l === 'en') for (const c of cjk(p.panel + p.ttl + p.info.join('') + p.top + p.hint)) expect(c).not.toMatch(EXC);
    }
  });
  it('the diagram: 11 boxes, opened boxes add their three rows, every box is reachable', () => {
    expect(dia3('full').nodes).toHaveLength(11); expect(dia3('cmp', 'par').nodes).toHaveLength(14); expect(dia3('cmp', 'u3').nodes.map((n) => n.id)).toContain('x2');
    const p = p3('T1', 'zh'); for (const n of dia3('left').nodes) expect(p.go[n.id]).toMatch(/^#L3/);
    expect(p3('L3-P', 'zh').go.p2).toMatch(/^#L4\//); expect(p3('L3-X', 'en').go.x3).toMatch(/^#L4\//);
  });
  it('geometry: on screen at phone sizes; a left panel sits right of the diagram', () => {
    for (const id of LX[3]) for (const [W, H] of [[360, 400], [430, 640]] as const) {
      const p = p3(id, 'en'), g = geo(p.v!, W, H, p.mode, p.px ?? 170, 1);
      for (const n of g.nodes) { expect(n.x).toBeGreaterThanOrEqual(0); expect(n.x + n.w).toBeLessThanOrEqual(W + 0.5); expect(n.y + n.h).toBeLessThanOrEqual(H + 0.5); }
      if (g.panel) { expect(g.panel.x + g.panel.w).toBeLessThanOrEqual(W); for (const n of g.nodes) expect(n.x + n.w).toBeLessThanOrEqual(g.panel.x + 0.5); }
    }
  });
  it('the demo size on 「模型参数」 is the real layer-4 model: 14 chars with END, 7406 numbers', () => {
    const D = buildDict(DEMO); expect(D.chars).toHaveLength(14); expect(CFG.d).toBe(16); expect(CFG.L).toBe(2);
    expect(new Model(CFG, D.chars.length).n).toBe(7406);
    expect(p3('L3-P', 'zh').panel).toContain('7406'); expect(p3('L3-P', 'en').panel).toContain('7406');
  });
});

describe('R39 cards KC', () => {
  const zh = json('k3-zh.json'), en = json('k3-en.json');
  it('12 cards, five parts each, en keeps only glossed example chars, KC08 uses the real demo size', () => {
    const ids = Array.from({ length: 12 }, (_, i) => 'KC' + String(i + 1).padStart(2, '0')); expect(Object.keys(zh).sort()).toEqual(ids); expect(Object.keys(en).sort()).toEqual(ids);
    for (const id of ids) {
      expect(zh[id]!.s).toHaveLength(5); expect(en[id]!.s).toHaveLength(5);
      for (const s of [...zh[id]!.s, ...en[id]!.s]) expect(s.trim().length).toBeGreaterThan(0);
      for (const c of cjk(JSON.stringify(en[id]))) expect(c).not.toMatch(EXC);
    }
    expect(zh.KC08!.s[3]).toContain('7406'); expect(en.KC08!.s[3]).toContain('7406'); expect(zh.KC08!.s[3]).not.toContain('1 万');
  });
  it('maths links only where the card has one', () => {
    for (const k of ['KC01', 'KC04', 'KC05', 'KC08', 'KC09', 'KC10', 'KC11']) expect(K_MATH[k]).toMatch(/^KM\d\d$/);
    for (const k of ['KC02', 'KC03', 'KC06', 'KC07', 'KC12']) expect(K_MATH[k]).toBeUndefined();
  });
});

describe('R39 layer 5', () => {
  const D5 = (l: string) => JSON.parse(fs.readFileSync(`src/lx/m5-${l}.json`, 'utf8')) as Record<string, { c: string[]; s: string; t: string; i: string[]; d: number[]; b: string; tr: boolean }>;
  const zh = D5('zh'), en = D5('en'), txt = (h: string) => h.replace(/<defs>[\s\S]*?<\/defs>/g, '').replace(/<[^>]+>/g, ' ');
  it('every page builds in both languages: crumb, four info rows, a KM card, a way back into layer 4', async () => {
    expect(Object.keys(zh).sort()).toEqual(LX[5].filter((x) => x !== 'L5').sort()); expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
    for (const id of LX[5]) for (const l of ['zh', 'en'] as const) {
      const p = await p5(id, l); expect(p.id).toBe(id); expect(p.k).toMatch(/^KM(0[1-9]|1[0-2])$/); expect(p.info.every((s) => s.length > 0)).toBe(true);
      if (id === 'L5') { expect(p.v).not.toBeNull(); continue; }
      expect(p.mode).toBe('chart'); expect(p.chart!.length).toBeGreaterThan(100); expect(p.panel.length).toBeGreaterThan(20); expect(p.mg![1]).toMatch(/^#L4\/(us|tr|x)\//);
    }
  });
  it('en is translated: only the demo characters stay Chinese', () => {
    for (const p of Object.values(en)) for (const c of txt(p.s + p.t + p.c.join('') + p.i.join('')).match(/[\u4e00-\u9fff]/g) ?? []) expect('蓝绿红天空色颜是的什么').toContain(c);
  });
  it('the worked numbers are what the maths gives', () => {
    const f2 = (x: number) => x.toFixed(2), sm = [2, 1, 0.1, -0.5].map(Math.exp), tot = sm.reduce((a, b) => a + b);
    expect(f2(tot)).toBe('11.82'); expect(txt(zh.M4c!.s)).toContain(`${(100 * sm[0]! / tot).toFixed(1)}%`); expect(txt(zh.M4b!.s + zh.M4c!.s)).toContain(f2(sm[3]!));
    expect(3 * 2 + 1 * 2.5).toBe(8.5); expect(txt(zh.M2a!.s + zh.M2a!.t + zh.M2b!.s)).toContain('8.5');
    expect(f2(-Math.log(0.12))).toBe('2.12'); expect(f2(-Math.log(0.62))).toBe('0.48'); expect(f2(-Math.log(0.01))).toBe('4.61'); expect(txt(zh.M5b!.s + zh.M5b!.t)).toContain('4.61');
    const L = (w: number) => (w - 2) ** 2 + 0.5; let w = 0; const rows: string[] = [];
    for (let i = 0; i < 4; i++) { const g = 2 * (w - 2); rows.push(`${w.toFixed(3)} ${g.toFixed(2)} ${L(w).toFixed(3)}`); w -= 0.3 * g; }
    const m6 = txt(zh.M6c!.s).replace(/\s+/g, ' ').replace(/−/g, '-');
    for (const r of rows) { const [a, b, c] = r.split(' '); expect(m6).toContain(a!); expect(m6).toContain(b!); expect(m6).toContain(c!); }
    const x = [1.5, 1.0, 6.0], mu = x.reduce((a, b) => a + b) / 3, v = x.reduce((a, b) => a + (b - mu) ** 2, 0) / 3;
    expect(f2(mu)).toBe('2.83'); expect(f2(v)).toBe('5.06'); expect(f2(Math.sqrt(v))).toBe('2.25'); expect(txt(zh.M8!.s + zh.M8!.t)).toContain('5.06');
    expect(zh.M6a!.t).toContain('7406'); expect(en.M6a!.t).toContain('7406'); expect(zh.M6a!.t).not.toContain('1 万');
  });
  it('the maths map fits a 360-wide stage and every chip leads into layer 5', async () => {
    for (const l of ['zh', 'en'] as const) {
      const d = dia5(l); for (const n of d.nodes) { expect(n.x).toBeGreaterThanOrEqual(0); expect(n.x + n.w).toBeLessThanOrEqual(360); }
      const p = await p5('L5', l); for (const n of d.nodes.filter((q) => q.tag)) expect(p.go[n.id]).toMatch(/^#L5\/M\d/);
    }
  });
});
