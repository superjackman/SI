/* R26 SEO: the three new stations get their own static pages (zh + en), are in both catalogues and the sitemap,
   carry the boundary line, unique titles / descriptions, and the en pages have no Chinese in head tags. */
import { describe, it, expect, beforeAll } from 'vitest';
import { resolve } from 'node:path';
import { buildSeo, ORIGIN } from '../../scripts/seo.mjs';

const web = resolve(process.cwd()) + '/';
const BASE = '/SI/';
let F: Map<string, string>;
const doc = (html: string) => new DOMParser().parseFromString(html, 'text/html');
beforeAll(() => { F = buildSeo({ web, base: BASE, lastmod: () => '2026-10-25' }); }, 60_000);
const NEW = ['Job', 'Skl', 'Bld'];

describe('R26 SEO pages', () => {
  it('a page per new station per language, with h1, description, canonical, hreflang and a link into the app', () => {
    for (const S of NEW) for (const L of ['zh', 'en'] as const) {
      const f = (L === 'en' ? 'en/' : '') + `s/${S}/index.html`; expect(F.has(f), f).toBe(true);
      const h = doc(F.get(f)!), u = ORIGIN + BASE + f.replace(/index\.html$/, '');
      expect(h.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe(u);
      expect(h.querySelectorAll('link[rel=alternate][hreflang]').length).toBe(3);
      const desc = h.querySelector('meta[name=description]')!.getAttribute('content')!; expect(desc.length).toBeGreaterThan(20);
      if (L === 'en') expect(/[\u3400-\u9fff]/.test(h.title + desc)).toBe(false);
      expect(h.querySelector('.open a')!.getAttribute('href')).toBe(BASE + (L === 'en' ? '?lang=en' : '') + '#' + S);
      expect(F.get(f)).toContain(L === 'zh' ? '这里不讲' : 'Not covered');
      expect(F.get(f)!).not.toMatch(/科学上网|翻墙|VPN|梯子|代理服务器|海外信用卡|虚拟卡|circumvent/i);
    }
  });
  it('the catalogues list them right after Loc, and the sitemap has all six URLs', () => {
    for (const [cat, pre] of [['s/index.html', ''], ['en/s/index.html', 'en/']] as const) {
      const hrefs = [...doc(F.get(cat)!).querySelectorAll('ol a')].map((a) => a.getAttribute('href'));
      const i = hrefs.indexOf(`${BASE}${pre}s/Loc/`);
      expect(hrefs.slice(i, i + 4)).toEqual(['Loc', ...NEW].map((S) => `${BASE}${pre}s/${S}/`));
      expect(hrefs.length).toBe(27);
    }
    const sm = F.get('sitemap.xml')!;
    for (const S of NEW) { expect(sm).toContain(`<loc>${ORIGIN}${BASE}s/${S}/</loc>`); expect(sm).toContain(`<loc>${ORIGIN}${BASE}en/s/${S}/</loc>`); }
  });
});
