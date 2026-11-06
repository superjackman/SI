// Hotfix: every station share is a real question, the card shows that question once beside the
// progress line, station 6’s diagram matches “车离得远”, and the news page does not invent an archive.
import { describe, expect, it } from 'vitest';
import { DV_KEY } from '../../src/dv/links';
import { liveAsk } from '../../src/dv/ch';
import { morph, ST6_ANG } from '../../src/dv/morph';
import { life } from '../../src/dv/ill';
import { progressLine, sharePack } from '../../src/dv/share';
import { newsHtml, weekLead } from '../../src/hub/view';

const ang = (x0: number, y0: number, x1: number, y1: number) => Math.atan2(-(y1 - y0), x1 - x0) * 180 / Math.PI;
function shaft(svg: string, name: string): [number, number, number, number] {
  const m = new RegExp(`data-v="${name}" d="M([\\d.]+) ([\\d.]+) L([\\d.]+) ([\\d.]+)"`).exec(svg);
  expect(m, name).toBeTruthy();
  return m!.slice(1).map(Number) as [number, number, number, number];
}

describe('share challenge', () => {
  it('every station has a question a friend can answer', async () => {
    for (const k of DV_KEY) {
      const a = await liveAsk(k);
      expect(a, k).toBeTruthy();
      expect(a!.q[0].length, k).toBeGreaterThan(4);
      expect(a!.q[1], k).not.toMatch(/[\u3400-\u9fff]/);
      if (a!.o) expect(a!.a).toBeGreaterThanOrEqual(0);
      if (a!.o) expect(a!.a).toBeLessThan(a!.o.length);
    }
    expect(await liveAsk('nope')).toBeNull();
    expect((await liveAsk('0'))!.q[0]).toMatch(/样本|斜率/);
    expect((await liveAsk('6'))!.o).toHaveLength(3);
    expect((await liveAsk('6'))!.q[0]).toContain('猫');
    expect((await liveAsk('12'))!.o).toHaveLength(3);
    expect((await liveAsk('5'))!.id).toBe('s5c');
    expect((await liveAsk('2'))!.id).toBe('s2a');
    expect((await liveAsk('8a'))!.id).toBe('s8a');
  });
  it('the card shows the progress line once and the real question, not the placeholders', async () => {
    localStorage.clear();
    const d = await sharePack('6', 'zh', '分享这一站', progressLine('6', 'zh'));
    expect(d.head).toBe('这一站还没算对一组数');
    expect(d.name).toBe('词向量');
    expect(d.idea).toContain('猫');
    expect(d.idea).not.toContain('分享这一站');
    expect(d.pts).toHaveLength(3);
    expect(d.pts.join('\n')).not.toMatch(/这一站还没算对一组数|答对才看讲解|分享这一站/);
    expect(d.scan).toBe('扫码做这道题');
    expect(d.url).toMatch(/#D\/ch\/6$/);
    const words = [d.head, d.idea, ...d.pts].join('\n');
    expect(words.split('这一站还没算对一组数').length - 1).toBe(1);
    const n = await sharePack('2', 'zh', '分享这一站', progressLine('2', 'zh'));
    expect(n.idea.length).toBeGreaterThan(4);
    expect(n.idea).not.toContain('分享这一站');
    expect(n.scan).toBe('扫码做这道题');
    const dead = await sharePack('nope', 'zh', '分享这一站', 'x');
    expect(dead.scan).toBe('');
    expect(dead.idea).toBe('');
  });
});

describe('station 6 diagram', () => {
  it('starts as the household register, and the car arrow sits far from cat and dog', () => {
    const zh = life('6', 'zh'), en = life('6', 'en');
    expect(zh).toContain('户口本');
    expect(zh).not.toContain('data-v');
    expect(zh).not.toContain('M40 96');
    expect(en).toContain('<rect');
    expect(en).not.toMatch(/[\u3400-\u9fff]/);
    const h = morph('6', 'zh');
    expect(h).toContain('value="0"');
    const lifeHalf = h.slice(0, h.indexOf('dv-mb'));
    expect(lifeHalf).toContain('户口本');
    expect(lifeHalf).not.toContain('data-v="car"');
    const [cx0, cy0, cx1, cy1] = shaft(h, 'cat');
    const [dx0, dy0, dx1, dy1] = shaft(h, 'dog');
    const [rx0, ry0, rx1, ry1] = shaft(h, 'car');
    const cat = ang(cx0!, cy0!, cx1!, cy1!), dog = ang(dx0!, dy0!, dx1!, dy1!), car = ang(rx0!, ry0!, rx1!, ry1!);
    expect(cat).toBeCloseTo(ST6_ANG.cat, 0);
    expect(dog).toBeCloseTo(ST6_ANG.dog, 0);
    expect(car).toBeCloseTo(ST6_ANG.car, 0);
    expect(Math.abs(cat - dog)).toBeLessThan(25);
    expect(Math.abs(car - cat)).toBeGreaterThan(60);
    expect(Math.abs(car - dog)).toBeGreaterThan(60);
    expect(h).toContain('车离得远');
  });
});

describe('news archive copy', () => {
  it('does not say older weeks are below when only one week is published', () => {
    expect(weekLead(0, '2026-11-02', 1, 'zh')).not.toContain('往期留在下面');
    expect(weekLead(0, '2026-11-02', 1, 'en')).not.toMatch(/Older weeks/i);
    expect(weekLead(0, '2026-11-02', 2, 'zh')).toContain('往期留在下面');
    expect(weekLead(1, '2026-10-26', 2, 'zh')).toBe('往期 · 2026-10-26');
    expect(newsHtml('zh')).toContain('2026-11-02');
    expect(newsHtml('zh')).not.toContain('往期留在下面');
    expect(newsHtml('en')).not.toMatch(/Older weeks/i);
  });
});
