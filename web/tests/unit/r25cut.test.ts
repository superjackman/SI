/* R25: 目录 (outline) rows and page-map buttons are never cut inside an English word; a cut label ends in "…" */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fit, strip } from '../../m2/lib';

const gen = (f: string) => JSON.parse(readFileSync(`src/legacy/gen/${f}`, 'utf8')) as unknown;
const html = (S: string, L: string) => (gen(`st/${S}.${L}.json`) as { html: string }).html;
type Row = [string, string, string, number];
/** the card's full heading, by id */
const heading = (h: string, id: string) => {
  const i = h.indexOf(`id="${id}"`); if (i < 0) return null;
  const nx = h.indexOf('<div class="card', i + 5), m = h.slice(i, nx < 0 ? undefined : nx).match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/);
  return m ? strip(m[1]!).replace(/\s+/g, ' ').trim() : null;
};
const lead = (s: string) => s.replace(/^[^\p{L}\p{Nd}“"《（(]+/u, '').replace(/^(容易混淆：|Easy to mix up: )/u, '');
/** a cut label is a prefix of the full title that stops at a word boundary */
const atWord = (cut: string, full: string) => {
  const c = lead(cut.replace(/…$/, '')), f = lead(full);
  if (!f.startsWith(c)) return `not a prefix: «${cut}» of «${full}»`;
  const next = f.charAt(c.length);
  return /[A-Za-z0-9]/.test(c.slice(-1)) && /[A-Za-z0-9]/.test(next) ? `mid-word: «${cut}» of «${full}»` : null;
};

describe('fit()', () => {
  it('cuts English at a word boundary and adds …', () => {
    expect(fit('Overview: six layers at work behind one sentence', 21, 'en')).toBe('Overview: six layers…');
    expect(fit('End to end: “Check tomorrow’s weather”', 18, 'en')).toBe('End to end…');
    expect(fit('Short title', 20, 'en')).toBe('Short title');
    expect(fit('the model vs the agent and more words', 18, 'en')).toBe('the model…');
  });
  it('a single very long word is still cut (with …) rather than dropped', () => {
    expect(fit('Supercalifragilisticexpialidocious', 12, 'en')).toBe('Supercalifr…');
  });
  it('zh: half-width Latin counts ½ and a Latin word is not chopped', () => {
    expect(fit('放大一个 Transformer 块里面的每一个零件看看', 12, 'zh')).toBe('放大一个 Transformer…');
    expect(fit('输出打分层：从向量到 Transformer', 12, 'zh')).toBe('输出打分层：从向量到…');
  });
});

for (const L of ['en', 'zh'] as const) describe(`${L}: outline rows and page maps`, () => {
  const out = gen(`outline.${L}.json`) as Record<string, Row[]>;
  it('every cut 目录 row ends at a word boundary', () => {
    const bad: string[] = [];
    for (const [S, rows] of Object.entries(out)) {
      const h = html(S, L);
      for (const r of rows) {
        if (r[2] === 'quiz' || !r[1].endsWith('…')) continue;
        const f = r[0] ? heading(h, r[0]) : null; if (!f) continue;
        const e = atWord(r[1], f); if (e) bad.push(`${S}/${r[0]}: ${e}`);
      }
    }
    expect(bad).toEqual([]);
  });
  if (L === 'en') it('no English row looks chopped (ends in a letter at the old fixed length without …)', () => {
    const bad = Object.values(out).flat().filter((r) => r[2] !== 'quiz' && !r[1].startsWith('⚠️') && [...r[1]].length === 20 && /[A-Za-z]$/.test(r[1]));
    expect(bad).toEqual([]);
  });
  it('every page-map button is the full title or a word-boundary cut of it', () => {
    const bad: string[] = [];
    for (const S of Object.keys(out)) {
      const h = html(S, L), pm = h.match(/<div class="ph-map" id="pm[^"]+">([\s\S]*?)<\/div>/); if (!pm) continue;
      for (const m of pm[1]!.matchAll(/data-sj="([^"]*)"[^>]*>([^<]*)<\/button>/g)) {
        const t = strip(m[2]!), f = heading(h, m[1]!); if (!f) continue;
        if (!t.endsWith('…')) { expect(lead(f).endsWith(lead(t)) || lead(f) === lead(t) || f.includes(lead(t)), `${S}/${m[1]}`).toBe(true); continue; }
        const e = atWord(t, f); if (e) bad.push(`${S}/${m[1]}: ${e}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
