import { beforeEach, describe, expect, it } from 'vitest';
import { apply, capture, decode, encode, encodeVersion, learnedStops, mergeMaps, preview, reviewIds, saveUndo, undo } from '../../src/px/code';
import { weekBlock } from '../../src/l4/home';
import { stationEnd } from '../../src/dv/view';
import { weekSpan } from '../../src/px/week';

const rv = (id: string, t: number) => JSON.stringify({ [id]: { b: 0, due: t + 1, t, w: 0, f: 1 } });

describe('mergeable progress', () => {
  beforeEach(() => localStorage.clear());

  it('rejects a bad code and leaves storage alone', () => {
    localStorage.setItem('si.dv.seen', '["6"]');
    expect(decode('nope').ok).toBe(false);
    expect(decode('SI2.@@@@').ok).toBe(false);
    expect(decode('SI1.').ok).toBe(false);
    expect(localStorage.getItem('si.dv.seen')).toBe('["6"]');
  });

  it('previews an older code, merges by default, and does not duplicate a second import', () => {
    const here = { 'si.dv.seen': '["6"]', 'si.rv': rv('q1', 3) };
    const older = encodeVersion(1, { 'si.dv.seen': '["6"]', 'si.mst': '{"9":"2026-11-03"}', 'si.rv': rv('q1', 3) });
    const got = decode(older);
    expect(got.ok).toBe(true);
    if (!got.ok) return;
    expect(got.ver).toBe(1);
    const view = preview(here, got.data, got.ver);
    expect(view.older).toBe(true);
    expect(view.addStops).toEqual(['9']);
    expect(view.keepStops).toEqual(['6']);
    expect(view.addRv).toEqual([]);
    expect(view.keepRv).toEqual(['q1']);
    const once = mergeMaps(here, got.data);
    const twice = mergeMaps(once, got.data);
    expect(learnedStops(twice)).toEqual(['6', '9']);
    expect(reviewIds(twice)).toEqual(['q1']);
    expect(encode().startsWith('SI2.')).toBe(true);
  });

  it('keeps what each device learned, and an overwrite drops the other device until undo', () => {
    const phone = { 'si.dv.seen': '["6"]', 'si.mst': '{"6":"2026-11-02"}', 'si.rv': rv('qa', 2) };
    const desk = { 'si.dv.seen': '["13"]', 'si.mst': '{"13":"2026-11-04"}', 'si.rv': rv('qb', 4) };
    const view = preview(phone, desk, 2);
    expect(view.addStops).toEqual(['13']);
    expect(view.keepStops).toEqual(['6']);
    expect(view.addRv).toEqual(['qb']);
    expect(view.keepRv).toEqual(['qa']);
    expect(view.dropStops).toEqual(['6']);
    const merged = mergeMaps(phone, desk);
    expect(learnedStops(merged)).toEqual(['6', '13']);
    expect(reviewIds(merged)).toEqual(['qa', 'qb']);
    localStorage.setItem('si.dv.seen', phone['si.dv.seen']!);
    localStorage.setItem('si.rv', phone['si.rv']!);
    saveUndo();
    expect(apply(desk)).toBe(true);
    expect(learnedStops(capture())).toEqual(['13']);
    expect(undo()).toBe(true);
    expect(localStorage.getItem('si.dv.seen')).toBe('["6"]');
    expect(undo()).toBe(false);
  });
});

describe('week on the home page and the end of a station', () => {
  beforeEach(() => localStorage.clear());
  it('uses one local Monday boundary, and an empty week stays empty', () => {
    const mon = new Date(2026, 10, 2, 0, 5).getTime();
    const sun = new Date(2026, 10, 8, 23, 30).getTime();
    const next = new Date(2026, 10, 9, 0, 5).getTime();
    expect(weekSpan(mon)).toEqual(weekSpan(sun));
    expect(weekSpan(next).from).toBe('2026-11-09');
    expect(weekSpan(mon).from).toBe('2026-11-02');
    localStorage.setItem('si.dv.seen', '["6"]');
    const html = weekBlock('zh');
    expect(html).toContain('data-week="empty"');
    expect(html).toContain('这一周');
    expect(html).toContain('这周还没有做题');
    expect(html).toContain('href="#R"');
    expect(html).not.toContain('data-go=');
    expect(html).not.toMatch(/先猜|调查|推理|验证|选图|选公式/);
  });
  it('puts the reason to continue before share and backup, and does not open a dialog', () => {
    const html = stationEnd('<p>下一步要解决留下的问题。</p>', '<a href="#D/7">下一站</a>');
    expect(html.indexOf('留下的问题')).toBeLessThan(html.indexOf('下一站'));
    expect(html).not.toContain('g-modal');
    expect(html).not.toMatch(/先猜|调查|推理|验证/);
  });
});
