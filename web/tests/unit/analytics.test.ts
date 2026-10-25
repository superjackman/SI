import { describe, expect, it } from 'vitest';
import { pathFor } from '../../src/analytics';
describe('analytics virtual paths unchanged from the live page', () => {
  /* R27: the home page is H; T1 (app overview, now the principles zone) reports under its own id */
  it('H is home', () => { expect(pathFor('zh', 'H')).toBe('/zh/home'); expect(pathFor('en', 'T1')).toBe('/en/T1'); });
  it('others by id', () => { expect(pathFor('en', 'N')).toBe('/en/N'); expect(pathFor('zh', 'T4a')).toBe('/zh/T4a'); });
});
