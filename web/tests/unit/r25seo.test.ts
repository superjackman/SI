/* R25 SEO: the static per-stop pages, catalogues, sitemap, robots.txt and 404 page that every build emits
   (scripts/seo.mjs). Checked on the generator output directly: unique titles / descriptions, self-canonical,
   reciprocal hreflang, parseable JSON-LD with the promised types, a visible link into the app, every internal link
   resolves, the sitemap lists exactly the indexable pages, robots.txt is well-formed. */
import { describe, it, expect, beforeAll } from 'vitest';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { buildSeo, ORIGIN } from '../../scripts/seo.mjs';

const web = resolve(process.cwd()) + '/'; // vitest runs from web/
const BASE = '/SI/';
const KB = JSON.parse(readFileSync(resolve(web, 'src/legacy/gen/kb.json'), 'utf8')) as { TABORDER: string[]; TABN: Record<string, { zh: string; en: string }> };
let F: Map<string, string>;
const doc = (html: string) => new DOMParser().parseFromString(html, 'text/html');
const pages = () => [...F.keys()].filter((k) => /^(en\/)?s\/[^/]+\/index\.html$/.test(k));
const urlOf = (file: string) => ORIGIN + BASE + file.replace(/index\.html$/, '');

beforeAll(() => { F = buildSeo({ web, base: BASE, lastmod: () => '2026-10-25' }); }, 60_000);

describe('static stop pages', () => {
  it('one page per stop per language, plus two catalogues, sitemap, robots, 404', () => {
    expect(pages().length).toBe(KB.TABORDER.length * 2);
    for (const S of KB.TABORDER) for (const p of [`s/${S}/index.html`, `en/s/${S}/index.html`]) expect(F.has(p), p).toBe(true);
    for (const f of ['s/index.html', 'en/s/index.html', 'sitemap.xml', 'robots.txt', '404.html']) expect(F.has(f), f).toBe(true);
  });
  it('titles and descriptions are unique, non-empty and a sensible length; en pages carry no Chinese in them', () => {
    const t = new Set<string>(), d = new Set<string>();
    for (const f of [...pages(), 's/index.html', 'en/s/index.html']) {
      const h = doc(F.get(f)!), title = h.title, desc = h.querySelector('meta[name=description]')!.getAttribute('content')!;
      expect(t.has(title), `title ${f}`).toBe(false); expect(d.has(desc), `desc ${f}`).toBe(false); t.add(title); d.add(desc);
      expect(Array.from(title).length, f).toBeLessThanOrEqual(70);
      expect(Array.from(desc).length, f).toBeGreaterThan(20); expect(Array.from(desc).length, f).toBeLessThanOrEqual(160);
      if (f.startsWith('en/')) expect(/[\u3400-\u9fff]/.test(title + desc), f).toBe(false);
    }
  });
  it('canonical is the page itself; hreflang zh-CN / en / x-default point at the pair, both ways; OG + Twitter tags', () => {
    for (const f of [...pages(), 's/index.html', 'en/s/index.html']) {
      const h = doc(F.get(f)!), u = urlOf(f);
      expect(h.querySelector('link[rel=canonical]')!.getAttribute('href'), f).toBe(u);
      const alt = Object.fromEntries([...h.querySelectorAll('link[rel=alternate][hreflang]')].map((l) => [l.getAttribute('hreflang')!, l.getAttribute('href')!]));
      expect(Object.keys(alt).sort()).toEqual(['en', 'x-default', 'zh-CN']);
      expect(alt[f.startsWith('en/') ? 'en' : 'zh-CN']).toBe(u);
      const other = (f.startsWith('en/') ? alt['zh-CN'] : alt.en)!.slice((ORIGIN + BASE).length) + 'index.html';
      const back = doc(F.get(other)!).querySelector(`link[rel=alternate][hreflang="${f.startsWith('en/') ? 'en' : 'zh-CN'}"]`)!.getAttribute('href');
      expect(back, `${f} ↔ ${other}`).toBe(u);
      expect(h.documentElement.lang).toBe(f.startsWith('en/') ? 'en' : 'zh-CN');
      const m = (p: string) => h.querySelector(`meta[property="${p}"],meta[name="${p}"]`)?.getAttribute('content');
      expect(m('og:title')).toBe(h.title); expect(m('og:url')).toBe(u); expect(m('og:image')).toBe(ORIGIN + BASE + 'og.png');
      expect(m('og:image:width')).toBe('1200'); expect(m('og:image:height')).toBe('630');
      expect(m('twitter:card')).toBe('summary_large_image'); expect(m('twitter:image')).toBe(ORIGIN + BASE + 'og.png');
    }
  });
  it('JSON-LD parses: WebSite + LearningResource (part of a Course) + BreadcrumbList ending at the page', () => {
    for (const f of pages()) {
      const s = doc(F.get(f)!).querySelectorAll('script[type="application/ld+json"]'); expect(s.length).toBe(1);
      const g = (JSON.parse(s[0]!.textContent!) as { '@graph': Array<Record<string, unknown>> })['@graph'];
      expect(g.map((x) => x['@type'])).toEqual(['WebSite', 'LearningResource', 'BreadcrumbList']);
      const lr = g[1]!; expect(lr.url).toBe(urlOf(f)); expect((lr.isPartOf as Record<string, unknown>)['@type']).toBe('Course');
      const items = (g[2]!.itemListElement as Array<{ position: number; item: string }>);
      expect(items.map((i) => i.position)).toEqual(items.map((_, k) => k + 1)); expect(items.at(-1)!.item).toBe(urlOf(f));
    }
  });
  it('a real readable body: the stop name as h1, its plain-words text, card headings, and a visible link into the app at #<stop>', () => {
    for (const L of ['zh', 'en'] as const) for (const S of KB.TABORDER) {
      const f = (L === 'en' ? 'en/' : '') + `s/${S}/index.html`, h = doc(F.get(f)!);
      expect(h.querySelector('h1')!.textContent).toBe(KB.TABN[S]![L]);
      expect((h.querySelector('main')!.textContent ?? '').replace(/\s+/g, '').length, f).toBeGreaterThan(L === 'zh' ? 250 : 500);
      const app = h.querySelector<HTMLAnchorElement>('.open a')!;
      expect(app.getAttribute('href')).toBe(BASE + (L === 'en' ? '?lang=en' : '') + '#' + S);
      expect(h.querySelectorAll('[hidden],[style*="display:none"],[style*="display: none"]').length, f).toBe(0);
    }
  });
  it('every internal link goes to a generated page or into the app; no external links in the body', () => {
    const ok = (p: string) => { const r = p.slice(BASE.length).split(/[?#]/)[0]!; return r === '' || F.has(r + (r === '' || r.endsWith('/') ? 'index.html' : '')); };
    for (const f of [...pages(), 's/index.html', 'en/s/index.html', '404.html'])
      for (const a of doc(F.get(f)!).querySelectorAll('body a[href]')) { const href = a.getAttribute('href')!; expect(href.startsWith(BASE), `${f}: ${href}`).toBe(true); expect(ok(href), `${f}: ${href}`).toBe(true); }
  });
  it('the boundary stays: Api / Loc pages say what is not covered, and nothing about getting round the firewall or foreign accounts', () => {
    expect(F.get('s/Api/index.html')).toContain('这里不讲'); expect(F.get('en/s/Loc/index.html')).toContain('Not covered');
    for (const f of pages()) expect(F.get(f)!, f).not.toMatch(/科学上网|翻墙|梯子|代理服务器|海外信用卡|虚拟卡|circumvent/);
  });
});

describe('sitemap, robots.txt, 404', () => {
  it('sitemap.xml: well-formed, the home page + catalogues + every stop page once, each with a lastmod date and its alternates', () => {
    const x = new DOMParser().parseFromString(F.get('sitemap.xml')!, 'application/xml');
    expect(x.getElementsByTagName('parsererror').length).toBe(0);
    const locs = [...x.getElementsByTagName('loc')].map((l) => l.textContent!);
    const want = [ORIGIN + BASE, ...[...pages(), 's/index.html', 'en/s/index.html'].map(urlOf)];
    expect([...locs].sort()).toEqual([...want].sort()); expect(new Set(locs).size).toBe(locs.length);
    for (const u of x.getElementsByTagName('url')) expect(u.getElementsByTagName('lastmod')[0]!.textContent).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(x.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'link').length).toBe((pages().length + 2) * 3);
  });
  it('robots.txt: only known directives, allows everything, names the sitemap by absolute URL', () => {
    const lines = F.get('robots.txt')!.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
    for (const l of lines) expect(l).toMatch(/^(User-agent|Allow|Disallow|Sitemap): \S/);
    expect(lines).toContain('User-agent: *'); expect(lines).toContain('Allow: /'); expect(lines).not.toContain('Disallow: /');
    expect(lines).toContain(`Sitemap: ${ORIGIN}${BASE}sitemap.xml`);
  });
  it('404.html is noindex, has no canonical, and links home and to both catalogues', () => {
    const h = doc(F.get('404.html')!);
    expect(h.querySelector('meta[name=robots]')!.getAttribute('content')).toBe('noindex');
    expect(h.querySelector('link[rel=canonical]')).toBeNull();
    expect([...h.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(expect.arrayContaining([BASE, BASE + 's/', BASE + 'en/s/']));
  });
});

describe('home page head', () => {
  it('index.html: canonical, parseable WebSite JSON-LD, and a no-JS link to the static catalogues', () => {
    const h = doc(readFileSync(resolve(web, 'index.html'), 'utf8'));
    expect(h.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe(ORIGIN + BASE);
    const j = JSON.parse(h.querySelector('script[type="application/ld+json"]')!.textContent!) as Record<string, unknown>;
    expect(j['@type']).toBe('WebSite'); expect(j.url).toBe(ORIGIN + BASE);
    expect(h.querySelector('meta[property="og:image"]')!.getAttribute('content')).toBe(ORIGIN + BASE + 'og.png');
  });
});
