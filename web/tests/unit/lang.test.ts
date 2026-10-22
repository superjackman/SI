import { describe, expect, it, beforeEach } from 'vitest';
import { browser, find, fromURL, initialLang, norm, saved, STORAGE_KEY, urlWithLang } from '../../src/i18n/lang';

const loc = (search: string, hash = '', pathname = '/SI/next/') => ({ search, hash, pathname });

describe('norm', () => {
  it.each([['en', 'en'], ['EN', 'en'], ['en-US', 'en'], ['en_GB', 'en'], ['english', 'en'], ['zh', 'zh'], ['zh-CN', 'zh'], ['zh_Hant', 'zh'], ['cn', 'zh'], ['中文', 'zh'], ['%E4%B8%AD%E6%96%87', 'zh']])('%s -> %s', (i, o) => expect(norm(i)).toBe(o));
  it.each(['fr', '', 'e', 'enx', 'zhx'])('rejects %j', (i) => expect(norm(i)).toBeNull());
  it('null-safe', () => expect(norm(null)).toBeNull());
});

describe('URL parsing (same formats as the live page)', () => {
  it('?lang=en', () => expect(fromURL(loc('?lang=en'))).toBe('en'));
  it('other params around it', () => expect(fromURL(loc('?a=1&LANG=zh-CN&b=2'))).toBe('zh'));
  it('#T2&lang=en', () => expect(fromURL(loc('', '#T2&lang=en'))).toBe('en'));
  it('#/T2?lang=en', () => expect(fromURL(loc('', '#/T2?lang=en'))).toBe('en'));
  it('#lang=en', () => expect(fromURL(loc('', '#lang=en'))).toBe('en'));
  it('query wins over hash', () => expect(fromURL(loc('?lang=zh', '#lang=en'))).toBe('zh'));
  it('no lang', () => expect(find('?x=1')).toBeNull());
  it('slang= is not lang=', () => expect(find('?slang=en')).toBeNull());
});

describe('urlWithLang', () => {
  it('adds ?lang when absent', () => expect(urlWithLang(loc(''), 'en')).toBe('/SI/next/?lang=en'));
  it('appends to existing query', () => expect(urlWithLang(loc('?a=1', '#T3'), 'en')).toBe('/SI/next/?a=1&lang=en#T3'));
  it('rewrites in place', () => expect(urlWithLang(loc('?lang=zh&a=1'), 'en')).toBe('/SI/next/?lang=en&a=1'));
  it('rewrites hash token, keeps route', () => expect(urlWithLang(loc('', '#T2&lang=zh'), 'en')).toBe('/SI/next/#T2&lang=en'));
});

describe('priority: url > saved > browser', () => {
  beforeEach(() => localStorage.clear());
  it('saved used when url has none', () => { localStorage.setItem(STORAGE_KEY, 'en'); expect(initialLang(loc(''))).toEqual({ lang: 'en', source: 'saved' }); });
  it('url beats saved', () => { localStorage.setItem(STORAGE_KEY, 'en'); expect(initialLang(loc('?lang=zh'))).toEqual({ lang: 'zh', source: 'url' }); });
  it('garbage saved ignored', () => { localStorage.setItem(STORAGE_KEY, 'xx'); expect(saved()).toBeNull(); });
  it('browser zh-*', () => expect(browser(['zh-TW', 'en'])).toBe('zh'));
  it('browser other', () => expect(browser(['de-DE'])).toBe('en'));
});
