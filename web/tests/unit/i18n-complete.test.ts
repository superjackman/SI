import { describe, expect, it } from 'vitest';
import { CODES } from '../../src/i18n/codes';
import { GRP } from '../../src/legacy/kb';
import type { Bi } from '../../src/i18n/types';

const CJK = /[\u3400-\u9fff\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/;
// the language switch label intentionally names the *other* language
const ALLOW_CJK_IN_EN = new Set(['lang.switchTo']);

function check(where: string, b: Bi) {
  expect(b.zh.trim(), `${where}.zh empty`).not.toBe('');
  expect(b.en.trim(), `${where}.en empty`).not.toBe('');
}
describe('i18n completeness', () => {
  it('every code has zh and en', () => { for (const [k, v] of Object.entries(CODES)) check(k, v); });
  it('no Chinese left in English codes', () => {
    for (const [k, v] of Object.entries(CODES)) if (!ALLOW_CJK_IN_EN.has(k)) expect(CJK.test(v.en), k).toBe(false);
  });
  it('drawer groups: bilingual, cover every station once', () => {
    const seen: string[] = [];
    for (const [, name, ks] of GRP) { check('grp', name); expect(CJK.test(name.en)).toBe(false); seen.push(...ks); }
    expect(seen).toEqual(['T1', 'U', 'Ua', 'Ub', 'Uc', 'Ud', 'Up', 'Api', 'Loc', 'T2', 'T3', 'N', 'T4', 'T4a', 'T4b', 'T5', 'T6', 'T7', 'T8', 'K1', 'K2', 'K3', 'K4', 'K5']);
  });
});
