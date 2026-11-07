// Life scenes on the ten 看懂大模型 stations: a person and objects, then the same colours in the diagram.
import { describe, expect, it } from 'vitest';
import { CAST_KEYS, ST6_ANG } from '../../src/dv/cast';
import { life } from '../../src/dv/ill';
import { morph } from '../../src/dv/morph';

const ang = (x0: number, y0: number, x1: number, y1: number) => Math.atan2(-(y1 - y0), x1 - x0) * 180 / Math.PI;
const objs = (svg: string) => {
  const pairs = [...svg.matchAll(/data-obj="([^"]+)" data-c="(var\(--[a-z0-9-]+\)|#[0-9a-fA-F]+)"/g)];
  return Object.fromEntries(pairs.map((m) => [m[1]!, m[2]!.toLowerCase()]));
};

describe('life-scene morph', () => {
  it('the ten stations start as a scene with a person and morph into the same coloured objects', () => {
    expect([...CAST_KEYS].sort()).toEqual(['10', '11', '12', '16', '6', '7', '8a', '8b', '9', 'E']);
    for (const k of CAST_KEYS) {
      const zh = morph(k, 'zh');
      const en = morph(k, 'en');
      const cut = zh.indexOf('class="dv-mb"');
      expect(cut, k).toBeGreaterThan(0);
      const lifeH = zh.slice(0, cut);
      const math = zh.slice(cut);
      expect(lifeH, k).toContain('var(--skin)');
      expect(lifeH, k).not.toMatch(/先猜|调查|推理|验证/);
      expect(math, k).not.toMatch(/先猜|你会怎么做/);
      const lo = objs(lifeH), mo = objs(math);
      expect(Object.keys(lo).length, k).toBeGreaterThanOrEqual(2);
      expect(new Set(Object.keys(lo)).size, k).toBe(Object.keys(lo).length);
      expect(lo, k).toEqual(mo);
      expect(en, k).not.toMatch(/[\u3400-\u9fff]/);
      expect(life(k, 'en'), k).not.toMatch(/[\u3400-\u9fff]/);
      expect(life(k, 'zh'), k).toContain('viewBox="0 0 300 176"');
      expect(zh, k).toContain('value="0"');
      expect(zh, k).toContain('data-at="life"');
    }
  });

  it('station 6 keeps the household register, and the car stays far from cat and dog', () => {
    const h = morph('6', 'zh');
    const lifeH = h.slice(0, h.indexOf('class="dv-mb"'));
    expect(lifeH).toContain('户口本');
    expect(lifeH).not.toContain('data-v="car"');
    expect(life('6', 'zh')).not.toContain('data-v');
    const shaft = (name: string) => {
      const m = new RegExp(`data-v="${name}" d="M([\\d.]+) ([\\d.]+) L([\\d.]+) ([\\d.]+)"`).exec(h);
      expect(m, name).toBeTruthy();
      return m!.slice(1).map(Number) as [number, number, number, number];
    };
    const [cx0, cy0, cx1, cy1] = shaft('cat');
    const [dx0, dy0, dx1, dy1] = shaft('dog');
    const [rx0, ry0, rx1, ry1] = shaft('car');
    const cat = ang(cx0, cy0, cx1, cy1), dog = ang(dx0, dy0, dx1, dy1), car = ang(rx0, ry0, rx1, ry1);
    expect(cat).toBeCloseTo(ST6_ANG.cat, 0);
    expect(dog).toBeCloseTo(ST6_ANG.dog, 0);
    expect(car).toBeCloseTo(ST6_ANG.car, 0);
    expect(Math.abs(cat - dog)).toBeLessThan(25);
    expect(Math.abs(car - cat)).toBeGreaterThan(60);
    expect(Math.abs(car - dog)).toBeGreaterThan(60);
    expect(ry1).toBeGreaterThan(cy1 + 40);
    expect(ry1).toBeGreaterThan(dy1 + 40);
    expect(rx1).toBeGreaterThan(dx1 + 40);
    expect(h).toContain('车离得远');
  });
});
