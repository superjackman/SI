/* integrity of the content snapshot taken from the live page (src/legacy/gen) */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { KB, PATH, TABORDER } from '../../src/legacy/kb';

const GEN = join(__dirname, '../../src/legacy/gen');
const J = (p: string) => JSON.parse(readFileSync(join(GEN, p), 'utf8'));
const CJK = /[\u3400-\u9fff]/;
const attrs = (html: string, a: string) => [...html.matchAll(new RegExp(`\\s${a}="([^"]*)"`, 'g'))].map((m) => m[1] as string);

describe('knowledge base', () => {
  it('27 stations in order (M2 U–Ud, the M3 products stop Up, then R25 Api and Loc and R26 Job, Skl and Bld after T1, the math stops K1–K5 last), every part bilingual and owned by a station', () => {
    expect(TABORDER).toEqual(['T1', 'U', 'Ua', 'Ub', 'Uc', 'Ud', 'Up', 'Api', 'Loc', 'Job', 'Skl', 'Bld', 'T2', 'T3', 'N', 'T4', 'T4a', 'T4b', 'T5', 'T6', 'T7', 'T8', 'K1', 'K2', 'K3', 'K4', 'K5']);
    for (const [id, c] of Object.entries(KB.C)) {
      expect(c.n.zh && c.n.en, id).toBeTruthy();
      expect(PATH[c.t], id + ' owner').toBeTruthy();
      if (c.zoom) expect(PATH[c.zoom], id + ' zoom').toBeTruthy();
      if (c.up) expect(KB.C[c.up], id + ' up').toBeTruthy();
    }
  });
});
for (const S of TABORDER) for (const lang of ['zh', 'en'] as const) {
  describe(`${S} ${lang} snapshot`, () => {
    const st = J(`st/${S}.${lang}.json`) as { cls: string; html: string };
    it('links point at real stations / parts / anchors', () => {
      for (const g of [...attrs(st.html, 'data-go'), ...attrs(st.html, 'data-zoom'), ...attrs(st.html, 'data-ddgo')]) expect(PATH[g], 'station ' + g).toBeTruthy();
      for (const o of [...attrs(st.html, 'data-open'), ...attrs(st.html, 'data-id')]) expect(KB.C[o] || o === '', 'part ' + o).toBeTruthy();
    });
    it('cross-station jumps land on an element of the target station', () => {
      for (const m of st.html.matchAll(/data-jump="([^"]+)"(?:[^>]*?data-lv="([^"]*)")?/g)) {
        const id = m[1] as string, lv = m[2] || S;
        expect(PATH[lv], 'station ' + lv).toBeTruthy();
        expect(attrs(J(`st/${lv}.${lang}.json`).html, 'id'), `${id} in ${lv}`).toContain(id);
      }
    });
    it('lab islands find their elements in the snapshot', async () => {
      const m2 = /^([UK]|Api$|Loc$|Job$|Skl$|Bld$)/.test(S), file = m2 ? join(GEN, `../../m2/labs/${S}.ts`) : join(GEN, `islands/${S}.js`);
      if (m2 && !existsSync(file)) { expect(st.html).not.toContain('class="card lab'); return; }
      const labs = m2 ? ((await import(/* @vite-ignore */ file)) as { LABS: { ids: string[] }[] }).LABS
        : JSON.parse(/export const LABS = (\[.*\]);/.exec(readFileSync(file, 'utf8'))![1]!) as { ids: string[] }[];
      const ids = new Set(attrs(st.html, 'id'));
      for (const b of labs) expect(b.ids.some((i) => ids.has(i)), b.ids.join(',')).toBe(true);
    });
    it('drill badges are not baked in (the app draws them per station)', () => { expect(st.html).not.toContain('class="dd-b"'); });
    if (lang === 'en') it('no Chinese in visible English text', () => {
      const text = st.html.replace(/<span lang="zh-CN">[^<]*<\/span>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
      const bad = text.split(/\s{2,}/).filter((t) => CJK.test(t) && !/中文/.test(t));
      expect(bad.slice(0, 5)).toEqual([]);
    });
  });
}
describe('popup cards', () => {
  it('every part has a card in both languages', () => {
    const files = readdirSync(join(GEN, 'nodes'));
    const have = { zh: new Set<string>(), en: new Set<string>() };
    for (const f of files) { const [, lang] = f.split('.') as [string, 'zh' | 'en']; for (const id of Object.keys(J('nodes/' + f))) have[lang].add(id); }
    for (const id of Object.keys(KB.C)) { expect(have.zh.has(id), 'zh ' + id).toBe(true); expect(have.en.has(id), 'en ' + id).toBe(true); }
  });
});
