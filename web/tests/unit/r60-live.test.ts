// The check after a demo uses the numbers on screen, and a wrong tap explains only that tap.
import { describe, expect, it } from 'vitest';
import { DEMO0 } from '../../src/vf/ui';
import { CAP } from '../../src/dv/morph';
import { liveQ, shownWhys, takePick, type DemoSnap } from '../../src/dv/liveq';

const CJK = /[\u3400-\u9fff]/;
const snap = (p: Partial<DemoSnap> = {}): DemoSnap => ({ ...DEMO0, ...p });

describe('live demo check', () => {
  it('a wrong tap keeps its own line, and only the right tap opens the rest', () => {
    let s = takePick(1, [], false, 0);
    expect(s).toEqual({ wrongs: [0], solved: false });
    expect(shownWhys(3, s.wrongs, s.solved)).toEqual([0]);
    s = takePick(1, s.wrongs, s.solved, 0);
    expect(s.wrongs).toEqual([0]);
    s = takePick(1, s.wrongs, s.solved, 2);
    expect(shownWhys(3, s.wrongs, s.solved)).toEqual([0, 2]);
    expect(shownWhys(3, s.wrongs, s.solved)).not.toContain(1);
    s = takePick(1, s.wrongs, s.solved, 1);
    expect(s.solved).toBe(true);
    expect(shownWhys(3, s.wrongs, s.solved)).toEqual([0, 1, 2]);
  });

  it('station 6 angle and station 2 rate change the expected answer', () => {
    const a = liveQ('6', 0, { k: 'emb', s: snap({ ang: 40 }) })!;
    const b = liveQ('6', 0, { k: 'emb', s: snap({ ang: 90 }) })!;
    expect(a.q[0]).toContain('40');
    expect(b.q[0]).toContain('90');
    expect(a.o[a.a]![0]).not.toBe(b.o[b.a]![0]);
    expect(b.o[b.a]![0]).toBe('0');
    expect(new Set(a.why.map((w) => w[0])).size).toBe(3);
    expect(a.why[a.a]![0]).not.toBe(a.why[(a.a + 1) % 3]![0]);
    const slow = liveQ('2', null, { k: 'gd', s: snap({ eta: 0.3, n: 4 }) })!;
    const run = liveQ('2', null, { k: 'gd', s: snap({ eta: 1.1, n: 4 }) })!;
    expect(slow.a).toBe(0);
    expect(slow.o[0]![0]).toContain('平稳靠近');
    expect(slow.q[0]).toContain('0.30');
    expect(run.o[run.a]![0]).toContain('发散');
    expect(run.sig).not.toBe(slow.sig);
  });

  it('morph stations 7 and 10 follow the slider side', () => {
    for (const key of ['7', '10', '8b', 'E', '16'] as const) {
      const life = liveQ(key, 0, null)!;
      const math = liveQ(key, 1, null)!;
      expect(life.a).toBe(0);
      expect(math.a).toBe(1);
      expect(life.o[0]![0]).toBe(CAP[key]![0]);
      expect(math.o[1]![0]).toBe(CAP[key]![2]);
      expect(life.q[0]).toContain('0%');
      expect(math.q[0]).toContain('100%');
      expect(life.sig).not.toBe(math.sig);
      expect(life.why[1]![0]).not.toBe(math.why[0]![0]);
      for (const q of [life, math]) {
        expect(q.o[1]![1]).not.toMatch(CJK);
        expect(q.why.map((w) => w[1]).join(' ')).not.toMatch(CJK);
      }
    }
    expect(liveQ('0', null, null)).toBeNull();
  });
});
