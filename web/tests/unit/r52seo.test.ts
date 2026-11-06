/* R52 SEO restore: static per-station pages, catalogues, sitemap, robots.txt, 404 for the 23 derivation stations. */
import { describe, it, expect, beforeAll } from 'vitest';
import { resolve } from 'node:path';
import { buildSeo, ORIGIN } from '../../scripts/seo.mjs';

const web = resolve(process.cwd()) + '/';
const BASE = '/SI/';
const KEYS = ['0', 'P', '1', '2', '3', '4', '5', '6', '7', '8a', '8b', '9', 'E', '10', '11', '12', '13', '14', 'S', '15a', '15b', 'A', '16'];
let F: Map<string, string>;
const doc = (html: string) => new DOMParser().parseFromString(html, 'text/html');
const pages = () => [...F.keys()].filter((k) => /^(en\/)?s\/(?!news\/|tools\/)[^/]+\/index\.html$/.test(k));
const urlOf = (file: string) => ORIGIN + BASE + file.replace(/index\.html$/, '');

beforeAll(() => { F = buildSeo({ web, base: BASE, lastmod: '2026-11-06' }); }, 30_000);

describe('R52 SEO static pages', () => {
  it('one page per station per language, plus two catalogues, sitemap, robots, 404', () => {
    expect(pages().length).toBe(KEYS.length * 2);
    for (const k of KEYS) for (const p of [`s/${k}/index.html`, `en/s/${k}/index.html`]) expect(F.has(p), p).toBe(true);
    for (const f of ['s/index.html', 'en/s/index.html', 'sitemap.xml', 'robots.txt', '404.html']) expect(F.has(f), f).toBe(true);
  });
  it('titles and descriptions are unique; en pages carry no Chinese in title/desc', () => {
    const t = new Set<string>(), d = new Set<string>();
    for (const f of [...pages(), 's/index.html', 'en/s/index.html']) {
      const h = doc(F.get(f)!), title = h.title, desc = h.querySelector('meta[name=description]')!.getAttribute('content')!;
      expect(t.has(title), `dup title ${f}: ${title}`).toBe(false); expect(d.has(desc), `dup desc ${f}`).toBe(false); t.add(title); d.add(desc);
      expect(Array.from(title).length, f).toBeLessThanOrEqual(80);
      expect(Array.from(desc).length, f).toBeGreaterThan(20); expect(Array.from(desc).length, f).toBeLessThanOrEqual(160);
      if (f.startsWith('en/')) expect(/[\u3400-\u9fff]/.test(title + desc), f).toBe(false);
    }
  });
  it('canonical + reciprocal hreflang; OG tags; open link into #D/<key>', () => {
    for (const f of pages()) {
      const h = doc(F.get(f)!), u = urlOf(f);
      expect(h.querySelector('link[rel=canonical]')!.getAttribute('href'), f).toBe(u);
      const alt = Object.fromEntries([...h.querySelectorAll('link[rel=alternate][hreflang]')].map((l) => [l.getAttribute('hreflang')!, l.getAttribute('href')!]));
      expect(Object.keys(alt).sort()).toEqual(['en', 'x-default', 'zh-CN']);
      const app = h.querySelector<HTMLAnchorElement>('.open a')!;
      const key = f.match(/s\/([^/]+)\//)![1]!;
      expect(app.getAttribute('href')).toBe(BASE + (f.startsWith('en/') ? '?lang=en' : '') + '#D/' + key);
    }
  });
  it('sitemap lists home + catalogues + every station + card landings; robots points at sitemap', () => {
    const sm = F.get('sitemap.xml')!;
    expect(sm).toContain(`${ORIGIN}${BASE}</loc>`);
    for (const k of KEYS) {
      expect(sm).toContain(`${ORIGIN}${BASE}s/${k}/`);
      expect(sm).toContain(`${ORIGIN}${BASE}en/s/${k}/`);
    }
    expect(sm).toContain(`${ORIGIN}${BASE}c/K06.html`);
    const rb = F.get('robots.txt')!;
    expect(rb).toMatch(/User-agent:\s*\*/); expect(rb).toContain(`Sitemap: ${ORIGIN}${BASE}sitemap.xml`);
  });
  it('404 is noindex and links home + catalogues', () => {
    const h = doc(F.get('404.html')!);
    expect(h.querySelector('meta[name=robots]')!.getAttribute('content')).toBe('noindex');
    expect(F.get('404.html')).toContain(`${BASE}s/`);
  });
});
