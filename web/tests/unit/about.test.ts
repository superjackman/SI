/* The trust page names the real maintainer and the real checked date. No invented audience. */
import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { CODES } from '../../src/i18n/codes';
import { aboutPage, checkedOn } from '../../src/l4/home';
import { buildSeo } from '../../scripts/seo.mjs';
import tools from '../../src/hub/tools.json';
import news from '../../src/hub/news.json';

describe('who maintains this', () => {
  it('says the repository owner, the shared number table, and the checked date', () => {
    expect(checkedOn()).toBe(tools.checked);
    expect(news.checked).toBe(tools.checked);
    const host = document.createElement('div');
    aboutPage(host, 'zh');
    const text = host.textContent || '';
    expect(text).toContain(CODES['about.who'].zh);
    expect(text).toContain(CODES['about.check'].zh);
    expect(text).toContain(tools.checked);
    expect(text).toContain('superjackman/SI');
    expect(host.querySelector('a[href="https://github.com/superjackman/SI/issues"]')).toBeTruthy();
    expect(text).not.toMatch(/用户数|全球第一|好评|学员|背书/);
    aboutPage(host, 'en');
    expect(host.textContent || '').toContain(CODES['about.who'].en);
    expect(host.textContent || '').not.toMatch(/[\u3400-\u9fff]/);
  });
  it('the static page uses the same sentences and is in the sitemap', () => {
    const F = buildSeo({ web: resolve(import.meta.dirname, '../..') + '/', base: '/SI/', lastmod: '2026-11-06' });
    const zh = F.get('about/index.html')!;
    const en = F.get('en/about/index.html')!;
    expect(zh).toContain(CODES['about.who'].zh);
    expect(zh).toContain(CODES['about.check'].zh);
    expect(zh).toContain(tools.checked);
    expect(zh).toContain('https://github.com/superjackman/SI/issues');
    expect(zh).not.toMatch(/用户数|全球第一|好评/);
    expect(en).toContain(CODES['about.who'].en);
    const main = new DOMParser().parseFromString(en, 'text/html').querySelector('main')!.textContent || '';
    expect(main).not.toMatch(/[\u3400-\u9fff]/);
    expect(F.get('sitemap.xml')).toContain('https://superjackman.github.io/SI/about/');
    expect(F.get('s/9/index.html')).toContain('/about/');
    expect(F.get('s/tools/dify/index.html')).toContain('/about/');
  });
});
