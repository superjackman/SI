/* M2 ("how to use an agent", stops U/Ua/Ub/Uc/Ud): lab logic, kb links, generated content in both languages, gen sync. */
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { prodVisible, prodCount, pickWay, PICK_PRESETS, PICK_TRAITS, sessionSteps, needsAsk, ctxLoad, CTX, briefScore, briefTokens, PARTS4, type Trait, type Part4 } from '../../src/m2/logic';
import { KB, TABORDER, kids, part, isStation, GROUP } from '../../src/legacy/kb';
import { QUIZ_KEY } from '../../src/station/quiz';

const M2 = ['U', 'Ua', 'Ub', 'Uc', 'Ud'] as const;
const LANGS = ['zh', 'en'] as const;
const gen = (p: string) => JSON.parse(readFileSync(new URL('../../src/legacy/gen/' + p, import.meta.url), 'utf8')) as unknown;
const CJK = /[\u3400-\u9fff]/;
const S = (...k: Trait[]) => new Set<Trait>(k);

describe('labPick: traits → way', () => {
  it('rule order (first match wins)', () => {
    expect(pickWay(S()).way).toBe('uChat');
    expect(pickWay(S('q')).way).toBe('uChat');
    expect(pickWay(S('code')).way).toBe('uIde');
    expect(pickWay(S('term')).way).toBe('uCli');
    expect(pickWay(S('gui', 'term')).way).toBe('uCua');
    expect(pickWay(S('code', 'clear')).way).toBe('uBg');
    expect(pickWay(S('term', 'clear')).way).toBe('uBg');
    expect(pickWay(S('clear')).way).toBe('uChat');
    expect(pickWay(S('split', 'code')).way).toBe('uMulti');
    expect(pickWay(S('split', 'clear')).way).toBe('uMulti');
    expect(pickWay(S('split')).way).toBe('uChat');
    expect(pickWay(S('sched', 'split', 'code', 'gui')).way).toBe('uRoutine');
  });
  it('risk never changes the way, only adds a confirmation', () => {
    for (const k of PICK_TRAITS) {
      const a = pickWay(S(k)), b = pickWay(S(k, 'risk'));
      expect(b.way).toBe(k === 'risk' ? 'uChat' : a.way);
      expect(b.confirm).toBe(true);
      if (k !== 'risk') expect(a.confirm).toBe(false);
    }
  });
  it('presets', () => {
    const w = (p: string) => pickWay(new Set(PICK_PRESETS[p]));
    expect(w('ask')).toEqual({ way: 'uChat', confirm: false });
    expect(w('fix')).toEqual({ way: 'uIde', confirm: false });
    expect(w('report')).toEqual({ way: 'uRoutine', confirm: false });
    expect(w('flight')).toEqual({ way: 'uCua', confirm: true });
    expect(w('tests')).toEqual({ way: 'uMulti', confirm: false });
  });
});

describe('labSession: steps and permission levels', () => {
  it('with tests the session verifies, without it ends unverified', () => {
    expect(sessionSteps(true).map((s) => s.key)).toEqual(['readSrc', 'readTest', 'editSrc', 'addTest', 'runTest', 'doneOk']);
    expect(sessionSteps(false).map((s) => s.key)).toEqual(['readSrc', 'readTest', 'editSrc', 'doneUnverified']);
  });
  it('reading never asks; ask stops edits+commands; edit stops commands; auto never', () => {
    const asks = (p: 'ask' | 'edit' | 'auto') => sessionSteps(true).filter((s) => needsAsk(p, s.kind)).map((s) => s.key);
    expect(asks('ask')).toEqual(['editSrc', 'addTest', 'runTest']);
    expect(asks('edit')).toEqual(['runTest']);
    expect(asks('auto')).toEqual([]);
    for (const p of ['ask', 'edit', 'auto'] as const) { expect(needsAsk(p, 'read')).toBe(false); expect(needsAsk(p, 'done')).toBe(false); }
  });
});

describe('labCtxLoad: tool manuals in the window', () => {
  it('all-at-once vs on-demand', () => {
    const a = ctxLoad(10, 'all', false);
    expect(a.tools).toBe(10 * CTX.full);
    expect(a.sys + a.tools + a.loaded + a.chat + a.free).toBe(CTX.window);
    expect(a.pct).toBe(12.5);
    expect(a.warn).toBe(false);
    const l = ctxLoad(10, 'lazy', false);
    expect(l.tools).toBe(10 * CTX.brief);
    expect(l.loaded).toBe(0);
    const c = ctxLoad(10, 'lazy', true);
    expect(c.loaded).toBe(CTX.full);
    expect(c.manual).toBe(10 * CTX.brief + CTX.full);
    expect(c.manual).toBeLessThan(a.manual);
    expect(ctxLoad(10, 'all', true).loaded).toBe(0);
  });
  it('warns above a quarter of the window; never negative free space for the lab options', () => {
    expect(ctxLoad(20, 'all', false).warn).toBe(false);
    expect(ctxLoad(30, 'all', false).warn).toBe(true);
    expect(ctxLoad(30, 'lazy', true).warn).toBe(false);
    for (const n of [5, 10, 20, 30, 50]) for (const m of ['all', 'lazy'] as const) expect(ctxLoad(n, m, true).free).toBeGreaterThanOrEqual(0);
  });
});

describe('labPrompt: the four things of a brief', () => {
  const P = (...k: Part4[]) => new Set<Part4>(k);
  it('score: base + parts − dumped documents, clamped', () => {
    expect(briefScore(P(), 0)).toBe(10);
    expect(briefScore(new Set(PARTS4), 0)).toBe(100);
    expect(briefScore(P('goal'), 0)).toBe(40);
    expect(briefScore(new Set(PARTS4), 2)).toBe(76);
    expect(briefScore(P(), 5)).toBe(0);
    let prev = 101;
    for (let d = 0; d <= 5; d++) { const s = briefScore(new Set(PARTS4), d); expect(s).toBeLessThan(prev); prev = s; }
  });
  it('tokens: documents dominate', () => {
    expect(briefTokens(new Set(PARTS4), 0)).toBe(260);
    expect(briefTokens(P(), 1)).toBe(3020);
  });
});

describe('kb: M2 stops and parts', () => {
  it('U..Ud sit between T1 and T2, in the "more" group only (not the bottom bar)', () => {
    const i = TABORDER.indexOf('T1');
    expect(TABORDER.slice(i, i + 8)).toEqual(['T1', ...M2, 'Up', 'T2']);
    for (const s of M2) { expect(isStation(s)).toBe(true); expect(GROUP[s]).toBe('more'); expect(KB.TABN[s]?.zh).toBeTruthy(); expect(KB.TABN[s]?.en).toBeTruthy(); }
  });
  it('every M2 part has a stop, an up link, valid zoom / down links; the hub zooms into the 4 sub-stops', () => {
    const use = Object.entries(KB.C).filter(([, c]) => c.cat === 'use');
    expect(use.map(([k]) => k).sort()).toEqual(['uBg', 'uChat', 'uCli', 'uCtx', 'uCua', 'uHub', 'uIde', 'uKit', 'uMcp', 'uMulti', 'uPrompt', 'uRoutine', 'uSkill', 'uSolo', 'uTool', 'uWell', 'uWith'].sort());
    for (const [k, c] of use) {
      expect(M2).toContain(c.t);
      expect(part(c.up!), k + ' up').toBeTruthy();
      if (c.zoom) expect(isStation(c.zoom)).toBe(true);
      expect((c.dn ?? []).length, k + ' needs a link down into the principles').toBeGreaterThan(0);
      for (const d of c.dn ?? []) { expect(part(d), k + ' dn ' + d).toBeTruthy(); expect(part(d)!.cat).not.toBe('use'); }
      expect(c.n.en).not.toMatch(CJK);
    }
    expect(['uWith', 'uSolo', 'uKit', 'uWell'].map((k) => part(k)!.zoom)).toEqual(['Ua', 'Ub', 'Uc', 'Ud']);
    expect(kids('uHub').sort()).toEqual(['uKit', 'uSolo', 'uWell', 'uWith']);
  });
  it('back links: principle parts in T1/T2/T3 point up to the usage parts', () => {
    const back = Object.entries(KB.C).filter(([, c]) => c.use?.length);
    expect(back.length).toBeGreaterThanOrEqual(8);
    for (const [k, c] of back) {
      expect(c.cat).not.toBe('use');
      for (const u of c.use!) expect(isStation(u) || part(u)?.cat === 'use' || (c.cat === 'math' && !!part(u) && part(u)!.cat !== 'math'), k + ' use ' + u).toBe(true);
    }
    expect(part('loop')!.use).toContain('uHub');
    expect(part('mcp')!.use).toContain('uMcp');
    /* a link down from a usage part is answered by a link back up */
    for (const [k, c] of Object.entries(KB.C)) if (c.cat === 'use') for (const d of c.dn ?? []) {
      const up = (x: string): string[] => { const p = part(x); return p ? [x, ...(p.up ? up(p.up) : [])] : []; };
      const chain = up(k);
      const ok = Object.entries(KB.C).some(([, o]) => o.use?.some((u) => chain.includes(u)));
      expect(ok, d).toBe(true);
    }
  });
});

describe('generated content (both languages)', () => {
  for (const s of M2) for (const l of LANGS) {
    it(`${s}.${l}: station html, popup cards, outline, quiz`, () => {
      const st = gen(`st/${s}.${l}.json`) as { html: string };
      expect(st.html.length).toBeGreaterThan(3000);
      expect(st.html).toContain(`id="quiz${s}"`);
      expect(st.html).toContain('<svg');
      expect(st.html).toMatch(/示意|illustrative/i);
      if (l === 'en') expect(st.html.replace(/<[^>]+>/g, '')).not.toMatch(CJK);
      const nodes = gen(`nodes/${s}.${l}.json`) as Record<string, { title: string; body: string }>;
      expect(Object.keys(nodes).length).toBeGreaterThan(1);
      for (const [k, n] of Object.entries(nodes)) {
        expect(part(k)?.t, k).toBe(s);
        expect(n.body.length).toBeGreaterThan(200);
        if (l === 'en') { expect(n.title).not.toMatch(CJK); expect(n.body.replace(/<[^>]+>/g, '')).not.toMatch(CJK); }
      }
      const qz = gen(`quiz.${l}.json`) as Record<string, [string, string[], number, string][]>;
      expect(qz[s]!.map((q) => q[2])).toEqual(QUIZ_KEY[s]);
      for (const q of qz[s]!) { expect(q[1].length).toBe(4); expect(q[3].length).toBeGreaterThan(10); }
    });
  }
  it('labs: U/Ua/Ub/Uc/Ud carry their labs in order', () => {
    const L: Record<string, string[]> = { U: ['labPick'], Ua: ['labSession', 'labClick'], Ub: ['labFan', 'labCron'], Uc: ['labCtxLoad'], Ud: ['labPrompt'] };
    for (const l of LANGS) for (const s of M2) {
      const h = (gen(`st/${s}.${l}.json`) as { html: string }).html;
      const labs = [...h.matchAll(/class="card lab[^"]*" id="(\w+)"/g)].map((m) => m[1]);
      expect(labs).toEqual(L[s]);
    }
  });
  it('the grey M3 placeholder is gone; U links to the products stop instead', () => {
    for (const l of LANGS) for (const s of [...M2, 'Up']) expect((gen(`st/${s}.${l}.json`) as { html: string }).html.includes('m3ph')).toBe(false);
    for (const l of LANGS) expect((gen(`st/U.${l}.json`) as { html: string }).html).toMatch(/id="c_U_m3"[\s\S]*data-go="Up"/);
  });
  it('search index has every M2 part', () => {
    const txt = JSON.stringify(gen('search.json'));
    for (const k of ['uChat', 'uIde', 'uCli', 'uCua', 'uBg', 'uRoutine', 'uMulti', 'uTool', 'uMcp', 'uSkill', 'uPrompt', 'uCtx', 'uHub', 'uWith', 'uSolo', 'uKit', 'uWell']) expect(txt, k).toContain(`"${k}"`);
  });
  it('outline lists the M2 stops in both languages', () => {
    for (const l of LANGS) { const o = JSON.stringify(gen(`outline.${l}.json`)); for (const s of M2) expect(o).toContain(`"${s}"`); }
  });
  it('no vendor or product names in M2 text', () => {
    const bad = /\b(OpenAI|ChatGPT|Anthropic|Claude|Gemini|Copilot|Cursor|Codex|Devin|Windsurf|GPT-?\d|Llama|Mistral|DeepSeek|Qwen|Kimi|Grok|Slack|GitHub|VS ?Code|Zapier|n8n|Notion|Perplexity)\b/i;
    for (const l of LANGS) for (const s of M2) {
      expect((gen(`st/${s}.${l}.json`) as { html: string }).html.replace(/<[^>]+>/g, ' ')).not.toMatch(bad);
      for (const n of Object.values(gen(`nodes/${s}.${l}.json`) as Record<string, { title: string; body: string }>)) expect(n.title + n.body.replace(/<[^>]+>/g, ' ')).not.toMatch(bad);
    }
  });
});

describe('gen sync', () => {
  it('npm run m2 -- --check: the committed gen files match the M2 sources', () => {
    const out = execFileSync(process.execPath, ['node_modules/vite-node/vite-node.mjs', 'm2/build.ts', '--check'], { cwd: process.cwd(), encoding: 'utf8' });
    expect(out).toContain('up to date');
  }, 60_000);
});

/* ---- M3: the products stop (Up) ---- */
import { GROUPS, PRODUCTS, VERIFIED } from '../../m2/content/products';
describe('M3 products (Up)', () => {
  it('data: unique names, https links, bilingual descriptions, known ways, no prices or versions', () => {
    expect(new Set(PRODUCTS.map((p) => p.n)).size).toBe(PRODUCTS.length);
    expect(new Set(PRODUCTS.map((p) => p.u)).size).toBe(PRODUCTS.length);
    expect(VERIFIED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const p of PRODUCTS) {
      expect(p.u, p.n).toMatch(/^https:\/\/[a-z0-9.-]+\.[a-z]+(\/[\w./-]*)?$/);
      expect(p.g.length, p.n).toBeGreaterThan(0);
      for (const g of p.g) expect(GROUPS, p.n).toContain(g);
      expect(p.d.zh.length).toBeGreaterThan(4); expect(p.d.en.length).toBeGreaterThan(4);
      expect(p.d.en + p.v.en + (p.ne ?? '')).not.toMatch(CJK);
      if (CJK.test(p.n)) expect(p.ne, p.n).toBeTruthy();
      expect(p.d.zh + p.d.en, p.n).not.toMatch(/[$¥€]|\d+\s*(元|美元|USD|\/月|per month)|\bv\d+\.\d/i);
    }
    for (const g of GROUPS) expect(PRODUCTS.some((p) => p.g.includes(g)), g).toBe(true);
  });
  it('R10: office agents and deep-research flags are present', () => {
    const by = (n: string) => PRODUCTS.find((p) => p.n === n);
    for (const n of ['千问办公', 'WorkBuddy', '百度搭子', '扣子', '豆包', 'Kimi']) expect(by(n)?.office, n).toBe(true);
    for (const n of ['ChatGPT', 'Gemini', 'Kimi', 'Perplexity', '秘塔AI搜索']) expect(by(n)?.research, n).toBe(true);
    expect(by('Replit')?.u).toBe('https://replit.com');
    expect(PRODUCTS.some((p) => p.u.includes('space.coze.cn'))).toBe(false);
    for (const L of LANGS) {
      const h = (gen(`st/Up.${L}.json`) as { html: string }).html;
      expect(h.match(/class="up-b of"/g)?.length).toBe(PRODUCTS.filter((p) => p.office).reduce((a, p) => a + p.g.length, 0));
    }
  });
  it('every way part exists in kb, and the stop sits under U after Ud', () => {
    for (const g of GROUPS) expect(part(g), g).toBeTruthy();
    expect(TABORDER.indexOf('Up')).toBe(TABORDER.indexOf('Ud') + 1);
    expect(KB.PATH.Up).toEqual(['T1', 'U', 'Up']);
    expect(GROUP.Up).toBe('more');
    expect(isStation('Up')).toBe(true);
  });
  it('filter logic', () => {
    const all = { g: 'all', cn: false, os: false };
    expect(prodCount(PRODUCTS, all)).toBe(PRODUCTS.length);
    const cn = PRODUCTS.filter((p) => p.cn).length;
    expect(prodCount(PRODUCTS, { ...all, cn: true })).toBe(cn);
    expect(prodCount(PRODUCTS, { g: 'uChat', cn: false, os: false })).toBe(PRODUCTS.filter((p) => p.g.includes('uChat')).length);
    expect(prodVisible({ g: ['uCli', 'uIde'], cn: false }, { g: 'uIde', cn: false, os: false })).toBe(true);
    expect(prodVisible({ g: ['uCli'], cn: false, os: true }, { g: 'uCli', cn: true, os: false })).toBe(false);
    expect(prodVisible({ g: ['uCli'], cn: true }, { g: 'all', cn: true, os: true })).toBe(false);
    expect(prodCount([{ n: 'a', g: ['x', 'y'], cn: true }, { n: 'a', g: ['y'], cn: true }], all)).toBe(1);
  });
  for (const l of LANGS) it(`Up.${l}: every product once per way, external links safe, date line, quiz, no CJK in en outside product names`, () => {
    const h = (gen(`st/Up.${l}.json`) as { html: string }).html;
    const links = [...h.matchAll(/<a class="up-a" href="([^"]+)" target="_blank" rel="noopener noreferrer">/g)].map((m) => m[1]);
    expect(links.length).toBe(PRODUCTS.reduce((a, p) => a + p.g.length, 0));
    expect(new Set(links)).toEqual(new Set(PRODUCTS.map((p) => p.u)));
    expect(h).not.toMatch(/<a [^>]*href="http(?![^"]*" target="_blank" rel="noopener noreferrer")/);
    expect(h).toContain(VERIFIED);
    expect(h).toMatch(l === 'zh' ? /以官网为准/ : /official site is authoritative/);
    expect(h).toContain('id="quizUp"');
    for (const g of GROUPS) { expect(h).toContain(`data-open="${g}"`); expect(h).toContain(`data-id="${g}"`); }
    expect(h).toContain('2026-07-15');
    if (l === 'en') expect(h.replace(/<span lang="zh-CN">[^<]*<\/span>/g, '').replace(/<[^>]+>/g, '')).not.toMatch(CJK);
    const qz = gen(`quiz.${l}.json`) as Record<string, unknown[]>;
    expect(qz.Up!.length).toBe(3);
    expect(gen(`nodes/Up.${l}.json`)).toEqual({});
  });
  it('T8 glossary has no empty group row for Up', () => {
    for (const l of LANGS) expect((gen(`st/T8.${l}.json`) as { html: string }).html).not.toMatch(/data-m2="1"><td colspan="4">[^<]*›[^<]*(具体产品|Products)<\/td>/);
  });
});
describe('T8 learning map carries the M2 usage parts', () => {
  for (const l of LANGS) it(`T8.${l}: one band with uHub + the four ways, viewBox grown by 154, idempotent marker`, () => {
    const h = (gen(`st/T8.${l}.json`) as { html: string }).html;
    const m = /<g data-m2="map" data-h0="(\d+)">([\s\S]*?<\/g>)<\/g>/.exec(h)!;
    expect(m).toBeTruthy();
    expect(h.match(/data-m2="map"/g)!.length).toBe(1);
    expect(h).toMatch(new RegExp(`<svg id="svgMap" viewBox="0 0 380 ${Number(m[1]) + 154}"`));
    expect([...m[2]!.matchAll(/data-id="([^"]+)"/g)].map((x) => x[1])).toEqual(['uHub', 'uWith', 'uSolo', 'uKit', 'uWell']);
    if (l === 'en') expect(m[2]!.replace(/<[^>]+>/g, '')).not.toMatch(CJK);
  });
});
