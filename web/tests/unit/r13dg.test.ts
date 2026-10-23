/* R13: the T1 diagram is the whole stack — you / ways of use / products → agent app → LLM → Transformer → what the blocks are
   made of → (side branch: multimodal) → training → compute → MATH (K1–K5), with labelled orange "supports" lines from each
   maths box to the part it holds up. Straight / orthogonal lines only, no crossings, no line through a box, no squeezed text
   (checked geometrically on the generated SVG, phone and wide, zh and en). Every station is one 🔍 tap from home. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { check, parse } from '../../m2/dgcheck';
import { BANDS, GEDGES, TXT, textW } from '../../m2/content/t1dg';

const GEN = join(__dirname, '../../src/legacy/gen');
const J = <T>(p: string) => JSON.parse(readFileSync(join(GEN, p), 'utf8')) as T;
const KB = J<{ C: Record<string, { t: string; cat: string; zoom?: string; train?: string }>; TABORDER: string[]; PATH: Record<string, unknown> }>('kb.json');
const WALK = ['user', 'app', 'plan', 'tools', 'memory', 'loop', 'guard', 'llm', 'tokenizer', 'embed', 'blocks', 'lmhead', 'sample', 'mmenc', 'vit', 'audenc',
  'projector', 'gimg', 'gaud', 'trainsys', 'pretrain', 'sft', 'pref', 'rlvr', 'infra', 'serve', 'kvcache', 'batch', 'quant'];
const NEW = ['uHub', 'uWith', 'uSolo', 'uKit', 'uWell', 'uProd', 'attn', 'ffn', 'addnorm', 'nnHub', 'backprop', 'loss', 'nOpt', 'mK1', 'mK2', 'mK3', 'mK4', 'mK5', 'tRef'];
const phone = (L: string) => /<svg id="svgT1"[\s\S]*?<\/svg>/.exec(J<{ html: string }>(`st/T1.${L}.json`).html)?.[0] ?? '';
const wide = (L: string) => { const w = J<{ svgT1: { vb: string; html: string } }>(`st/T1.${L}.wide.json`).svgT1; return `<svg id="svgT1" viewBox="${w.vb}">${w.html}</svg>`; };
const comps = (svg: string) => [...svg.matchAll(/<g class="comp[^"]*" data-id="([^"]+)"/g)].map((m) => m[1] as string);

describe('R13 layout data', () => {
  it('nine bands top → bottom, math last, every box has zh and en text, English without CJK', () => {
    expect(BANDS.length).toBe(9);
    const ids = BANDS.flatMap((b) => b.m.flatMap((r) => r.ids));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) { const t = TXT[id]!; expect(t, id).toBeTruthy(); expect(t.zh.length * t.en.length, id).toBeGreaterThan(0); expect(t.en.join(' '), id).not.toMatch(/[\u3400-\u9fff]/); }
    expect(BANDS[BANDS.length - 1]!.m.flatMap((r) => r.ids)).toEqual(['mK1', 'mK2', 'mK3', 'mK4', 'mK5']);
    /* wide rows hold the same boxes as the phone rows */
    for (const b of BANDS) if (b.wd) expect([...b.wd.flatMap((r) => r.ids)].sort()).toEqual([...b.m.flatMap((r) => r.ids)].sort());
  });
  it('every maths box supports at least one part above it, with a zh and an en label', () => {
    for (const k of ['mK1', 'mK2', 'mK3', 'mK4', 'mK5']) expect(GEDGES.some((e) => e.from === k), k).toBe(true);
    for (const e of GEDGES) { expect(e.lab.zh.join('').length * e.lab.en.join('').length).toBeGreaterThan(0); expect(KB.C[e.from], e.from).toBeTruthy(); expect(KB.C[e.to], e.to).toBeTruthy(); }
  });
  it('textW: CJK counts a full em, latin less, bold wider', () => {
    expect(textW('中文', 10)).toBe(20);
    expect(textW('ab', 10)).toBeLessThan(textW('中文', 10));
    expect(textW('Ab', 10, true)).toBeGreaterThan(textW('Ab', 10));
  });
});

describe('R13 checker catches bad diagrams', () => {
  const ok = phone('zh');
  it('the generated diagram is clean', () => expect(check(ok, true)).toEqual([]));
  it('flags overlapping boxes', () => {
    const p = parse(ok), a = p.boxes[3]!, b = p.boxes[4]!;
    const bad = ok.replace(new RegExp(`(<g class="comp[^"]*" data-id="${b.id}"[\\s\\S]*?<rect class="main" x=")[^"]+(" y=")[^"]+"`), `$1${a.x}$2${a.y}"`);
    expect(check(bad, false).some((s) => /overlap/.test(s))).toBe(true);
  });
  it('flags a line through a box and a label over a box', () => {
    const p = parse(ok), b = p.boxes[5]!;
    const line = `<path class="arrow sup" data-from="x1" data-to="x2" d="M 2 ${b.y + b.h / 2} H ${b.x + b.w + 30}"></path>`;
    expect(check(ok.replace('</svg>', line + '</svg>'), false).some((s) => /through/.test(s))).toBe(true);
    const lab = `<text class="lbl" x="${b.x + 4}" y="${b.y + 20}" font-size="12.5">covering text</text>`;
    expect(check(ok.replace('</svg>', lab + '</svg>'), false).some((s) => /covers box/.test(s))).toBe(true);
  });
  it('flags text too wide for its box', () => {
    const p = parse(ok), b = p.boxes.find((x) => x.lines.length > 1)!;
    const bad = ok.replace(`>${b.lines[1]!.s}</text>`, `>${b.lines[1]!.s}${'很长的文字'.repeat(4)}</text>`);
    expect(check(bad, true).some((s) => /does not fit/.test(s))).toBe(true);
  });
});

for (const L of ['zh', 'en'] as const) for (const [k, get] of [['phone', phone], ['wide', wide]] as const) describe(`R13 T1 full-stack diagram (${k}, ${L})`, () => {
  const svg = get(L), ids = comps(svg), p = parse(svg);
  it('passes the geometry check: no overlap, nothing outside, no line through a box, no crossing, labels clear, text fits', () => {
    expect(check(svg, true)).toEqual([]);
  });
  it('holds every walk part, the new parts, and the five maths stations', () => {
    for (const id of [...WALK, ...NEW]) expect(ids, id).toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const S of ['K1', 'K2', 'K3', 'K4', 'K5']) expect(ids.some((id) => KB.C[id]?.zoom === S), S).toBe(true);
    expect(svg.match(/<rect class="band"/g)?.length).toBe(9);
  });
  it('every station except T1 has a 🔍 box that drills into it', () => {
    const z = new Set(ids.filter((id) => KB.C[id]?.zoom).map((id) => KB.C[id]!.zoom));
    expect(KB.TABORDER.filter((S) => S !== 'T1' && !z.has(S))).toEqual([]);
    if (k === 'phone') expect(svg.match(/class="zm-h"/g)?.length).toBe(ids.filter((id) => KB.C[id]?.zoom && KB.PATH[KB.C[id]!.zoom!]).length);
  });
  it('lines: only straight segments (M/H/V/L), endpoints are real boxes, supports lines are labelled', () => {
    for (const m of svg.matchAll(/<path class="arrow[^"]*"[^>]*\sd="([^"]+)"/g)) expect(m[1], m[0]).toMatch(/^[MHVL\d\s.,-]+$/);
    const ed = [...svg.matchAll(/<path class="arrow (sup|mmx)" data-from="([^"]+)" data-to="([^"]+)"/g)];
    expect(ed.length).toBe(GEDGES.length);
    for (const [, , f, t] of ed) { expect(ids, f).toContain(f); expect(ids, t).toContain(t); }
    expect(p.labs.filter((l) => /→/.test(l.s)).length).toBeGreaterThanOrEqual(GEDGES.filter((e) => e.at === 'from').length);
  });
  it('every box opens a popup: it has a node card in its owner station', () => {
    const nodes = J<Record<string, Record<string, unknown>>>(`nodes/T1.${L}.json`) as Record<string, unknown>;
    for (const id of ids) {
      const own = KB.C[id]!.t, n = own === 'T1' ? nodes : J<Record<string, unknown>>(`nodes/${own}.${L}.json`);
      expect(n[id], `${id} (${own})`).toBeTruthy();
    }
  });
  it('the R12 knowledge-map list is gone', () => {
    const html = J<{ html: string }>(`st/T1.${L}.json`).html;
    expect(html).not.toContain('m2k'); expect(html).not.toContain('km-l');
  });
});
