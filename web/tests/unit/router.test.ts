import { describe, expect, it } from 'vitest';
import { hashFor, parseHash } from '../../src/router/hash';

describe('hash routes (live formats + plan format)', () => {
  it.each([
    ['#T3', 'T3', null], ['#T2&lang=en', 'T2', null], ['#lang=en&T2', 'T2', null], ['#/T2?lang=en', 'T2', null],
    ['#!T4a', 'T4a', null], ['#T3/llm', 'T3', 'llm'], ['#/T3/llm', 'T3', 'llm'], ['#lang=zh', null, null], ['', null, null], ['#', null, null],
  ])('%s', (h, st, node) => { expect(parseHash(h)).toEqual({ station: st, node }); });
  it('writes the live format, keeps a lang token only when the URL had one', () => {
    expect(hashFor('T3', 'en', '#T2')).toBe('#T3');
    expect(hashFor('T3', 'en', '#T2&lang=zh')).toBe('#T3&lang=en');
    expect(hashFor('T1', 'zh', '')).toBe('#T1');
  });
});
