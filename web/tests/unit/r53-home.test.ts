// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { goalNow, home, isBack, pickDay, skyP, SKY } from '../../src/l4/home';
import { DEPTH_MIN, depthGet, jvGet, layerMastery, masteredSt, pathMin, routeMin, seenSt, stationMin } from '../../src/dv/prog';
import { ROUTES, pathOf, routeNext } from '../../src/dv/routes';
import { DV_KEY, DV_N, DV_NM, dvI } from '../../src/dv/links';
import { VF_Q } from '../../src/vf/ids';
import { CH } from '../../src/dv/ch';
import { QQ } from '../../src/vf/data';

const api = (root: HTMLElement) => ({ l: 'zh' as const, root, go: () => {}, redraw: () => {} });
describe('R53 home', () => {
  beforeEach(() => localStorage.clear());
  it('defaults: no route picked, the walk starts at station 0, depth 5 分钟, programmer off, not returning', () => {
    expect(goalNow()).toBeNull(); expect(pathOf().chosen).toBe(false); expect(pathOf().st).toEqual(DV_KEY);
    const nx = routeNext(pathOf(), new Set(), new Set()); expect(nx).toBe('0'); expect(DV_NM[dvI(nx)]![0]).toBe('用样本找函数');
    expect(stationMin(3)).toBe(13); expect(pathMin(DV_KEY)).toBe(pathMin([...DV_KEY]));
    expect(depthGet()).toBe('m'); expect(jvGet()).toBe(false); expect(isBack()).toBe(false);
  });
  it('a chosen route alone is not returning; a read station or a right answer is', () => {
    localStorage.setItem('si.goal', 'agent'); expect(isBack()).toBe(false); expect(goalNow()!.id).toBe('agent');
    localStorage.setItem('si.dv.seen', JSON.stringify([8, '2'])); expect([...seenSt()].sort()).toEqual(['2', '8a', '8b']); expect(isBack()).toBe(true);
  });
  it('time = stops × depth; mastery = every question of a station right; layer bars cover the 22 layered stations', () => {
    expect(DEPTH_MIN).toEqual({ s: 0.5, m: 5, d: 12 });
    expect(ROUTES.map((r) => routeMin(r.st.length, 'm'))).toEqual([40, 50, 65, 40, 45]);
    expect(routeMin(8, 's')).toBe(4); expect(routeMin(1, 's')).toBe(1);
    const m = masteredSt(new Set([...VF_Q['D/6']!, ...VF_Q['D/2']!, VF_Q['D/7']![0]!])); expect([...m].sort()).toEqual(['2', '6']);
    const lm = layerMastery(m); expect(lm.reduce((a, [, t]) => a + t, 0)).toBe(DV_N - 1); expect(lm[4]![0]).toBe(1); expect(lm[3]![0]).toBe(1);
  });
  it('the demo is a real softmax; today’s challenge is stable for a day and always a choice question shared as itself', () => {
    for (const T of [0.2, 1, 3]) expect(skyP(T).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(skyP(1)[0]).toBeCloseTo(Math.exp(SKY[0]) / SKY.reduce((a, v) => a + Math.exp(v), 0), 12);
    expect(skyP(3)[0]).toBeLessThan(skyP(1)[0]!); expect(skyP(0.2)[0]).toBeGreaterThan(skyP(1)[0]!);
    const pool = DV_KEY.filter((k) => CH[k] && QQ[CH[k]!]?.o); expect(pool.length).toBeGreaterThanOrEqual(10);
    const t = new Date(2026, 10, 6, 9).getTime(); expect(pickDay(pool, t)).toBe(pickDay(pool, t + 10 * 3600e3)); expect(pickDay(pool, t)).not.toBe(pickDay(pool, t + 864e5));
    expect(CH['2']).toBe('s2a'); expect(CH['8a']).toBe('s8a');
    for (const [k, id] of Object.entries(CH)) expect(VF_Q['D/' + k], k).toContain(id);
  });
  it('renders both states with no name and no greeting, one gold button each', () => {
    for (const back of [false, true]) {
      localStorage.clear(); if (back) localStorage.setItem('si.vf', JSON.stringify(VF_Q['D/6']));
      const root = document.createElement('div'), host = document.createElement('div'); root.appendChild(host); document.body.appendChild(root);
      home(host, api(root));
      expect(host.querySelector('.hm')!.getAttribute('data-st')).toBe(back ? 'back' : 'first');
      expect(host.querySelectorAll('.hm-cta').length).toBe(1);
      if (!back) {
        expect(host.textContent).toContain('零基础');
        expect(host.textContent).toContain('从一个数学函数出发，搭到大模型、安全与应用');
        expect(host.querySelector('.hm-cta')!.textContent).toContain('用样本找函数');
        expect(host.textContent).toContain('现在做一道');
      }
      expect(host.textContent).not.toMatch(/欢迎|你好|晚上好|早上好|Welcome|Hello|连续 \d+ 天/);
      expect(host.querySelectorAll('.hm-rt').length).toBe(5); expect(host.querySelectorAll('.hm-v').length).toBe(2);
      root.remove();
    }
  });
});
