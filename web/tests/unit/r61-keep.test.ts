import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSearch } from '../../scripts/search-index.mjs';
import { search } from '../../src/search/query';
import news from '../../src/hub/news.json';
import tools from '../../src/hub/tools.json';
import { newsFrom, newsHtml } from '../../src/hub/view';
import { DV_KEY } from '../../src/dv/links';
import { ROUTES } from '../../src/dv/routes';
import { apply, decode, encode } from '../../src/px/code';
import { keepHtml } from '../../src/px/keep';
import { masteredSt } from '../../src/dv/prog';
import { mstGet, noteMastered, weekModel } from '../../src/px/week';
import { MOTION_AT, mount } from '../../src/dv/motion';
import { buildSeo } from '../../scripts/seo.mjs';

const web = resolve(import.meta.dirname, '../..');
const rows = buildSearch(web);

describe('site search', () => {
  it('indexes every station, card, news item and tool, and links with hashes', () => {
    expect(rows.filter((r) => r.kind === 'st').map((r) => r.id)).toEqual([...DV_KEY]);
    expect(rows.filter((r) => r.kind === 'news')).toHaveLength(news.weeks.flatMap((w) => w.items).length);
    expect(rows.filter((r) => r.kind === 'tool')).toHaveLength(tools.items.length);
    expect(rows.filter((r) => r.kind === 'card').length).toBeGreaterThanOrEqual(60);
    for (const r of rows) {
      expect(r.hash.startsWith('#')).toBe(true);
      expect(r.zh.length).toBeGreaterThan(0);
      expect(r.en.length).toBeGreaterThan(0);
    }
  });
  it('matches Chinese by substring and by bigram, and English titles', () => {
    const attn = search(rows, '注意力');
    expect(attn[0]?.hash).toBe('#D/8a');
    expect(attn.some((h) => h.kind === 'st')).toBe(true);
    const fuzzy = search(rows, '注意里');
    expect(fuzzy.some((h) => h.hash === '#D/8a' || h.zh.includes('注意'))).toBe(true);
    expect(search(rows, '预训练')[0]?.hash).toBe('#D/9');
    expect(search(rows, '分词').some((h) => h.kind === 'card' && h.id === 'K02')).toBe(true);
    expect(search(rows, '灵码').some((h) => h.hash === '#tools/lingma')).toBe(true);
    expect(search(rows, '蚂蚁').some((h) => h.hash === '#news/ling-32')).toBe(true);
    expect(search(rows, 'Word vectors').some((h) => h.hash === '#D/6')).toBe(true);
    expect(search(rows, '8a')[0]?.hash).toBe('#D/8a');
    expect(search(rows, '   ')).toEqual([]);
  });
});

const row = (id: string, zh: string) => ({
  id, date: '2026-10-26', zh, en: 'Older note.', url: 'https://example.com/a', source: 'Example',
  st: ['12'], goal: '12', gi: 0, more: { zh: ['它和第 12 站有关。'], en: ['It lines up with stop 12.'] },
});

describe('news archive', () => {
  it('does not claim an archive while only one week is in the file', () => {
    expect(news.weeks.length).toBe(1);
    expect(newsHtml('zh')).not.toMatch(/往期|存档/);
    expect(newsHtml('en')).not.toMatch(/Older weeks|archive/i);
    expect(newsHtml('zh', 'no-such')).toContain('没有这条资讯');
    expect(newsHtml('zh', 'no-such')).not.toMatch(/存档/);
    expect(newsHtml('zh', 'w/1999-01-01')).toContain('没有这一周');
    expect(newsHtml('zh', 'w/1999-01-01')).not.toMatch(/往期|存档/);
    const seo = buildSeo({ web: web + '/', base: '/SI/', lastmod: '2026-11-06' });
    expect(seo.get('s/news/index.html')).not.toContain('往期保留');
  });
  it('lists older weeks only when the data has more than one', () => {
    const src = { checked: '2026-11-06', weeks: [{ week: '2026-11-02', items: [row('new', '这一周的一条。')] }, { week: '2026-10-26', items: [row('old', '上一周的一条。')] }] };
    const html = newsFrom(src, 'zh');
    expect(html).toContain('往期留在下面');
    expect(html).toContain('href="#news/w/2026-10-26"');
    expect(html).toContain('上一周的一条。');
    expect(newsFrom(src, 'zh', 'w/2026-10-26')).toContain('往期 · 2026-10-26');
    expect(newsFrom(src, 'zh', 'w/2026-10-26')).toContain('上一周的一条。');
    expect(newsFrom(src, 'zh', 'w/2026-10-26')).not.toContain('这一周的一条。');
    const one = newsFrom({ checked: '2026-11-06', weeks: [src.weeks[0]!] }, 'zh');
    expect(one).not.toMatch(/往期|存档/);
  });
});

describe('weekly card and progress code', () => {
  beforeEach(() => localStorage.clear());
  it('shows an honest empty week when nothing was practiced or mastered', () => {
    expect(weekModel().empty).toBe(true);
    expect(weekModel().practice).toBe(0);
    expect(weekModel().mastered).toEqual([]);
    const html = keepHtml('zh');
    expect(html).toContain('data-week="empty"');
    expect(html.replace(/<[^>]+>/g, '')).toContain('这周还没有做题，也没有新掌握的站。');
    expect(html).toContain('data-wk="share"');
  });
  it('counts real practice and a mastery date written when the station flipped', () => {
    localStorage.setItem('si.px.log', JSON.stringify([{ k: 'ans', t: Date.now(), id: 'q1', ok: true }]));
    expect(weekModel().empty).toBe(false);
    expect(weekModel().practice).toBe(1);
    localStorage.setItem('si.ml', JSON.stringify({ '6': { m: [1, 1, 1], k: [2, 2, 2], v: [0, 0, 0], g: 0, s: 'v', p: [-1, -1, -1] } }));
    expect(masteredSt().has('6')).toBe(true);
    noteMastered(new Set());
    expect(weekModel().mastered).toContain('6');
    const kept = mstGet()['6'];
    noteMastered(new Set());
    expect(mstGet()['6']).toBe(kept);
    localStorage.setItem('si.mst', JSON.stringify({ '6': '2020-01-01' }));
    localStorage.setItem('si.px.log', '[]');
    expect(weekModel().mastered).not.toContain('6');
    expect(weekModel().empty).toBe(true);
  });
  it('round-trips a progress code and refuses a bad one without writing', () => {
    localStorage.setItem('si.vf', '["s0a"]');
    localStorage.setItem('si.ml', '{"6":{"m":[1]}}');
    localStorage.setItem('si.l4.my', 'MODEL');
    const code = encode();
    expect(code.startsWith('SI1.')).toBe(true);
    localStorage.setItem('si.vf', '["other"]');
    expect(decode('nope').ok).toBe(false);
    expect(decode('SI1.@@@@').ok).toBe(false);
    expect(decode('SI1.').ok).toBe(false);
    expect(localStorage.getItem('si.vf')).toBe('["other"]');
    expect(apply({ 'si.l4.my': 'WIPED' })).toBe(false);
    expect(localStorage.getItem('si.vf')).toBe('["other"]');
    expect(localStorage.getItem('si.l4.my')).toBe('MODEL');
    const got = decode(code);
    expect(got.ok).toBe(true);
    expect(localStorage.getItem('si.vf')).toBe('["other"]');
    if (!got.ok) return;
    expect(apply(got.data)).toBe(true);
    expect(localStorage.getItem('si.vf')).toBe('["s0a"]');
    expect(localStorage.getItem('si.ml')).toBe('{"6":{"m":[1]}}');
    expect(localStorage.getItem('si.l4.my')).toBe('MODEL');
    localStorage.setItem('si.goal', 'use');
    const again = encode();
    localStorage.clear();
    localStorage.setItem('si.l4.my', 'MODEL');
    const back = decode(again);
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    apply(back.data);
    expect(localStorage.getItem('si.goal')).toBe('use');
    expect(localStorage.getItem('si.l4.my')).toBe('MODEL');
  });
});

describe('teaching motion', () => {
  it('sits on the understand-LLM path, can be replayed, and respects reduced motion in CSS', () => {
    const model = ROUTES.find((r) => r.id === 'model')!;
    expect(MOTION_AT.length).toBeGreaterThanOrEqual(3);
    expect(MOTION_AT.length).toBeLessThanOrEqual(5);
    for (const k of MOTION_AT) expect(model.st.map(String)).toContain(k);
    const css = readFileSync(resolve(web, 'src/dv/ly.css'), 'utf8');
    expect(css).toMatch(/prefers-reduced-motion/);
    expect(css).toMatch(/data-anim="off"/);
    document.body.innerHTML = '<div id="m"></div>';
    const el = document.getElementById('m')!;
    mount(el, '9', 'zh');
    expect(el.querySelector('.mv-fig')).toBeTruthy();
    expect(el.querySelector('[data-mot-go="replay"]')).toBeTruthy();
    expect(el.textContent).not.toMatch(/先猜|调查|推理|验证|选图|选公式/);
    el.querySelector<HTMLButtonElement>('[data-mot-go="replay"]')!.click();
    const still = el.querySelector('[data-mot-note]')?.textContent ?? '';
    expect(el.classList.contains('play') || still.length > 0).toBe(true);
  });
});
