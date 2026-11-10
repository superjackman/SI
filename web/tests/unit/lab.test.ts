import { describe, expect, it } from 'vitest';
import { knobStep } from '../../src/dv/knob';
import { netInit, netStep } from '../../src/dv/net';
import { alphabet, makeNet, trainStep, windows, CORPUS } from '../../src/dv/tiny-gpt';

describe('knob lab', () => {
  it('auto-turn lowers the line loss', () => {
    let v = [0, 0], loss = 99;
    for (let i = 0; i < 80; i++) { const n = knobStep('line', v, 0.05); v = n.v; loss = n.loss; }
    expect(loss).toBeLessThan(0.2);
    expect(v[0]).toBeGreaterThan(1.4);
  });
  it('auto-turn brings the bend under the check line', () => {
    let v = [0, 0, 0], loss = 99;
    for (let i = 0; i < 80; i++) { const n = knobStep('bend', v, 0.08); v = n.v; loss = n.loss; }
    expect(loss).toBeLessThan(0.08);
  });
  it('auto-turn moves the product toward 3', () => {
    let v = [1, 1, 1];
    for (let i = 0; i < 40; i++) v = knobStep('chain', v, 0.05).v;
    expect(Math.abs((v[0] ?? 0) * (v[1] ?? 0) * (v[2] ?? 0) - 3)).toBeLessThan(0.3);
  });
});

describe('network knobs', () => {
  it('auto-turn fits the rise-and-fall curve', () => {
    const p = netInit('curve');
    let loss = 99;
    for (let i = 0; i < 160; i++) loss = netStep('curve', p, 0.2);
    expect(loss).toBeLessThan(0.02);
  });
  it('auto-turn separates the two colours', () => {
    const p = netInit('colors');
    for (let i = 0; i < 80; i++) netStep('colors', p, 0.3);
    const y = (x: number, b: number) => {
      let h = 0;
      for (let i = 0; i < 4; i++) {
        const z = p.W1[i]![0]! * x + p.W1[i]![1]! * b + p.b1[i]!;
        h += p.W2[i]! * Math.max(0, z);
      }
      return p.b2 + h;
    };
    expect(y(0, 0) < 0.5 && y(1, 1) < 0.5 && y(1, 0) >= 0.5 && y(0, 1) >= 0.5).toBe(true);
  });
});

describe('tiny transformer', () => {
  it('loss falls on the tiny corpus', () => {
    const { id } = alphabet();
    const net = makeNet(id.size, 16, 16);
    const rows = windows(CORPUS.repeat(4), id, 16);
    let first = 0, last = 0;
    for (const row of rows) first += trainStep(net, row, 0);
    first /= rows.length;
    for (let s = 0; s < 25; s++) for (const row of rows) last = trainStep(net, row, 0.15);
    expect(last).toBeLessThan(first * 0.85);
    expect(Number.isFinite(last)).toBe(true);
  });
});
