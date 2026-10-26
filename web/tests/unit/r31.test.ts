/* R31: five more 3D stage cards (Api calls, Loc local model memory, Skl tools, Bld brick agent, U together / on its own).
   Toy numbers, the one-screen card shape (stage first, one short sentence, at most one control row, closed fold), short
   sentences, lazy scene modules only, and the U links from Ua / Ub. */
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { API_BACK, API_DUR, API_SEND, apiOne, apiSay, apiTotal, bldSay, BLD_PARTS, duoSay, locFit, locSay, LOC_P, LOC_Q, sklSay, SKL_TOOLS, type Road } from '../../src/m2/w3d2';

const gen = (S: string, L: string) => (JSON.parse(fs.readFileSync(`src/legacy/gen/st/${S}.${L}.json`, 'utf8')) as { html: string }).html;
const plain = (h: string) => h.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, '');
const SC = [['Api', 'lab3dApi', 'apSay', 'api'], ['Loc', 'lab3dLoc', 'l3Say', 'loc'], ['Skl', 'lab3dSkl', 'skSay', 'skl'], ['Bld', 'lab3dBld', 'bdSay', 'bld'], ['U', 'lab3dDuo', 'duSay', 'duo']] as const;

describe('R31 toy numbers', () => {
  it('Api: every call costs the same, the total grows in a straight line', () => {
    expect(apiOne()).toBeGreaterThan(0);
    for (let n = 0; n <= 10; n++) expect(apiTotal(n)).toBeCloseTo(n * apiOne(), 12);
    expect(apiSay(3, 'zh')).toContain(`第 3 次`);
  });
  it('R31c Loc: the stack passes the 16 GB rim exactly when the calculator says it does not fit', async () => {
    const { locStack } = await import('../../src/three3d/loc');
    const H = 3.2;
    for (const p of LOC_P) for (const q of LOC_Q) {
      const f = locFit(p, q), s = locStack(f.w, f.kv + f.ov);
      expect(s.top > H + 1e-9, `${p} ${q} ${f.v}`).toBe(f.v === 'no');
      if (f.v === 'tight') expect(s.top).toBeGreaterThan(H * 0.8 - 1e-9);
      if (f.v === 'ok') expect(s.top).toBeLessThanOrEqual(H * 0.8 + 1e-9);
      expect(s.top).toBeLessThanOrEqual(H * 1.14 + 1e-9); // squeezed, still on stage
    }
  });
  it('R31c Api: while a request is on its way the sentence says where it is and never shows the new total', () => {
    for (const L of ['zh', 'en'] as const) for (const ph of ['send', 'think'] as const) {
      const s = apiSay(2, L, ph);
      expect(s, `${L} ${ph}`).not.toBe(apiSay(2, L)); expect(s).not.toMatch(/0\.0\d\d/);
    }
    expect(apiSay(0, 'zh', 'send')).toContain('请求发出'); expect(apiSay(0, 'zh', 'think')).toContain('模型在想');
    expect(API_SEND).toBeLessThan(API_BACK); expect(API_DUR).toBeLessThanOrEqual(2);
    const w = fs.readFileSync('src/m2/labs/Api.w.ts', 'utf8');
    expect(w).toMatch(/btn\.disabled = true/); expect(w).toMatch(/if \(!h3\?\.on\(\)\) \{ land\(\); return; \}/);
  });
  it('Loc: more parameters or more bits never need less memory; the verdict follows the need', () => {
    for (const q of LOC_Q) for (let i = 1; i < LOC_P.length; i++) expect(locFit(LOC_P[i]!, q).need).toBeGreaterThan(locFit(LOC_P[i - 1]!, q).need);
    for (const p of LOC_P) for (let i = 1; i < LOC_Q.length; i++) expect(locFit(p, LOC_Q[i]!).need).toBeGreaterThan(locFit(p, LOC_Q[i - 1]!).need);
    expect(locFit(1.5, 'Q4_K_M').v).toBe('ok'); expect(locFit(70, 'F16').v).toBe('no');
    for (const p of LOC_P) for (const q of LOC_Q) expect(locSay(p, q, 'en')).toMatch(/[✅⚠️❌]/u);
  });
  it('Skl / Bld: five tools, four blocks; sentences change with the choice', () => {
    expect(SKL_TOOLS).toHaveLength(5); expect(BLD_PARTS.map((b) => b[0])).toEqual(['model', 'tools', 'mem', 'ins']);
    expect(sklSay([0, 1], true, 'zh')).not.toBe(sklSay([0, 1], false, 'zh'));
    expect(new Set((['', 'nocode', 'code'] as Road[]).map((r) => bldSay(r, 'en'))).size).toBe(3);
    expect(duoSay('with', 'zh')).not.toBe(duoSay('solo', 'zh'));
  });
});

describe('R31 one-screen stage cards', () => {
  for (const L of ['zh', 'en'] as const) for (const [S, id, say] of SC) {
    it(`${S}.${L}: stage card first, no visible title, one sentence, at most one control row, fold closed`, () => {
      const h = gen(S, L), i = h.indexOf(`id="${id}"`);
      expect(i).toBeGreaterThan(0);
      expect(h.indexOf('<div class="card'), 'first card').toBe(h.lastIndexOf('<div', i));
      const card = h.slice(h.lastIndexOf('<div', i), h.indexOf('<!--/m2x-->', i)), top = card.slice(0, card.indexOf('<details'));
      expect(card).toMatch(/<details class="s3c-why">/); expect(card).not.toMatch(/<details[^>]*\bopen\b/);
      expect(card).not.toMatch(/class="[^"]*\b(tag|s3d-sw)\b/);
      expect(card).toMatch(/<h3 class="s3c-t">/);
      expect(top).toContain(`id="${say}"`);
      expect((top.match(/class="s3c-ctl\b/g) ?? []).length, 'control rows under the stage').toBeLessThanOrEqual(1);
      expect((top.match(/<(input|button|select)\b/g) ?? []).length, 'inputs in that row').toBeLessThanOrEqual(2);
      expect(top).not.toMatch(/VPN|科学上网|翻墙/);
    });
  }
  for (const L of ['zh', 'en'] as const) it(`Loc.${L}: exactly one control, a size × compression dropdown with every pair`, () => {
    const h = gen('Loc', L), i = h.indexOf('id="lab3dLoc"'), top = h.slice(i, h.indexOf('<details', i));
    expect((top.match(/<(input|button|select)\b/g) ?? []).length).toBe(1);
    expect((top.match(/<option value="[^"]+\|[^"]+"/g) ?? []).length).toBe(LOC_P.length * LOC_Q.length);
  });
  it('every sentence under the stage is short: ≤30 Chinese characters (zh), ≤60 letters (en, one line at 360)', () => {
    const all: [string, string][] = [];
    for (const L of ['zh', 'en'] as const) {
      for (let n = 0; n <= 20; n++) all.push([L, apiSay(n, L)]);
      for (const p of LOC_P) for (const q of LOC_Q) all.push([L, locSay(p, q, L)]);
      const subsets = [[], [0], [0, 1], [0, 1, 2], [0, 1, 2, 3], [0, 1, 2, 3, 4], [3, 4], [1, 3]];
      for (const on of subsets) for (const a of [true, false]) all.push([L, sklSay(on, a, L)]);
      for (const r of ['', 'nocode', 'code'] as Road[]) all.push([L, bldSay(r, L)]);
      for (const m of ['with', 'solo'] as const) all.push([L, duoSay(m, L)]);
    }
    for (const [L, s] of all) expect([...plain(s)].length, s).toBeLessThanOrEqual(L === 'zh' ? 30 : 60);
  });
});

describe('R31 scenes load lazily and U is linked from Ua / Ub', () => {
  it('each lab reaches its scene module only by dynamic import', () => {
    for (const [S, , , m] of SC) {
      const s = fs.readFileSync(`src/m2/labs/${S}.w.ts`, 'utf8');
      expect(s, S).toContain(`import('../../three3d/${m}')`);
      expect(s, S).not.toMatch(/^import\s+(?!type)[^;]*three3d/m);
    }
  });
  it('the scene modules only use three.js classes already in the shared chunk (so it does not grow)', () => {
    const OK = new Set('AdditiveBlending BufferGeometry CanvasTexture CatmullRomCurve3 Color ConeGeometry CubicBezierCurve3 CylinderGeometry DoubleSide Float32BufferAttribute Group Mesh MeshBasicMaterial MeshStandardMaterial PlaneGeometry Quaternion RingGeometry RoundedBoxGeometry SphereGeometry TorusGeometry TubeGeometry Vector3'.split(' '));
    for (const m of ['api', 'loc', 'skl', 'bld', 'duo', 'kit']) {
      const s = fs.readFileSync(`src/three3d/${m}.ts`, 'utf8');
      for (const x of s.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+['"](three[^'"]*)['"]/g)) {
        if (x[1]) continue;
        expect(x[3], m).toMatch(/^three(\/examples\/jsm\/geometries\/RoundedBoxGeometry(\.js)?)?$/);
        for (const n of x[2]!.split(',').map((v) => v.trim().replace(/^type\s+/, '')).filter(Boolean)) if (!x[2]!.includes(`type ${n}`)) expect(OK.has(n), `${m}: ${n}`).toBe(true);
      }
    }
  });
  it('Ua and Ub link to the U scene in both languages; no new stops', () => {
    for (const S of ['Ua', 'Ub']) for (const L of ['zh', 'en']) expect(gen(S, L), `${S}.${L}`).toContain('data-go="U"');
    for (const L of ['zh', 'en']) expect(gen('U', L)).toContain('id="lab3dDuo"');
    expect(fs.existsSync('src/m2/labs/Duo.w.ts')).toBe(false);
  });
  it('R31b: U has its toggle as a capsule inside the stage and no control row under it', () => {
    for (const L of ['zh', 'en']) {
      const h = gen('U', L), i = h.indexOf('id="lab3dDuo"'), card = h.slice(i, h.indexOf('</details>', i));
      const stageHtml = card.slice(card.indexOf('id="duBox"'), card.indexOf('s3c-sheet'));
      expect(stageHtml, L).toContain('class="s3c-cap"');
      expect((stageHtml.match(/data-m="(with|solo)"/g) ?? []).length, L).toBe(2);
      expect(card, L).not.toContain('s3c-ctl');
    }
  });
});
