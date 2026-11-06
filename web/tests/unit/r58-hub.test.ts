// P1/P2: easier certificate, reminders, unique pictures, sourced diary, news/tools, station OG paths.
import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { DV_KEY } from '../../src/dv/links';
import { DIARY } from '../../src/dv/diary';
import { life } from '../../src/dv/ill';
import { CERT_N, certOf } from '../../src/px/mem';
import { bellGet, bellSet, dueN } from '../../src/px/remind';
import { rvAns } from '../../src/px/rv';
import { masteredSt } from '../../src/dv/prog';
import news from '../../src/hub/news.json';
import tools from '../../src/hub/tools.json';
import { buildSeo } from '../../scripts/seo.mjs';
import { demoOut, DEMO0 } from '../../src/vf/ui';
import zh from '../../src/dv/zh-st.json';
import en from '../../src/dv/en-st.json';

const web = resolve(import.meta.dirname, '../..');

describe('voice', () => {
  it('station chrome does not tell the learner the teaching procedure', () => {
    const src = readFileSync(resolve(web, 'src/dv/ml.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(src).not.toMatch(/先猜|你会怎么做|先别看|先预测|死路/);
  });
  it('published ml bundles do not contain the old procedure labels', () => {
    const dir = resolve(web, '../assets');
    const banned = ['每个小目标走一遍', '先别看答案', '调查 · 研究者', '进入 💡 推理', '推理完了', '"先猜"', '你会怎么做'];
    let files: string[] = [];
    try { files = readdirSync(dir).filter((f) => f.startsWith('ml-') && f.endsWith('.js')); } catch { return; }
    for (const f of files) {
      const t = readFileSync(resolve(dir, f), 'utf8');
      for (const s of banned) expect(t.includes(s), `${f} ${s}`).toBe(false);
    }
  });
});

describe('certificate', () => {
  beforeEach(() => localStorage.clear());
  it('unlocks at any 5 mastered stations and stays nameless in the data', () => {
    expect(CERT_N).toBe(5);
    expect(certOf('zh')).toBeNull();
    const five = DV_KEY.slice(0, 5);
    localStorage.setItem('si.ml', JSON.stringify(Object.fromEntries(five.map((k) => [k, { m: [1, 1, 1], k: [2, 2, 2], v: [0, 0, 0], g: 0, s: 'v', p: [0, 0, 0] }]))));
    expect(masteredSt().size).toBeGreaterThanOrEqual(5);
    const c = certOf('zh');
    expect(c).not.toBeNull();
    expect(c!.n).toBeGreaterThanOrEqual(5);
    expect(c!.what).not.toMatch(/你好|欢迎/);
  });
});

describe('reminder', () => {
  beforeEach(() => localStorage.clear());
  it('stores the schedule locally and counts due reviews', () => {
    expect(dueN()).toBe(0);
    rvAns('s1a', false, 10);
    expect(dueN()).toBeGreaterThan(0);
    bellSet({ on: 1, last: 3, hideAsk: 4 });
    expect(bellGet()).toEqual({ on: 1, last: 3, hideAsk: 4 });
  });
});

describe('pictures and diary', () => {
  it('every station has its own picture, and no shared flow art', () => {
    const pics = (zh as { st: { ly: { pic: string } }[] }).st.map((s) => s.ly.pic);
    expect(new Set(pics).size).toBe(pics.length);
    expect(pics).not.toContain('flow');
    expect((en as { st: { ly: { pic: string } }[] }).st.map((s) => s.ly.pic)).toEqual(pics);
    for (const k of DV_KEY) {
      const svg = life(k, 'en');
      expect(svg, k).toContain('<svg');
      expect(svg).not.toMatch(/[\u3400-\u9fff]/);
    }
  });
  it('every station has a year, a person and an https source', () => {
    expect(Object.keys(DIARY).sort()).toEqual([...DV_KEY].sort());
    for (const k of DV_KEY) {
      const d = DIARY[k]!;
      expect(d.year).toMatch(/^\d{4}$/);
      expect(d.url).toMatch(/^https:\/\//);
      expect(d.why[1]).not.toMatch(/[\u3400-\u9fff]/);
    }
  });
});

describe('portal', () => {
  it('news items have a real url, a date, and stations that exist', () => {
    expect(news.items.length).toBeGreaterThanOrEqual(5);
    expect(news.items.length).toBeLessThanOrEqual(10);
    for (const it of news.items) {
      expect(it.url).toMatch(/^https:\/\//);
      expect(it.date).toMatch(/^2026-11-0[2-6]$/);
      expect(it.st.length).toBeGreaterThan(0);
      for (const k of it.st) expect(DV_KEY).toContain(k);
      expect(it.zh + it.en).not.toMatch(/排行|第 ?1 ?名|ranking/i);
    }
  });
  it('tools are real links with a checked date and a safety station', () => {
    expect(tools.checked).toMatch(/^2026-11-06$/);
    for (const t of tools.items) {
      expect(t.url).toMatch(/^https:\/\//);
      expect(t.safe).toBe('S');
      expect(t.free[1]).not.toMatch(/[\u3400-\u9fff]/);
      expect(t.cn[1]).not.toMatch(/[\u3400-\u9fff]/);
      for (const k of t.st) expect(DV_KEY).toContain(k);
    }
  });
});

describe('share image path', () => {
  it('each static station page points at its own og image', () => {
    const F = buildSeo({ web: web + '/', base: '/SI/', lastmod: '2026-11-06' });
    for (const k of DV_KEY) {
      const h = F.get(`s/${k}/index.html`)!;
      expect(h).toContain(`https://superjackman.github.io/SI/og-st/${k}.png`);
    }
  });
});

describe('extra demos', () => {
  it('the new drags render in English without Chinese', () => {
    for (const k of ['mse', 'xor', 'bp', 'emb', 'lora', 'kv', 'rag'] as const) {
      const h = demoOut(k, DEMO0, 'en');
      expect(h).toContain('<svg');
      expect(h).not.toMatch(/[\u3400-\u9fff]/);
    }
  });
});
