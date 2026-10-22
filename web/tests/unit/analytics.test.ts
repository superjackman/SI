import { describe, expect, it } from 'vitest';
import { pathFor } from '../../src/analytics';
describe('analytics virtual paths unchanged from the live page', () => {
  it('T1 is home', () => expect(pathFor('zh', 'T1')).toBe('/zh/home'));
  it('others by id', () => { expect(pathFor('en', 'N')).toBe('/en/N'); expect(pathFor('zh', 'T4a')).toBe('/zh/T4a'); });
});
