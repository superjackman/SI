import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { ASK0, askStep, fare, fareTests, kbAnswer } from '../../src/work/run';
import { buildSearch } from '../../scripts/search-index.mjs';
import { search } from '../../src/search/query';
import { buildSeo } from '../../scripts/seo.mjs';

const web = resolve(import.meta.dirname, '../..');

describe('starter projects', () => {
  it('cites a note when the question is in the sample, and refuses when it is not', () => {
    const bus = kbAnswer('bus');
    expect(bus.note?.id).toBe('A');
    expect(bus.q?.zhA).toContain('7:40');
    const room = kbAnswer('room');
    expect(room.note?.zh).toContain('3 楼');
    const food = kbAnswer('food');
    expect(food.note).toBeNull();
    expect(food.q?.zhA).toContain('没有');
  });
  it('asks before sending, and the skip path is the failure', () => {
    const asked = askStep(ASK0, 'ask');
    expect(asked).toEqual({ asked: true, sent: false, failed: false });
    expect(askStep(asked, 'yes').sent).toBe(true);
    expect(askStep(ASK0, 'yes').sent).toBe(false);
    const skipped = askStep(ASK0, 'skip');
    expect(skipped.failed).toBe(true);
    expect(skipped.asked).toBe(false);
  });
  it('the fare tests fail, pass, and fail again on the wrong change', () => {
    expect(fare(1, 'bug')).toBe(2);
    expect(fare(3, 'bug')).toBe(6);
    expect(fareTests('bug').every((r) => !r.ok)).toBe(true);
    expect(fareTests('ok').map((r) => r.got)).toEqual([3, 7]);
    expect(fareTests('ok').every((r) => r.ok)).toBe(true);
    const wrong = fareTests('wrong');
    expect(wrong[0]!.ok).toBe(true);
    expect(wrong[1]!.got).toBe(9);
    expect(wrong[1]!.ok).toBe(false);
  });
  it('static pages in both languages are searchable and in the sitemap', () => {
    const rows = buildSearch(web);
    expect(search(rows, '微型知识库').some((h) => h.hash === '#W/kb')).toBe(true);
    expect(search(rows, '先问再做').some((h) => h.id === 'ask' && h.kind === 'work')).toBe(true);
    expect(search(rows, '修错').some((h) => h.hash === '#W/fix')).toBe(true);
    const F = buildSeo({ web: web + '/', base: '/SI/', lastmod: '2026-11-07' });
    const sm = F.get('sitemap.xml')!;
    for (const id of ['kb', 'ask', 'fix']) {
      expect(sm).toContain(`https://superjackman.github.io/SI/s/w/${id}/`);
      expect(sm).toContain(`https://superjackman.github.io/SI/en/s/w/${id}/`);
      const zh = F.get(`s/w/${id}/index.html`)!;
      const en = F.get(`en/s/w/${id}/index.html`)!;
      expect(zh).toContain('不是联网模型');
      expect(en).toContain('not a live model');
      expect(en).not.toContain('不是联网模型');
      expect(zh).toMatch(/样本|纸条|规则|任务/);
    }
  });
});
