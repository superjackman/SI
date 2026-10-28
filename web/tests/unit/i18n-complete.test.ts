import { describe, expect, it } from 'vitest';
import { CODES } from '../../src/i18n/codes';
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
});
