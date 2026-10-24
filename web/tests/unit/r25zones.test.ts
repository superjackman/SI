/* R25: the 🔌 Api and 💻 Loc stations — boundary line on top, dated vendor figures with official links, both calculators,
   jumps into the principle stations, and nothing about getting around network restrictions or overseas sign-ups. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRICES, CHECKED } from '../../src/m2/calc';

const GEN = join(__dirname, '../../src/legacy/gen');
const J = <T>(p: string) => JSON.parse(readFileSync(join(GEN, p), 'utf8')) as T;
const st = (S: string, L: string) => J<{ html: string }>(`st/${S}.${L}.json`).html;
const KB = J<{ TABORDER: string[]; C: Record<string, { zoom?: string }> }>('kb.json');

describe('R25 zones', () => {
  it('Api and Loc follow Up in the tab order, and T1 has a 🔍 box for each', () => {
    const o = KB.TABORDER; expect(o.slice(o.indexOf('Up'), o.indexOf('Up') + 3)).toEqual(['Up', 'Api', 'Loc']);
    expect(KB.C.aApi?.zoom).toBe('Api'); expect(KB.C.lHub?.zoom).toBe('Loc');
  });
  for (const L of ['zh', 'en'] as const) for (const S of ['Api', 'Loc']) describe(`${S} ${L}`, () => {
    const h = st(S, L);
    it('says what it covers and what it does not, above the first diagram', () => {
      const i = h.indexOf('pl-bd'); expect(i).toBeGreaterThan(-1);
      expect(i).toBeLessThan(h.indexOf('<svg'));
      expect(h).toContain(L === 'zh' ? '这里不讲' : 'Not covered');
    });
    it('has its calculator, quiz, and jumps into the principle stations', () => {
      expect(h).toContain(S === 'Api' ? 'id="labCost"' : 'id="labMem"');
      expect(h).toMatch(S === 'Api' ? /data-sp="T3"|data-lv="T3"/ : /data-sp="T5"|data-lv="T5"/);
    });
    it('never covers circumvention or overseas sign-up', () => {
      expect(h).not.toMatch(/科学上网|翻墙|VPN|梯子|代理服务器|海外信用卡|虚拟卡|proxy|circumvent/i);
    });
    it('every outside link is https and opens safely', () => {
      for (const m of h.matchAll(/<a href="(http[^"]+)"([^>]*)>/g)) { expect(m[1]).toMatch(/^https:\/\//); expect(m[2]).toContain('noopener'); }
    });
  });
  it('Api vendor figures are dated and match the calculator prices', () => {
    const h = st('Api', 'zh');
    expect(h).toContain(`核对于 ${CHECKED}`);
    for (const p of PRICES) expect(h, p.id).toContain(p.url);
  });
});
