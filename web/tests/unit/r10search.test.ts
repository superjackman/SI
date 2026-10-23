/* R10: search results render math with the pre-rendered KaTeX role lines (search-math.json) instead of raw TeX. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { strip } from '../../m2/lib';
import { roleHasTex } from '../../src/shell/TopBar';

const GEN = join(__dirname, '../../src/legacy/gen');
type R = Record<string, { zh: string; en: string }>;
const S = JSON.parse(readFileSync(join(GEN, 'search.json'), 'utf8')) as R;
const M = JSON.parse(readFileSync(join(GEN, 'search-math.json'), 'utf8')) as R;

describe('search-math.json', () => {
  it('holds only parts that are in the search index, each with KaTeX HTML in both languages', () => {
    expect(Object.keys(M).length).toBeGreaterThan(10);
    for (const [id, h] of Object.entries(M)) {
      expect(S[id], id).toBeTruthy();
      expect(h.zh + h.en, id).toContain('class="katex"');
    }
  });
  it('its HTML stripped back to text equals the plain search line (same content, math as TeX)', () => {
    for (const [id, h] of Object.entries(M)) for (const L of ['zh', 'en'] as const) expect(strip(h[L]), `${id}.${L}`).toBe(S[id]![L]);
  });
  it('every plain line that shows raw TeX has a math twin, and the trigger fires for it', () => {
    for (const [id, r] of Object.entries(S)) for (const L of ['zh', 'en'] as const) if (/\\[a-zA-Z]+/.test(r[L])) {
      expect(M[id], id).toBeTruthy(); expect(roleHasTex(r[L]), id).toBe(true);
    }
    expect(roleHasTex('plain words only')).toBe(false);
  });
});

/* R10: every source line with an overseas academic / legal link carries the shared reachability note, once */
import { readdirSync } from 'node:fs';
import { CODES } from '../../src/i18n/codes';
describe('overseas source reachability note', () => {
  const HOST = /href="https:\/\/(?:www\.)?(?:arxiv\.org|jmlr\.org|copyright\.gov|artificialintelligenceact\.eu|[a-z.-]*europa\.eu|nature\.com|doi\.org)\//;
  it('is on every such source line in both languages, once, with the shared wording', () => {
    let n = 0;
    for (const f of readdirSync(join(GEN, 'st')).filter((f) => /\.(zh|en)\.json$/.test(f))) {
      const L = f.endsWith('.zh.json') ? 'zh' : 'en';
      const h = (JSON.parse(readFileSync(join(GEN, 'st', f), 'utf8')) as { html?: string }).html ?? '';
      for (const m of h.matchAll(/<p class="k-src">([\s\S]*?)<\/p>/g)) {
        const has = (m[1]!.match(/class="k-reach"/g) ?? []).length;
        if (HOST.test(m[1]!)) { n++; expect(has, f).toBe(1); expect(m[1]).toContain(CODES['src.reach'][L]); } else expect(has, f).toBe(0);
      }
    }
    expect(n).toBeGreaterThan(50);
  });
  it('never claims a mirror works', () => {
    for (const L of ['zh', 'en'] as const) expect(CODES['src.reach'][L]).toMatch(L === 'zh' ? /未实测/ : /not tested/);
  });
});
