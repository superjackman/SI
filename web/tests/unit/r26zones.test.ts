/* R26: the 🤖 Job, 🧰 Skl and 🛠 Bld stations — boundary line on top, a static scenario picker (one panel shown, works
   without JS), the real MCP / skills catalogue with official links, T1 doorways into each, the frozen challenge order,
   and nothing about getting around network restrictions or overseas sign-ups. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CAT, NEED } from '../../m2/content/Skl';
import { SCENES, MEDIA, CHECKED_R26 } from '../../m2/content/Job';
import { PLAT, FW, ROAD } from '../../m2/content/Bld';
import { CH_ORDER } from '../../src/viral/codec';

const GEN = join(__dirname, '../../src/legacy/gen');
const J = <T>(p: string) => JSON.parse(readFileSync(join(GEN, p), 'utf8')) as T;
const st = (S: string, L: string) => J<{ html: string }>(`st/${S}.${L}.json`).html;
const KB = J<{ TABORDER: string[]; C: Record<string, { zoom?: string; up?: string; t: string }> }>('kb.json');
const doc = (h: string) => new DOMParser().parseFromString(`<body>${h}</body>`, 'text/html');
const PK: Record<string, [string, string[]]> = { Job: ['pkJob', SCENES.map((s) => s.k)], Skl: ['pkSkl', NEED.map((n) => n.k)], Bld: ['pkBld', ROAD.map((r) => r.k)] };

describe('R26 zones', () => {
  it('Job, Skl, Bld follow Loc in the tab order, and T1 has a box zooming into each', () => {
    const o = KB.TABORDER; expect(o.slice(o.indexOf('Loc'), o.indexOf('Loc') + 5)).toEqual(['Loc', 'Job', 'Skl', 'Bld', 'T2']);
    expect(o.length).toBe(27);
    expect(KB.C.jHub?.zoom).toBe('Job'); expect(KB.C.sHub?.zoom).toBe('Skl'); expect(KB.C.bHub?.zoom).toBe('Bld');
    for (const k of ['jPick', 'jCheck', 'sCat', 'sPerm', 'bFlow', 'bCode']) expect(KB.C[k], k).toBeTruthy();
  });
  it('the challenge-link station order is frozen: old links keep decoding to the same station', () => {
    expect(CH_ORDER.slice(0, 24)).toEqual(['T1', 'U', 'Ua', 'Ub', 'Uc', 'Ud', 'Up', 'T2', 'T3', 'N', 'T4', 'T4a', 'T4b', 'T5', 'T6', 'T7', 'T8', 'K1', 'K2', 'K3', 'K4', 'K5', 'Api', 'Loc']); // = R25 live order
    expect(CH_ORDER.slice(-5)).toEqual(['Api', 'Loc', 'Job', 'Skl', 'Bld']);
    expect(new Set(CH_ORDER).size).toBe(27);
  });
  for (const L of ['zh', 'en'] as const) for (const S of ['Job', 'Skl', 'Bld']) describe(`${S} ${L}`, () => {
    const h = st(S, L), d = doc(h);
    it('says what it covers and what it does not, above the first diagram', () => {
      const i = h.indexOf('pl-bd'); expect(i).toBeGreaterThan(-1); expect(i).toBeLessThan(h.indexOf('<svg'));
      expect(h).toContain(L === 'zh' ? '这里不讲' : 'Not covered');
    });
    it('never covers circumvention or overseas sign-up', () => {
      expect(h).not.toMatch(/科学上网|翻墙|VPN|梯子|代理服务器|海外信用卡|虚拟卡|海外账号|proxy|circumvent/i);
    });
    it('every outside link is https and opens safely', () => {
      const a = [...h.matchAll(/<a href="(http[^"]+)"([^>]*)>/g)]; expect(a.length).toBeGreaterThan(0);
      for (const m of a) { expect(m[1]).toMatch(/^https:\/\//); expect(m[2]).toContain('noopener'); }
    });
    it('has a ⚠️ card, a quiz, and dated sources', () => {
      expect(h).toMatch(/⚠️/); expect(h).toMatch(L === 'zh' ? /核对于[^<]*2026-10-25/ : /2026-10-25/); expect(CHECKED_R26).toBe('2026-10-25');
    });
    it('the picker: one button per choice, exactly one pressed, exactly one panel shown, all panels in the page (no JS needed)', () => {
      const [id, keys] = PK[S]!, g = d.getElementById(id)!, out = d.getElementById(id + 'Out')!;
      expect(g).toBeTruthy(); expect(out).toBeTruthy();
      const b = [...g.querySelectorAll('.pk-b[data-pk]')], v = [...out.querySelectorAll('.pk-v[data-pv]')];
      expect(b.map((x) => x.getAttribute('data-pk'))).toEqual(keys); expect(v.map((x) => x.getAttribute('data-pv'))).toEqual(keys);
      expect(b.filter((x) => x.getAttribute('aria-pressed') === 'true').length).toBe(1);
      expect(v.filter((x) => !x.hasAttribute('hidden')).length).toBe(1);
      for (const x of v) expect((x.textContent ?? '').trim().length).toBeGreaterThan(20);
    });
  });
  it('Job: mainland products link out; overseas products are names only, never links', () => {
    for (const L of ['zh', 'en']) {
      const d = doc(st('Job', L));
      for (const m of MEDIA) expect(d.querySelector(`a[href="${m.u}"]`), m.n).toBeTruthy();
      for (const n of d.querySelectorAll('.tag-note')) expect(n.querySelector('a')).toBeNull();
    }
  });
  it('Skl: every catalogue entry appears with its official link, grouped by category', () => {
    for (const L of ['zh', 'en'] as const) {
      const d = doc(st('Skl', L)), cats = [...d.querySelectorAll('#skCats .sk-cat[data-cat]')];
      expect(cats.map((c) => c.getAttribute('data-cat'))).toEqual(CAT.map((c) => c.k));
      CAT.forEach((c, i) => { for (const [n, , u] of c.e) { const a = cats[i]!.querySelector(`a[href="${u}"]`); expect(a, n).toBeTruthy(); expect((a!.textContent ?? '').trim().length, n).toBeGreaterThan(1); } });
    }
    expect(st('Skl', 'zh')).toMatch(/data-sp="Uc"|data-lv="Uc"|cfToolMcpSkill/);
  });
  it('Bld: platforms and frameworks link their own docs; the agent loop points at T2', () => {
    const h = st('Bld', 'zh');
    for (const p of PLAT) expect(h, p[0]).toContain(p[4]);
    for (const f of FW) expect(h, f[0]).toContain(f[2]);
    expect(h).toMatch(/data-sp="T2"|data-lv="T2"/);
  });
});
