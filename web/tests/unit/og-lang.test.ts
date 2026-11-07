/* English static pages get their own 1200×630 pictures. Chinese pages keep a different file. */
import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSeo } from '../../scripts/seo.mjs';

const web = resolve(process.cwd());
const pub = resolve(web, 'public');
let F: Map<string, string>;

function pngSize(buf: Buffer): [number, number] {
  expect(buf.subarray(1, 4).toString()).toBe('PNG');
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}
function ogOf(html: string): string {
  const m = html.match(/property="og:image" content="([^"]+)"/);
  if (!m) throw new Error('missing og:image');
  return m[1]!;
}
function fileOf(url: string): string {
  const rel = url.replace('https://superjackman.github.io/SI/', '');
  return resolve(pub, rel);
}

beforeAll(() => { F = buildSeo({ web: web + '/', base: '/SI/', lastmod: '2026-11-06' }); }, 30_000);

describe('share pictures explain, and English is a separate file', () => {
  it('every English /s/ page points at its own 1200×630 picture, not the Chinese one', () => {
    const en = [...F.keys()].filter((k) => k.startsWith('en/s/') && k.endsWith('/index.html'));
    expect(en.length).toBeGreaterThanOrEqual(74);
    for (const f of en) {
      const url = ogOf(F.get(f)!);
      expect(url, f).toMatch(/\/en\//);
      expect(url, f).not.toMatch(/[\u3400-\u9fff]/);
      const buf = readFileSync(fileOf(url));
      expect(pngSize(buf), f).toEqual([1200, 630]);
      expect(buf.length, f).toBeGreaterThan(2000);
      expect(buf.length, f).toBeLessThan(300_000);
      const zhKey = f.replace(/^en\//, '');
      if (F.has(zhKey)) expect(ogOf(F.get(zhKey)!), f).not.toBe(url);
    }
  });
  it('stations 6/9/12, Dify, RAGFlow and a news card exist in both languages', () => {
    for (const [zh, en] of [
      ['s/6/index.html', 'en/s/6/index.html'],
      ['s/9/index.html', 'en/s/9/index.html'],
      ['s/12/index.html', 'en/s/12/index.html'],
      ['s/tools/dify/index.html', 'en/s/tools/dify/index.html'],
      ['s/tools/ragflow/index.html', 'en/s/tools/ragflow/index.html'],
      ['s/news/ling-32/index.html', 'en/s/news/ling-32/index.html'],
    ] as const) {
      const a = readFileSync(fileOf(ogOf(F.get(zh)!)));
      const b = readFileSync(fileOf(ogOf(F.get(en)!)));
      expect(pngSize(a)).toEqual([1200, 630]);
      expect(Buffer.compare(a, b)).not.toBe(0);
    }
    expect(existsSync(resolve(pub, 'og-st/en/catalog.png'))).toBe(true);
    expect(existsSync(resolve(pub, 'og-hub/en/news-index.png'))).toBe(true);
    expect(existsSync(resolve(pub, 'og-hub/en/tools-index.png'))).toBe(true);
  });
});
