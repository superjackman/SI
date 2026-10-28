import { describe, it, expect } from 'vitest';
import { TEACH, QUIZ_N, MEDAL_N } from '../../src/w3/c/t';
import { STATIONS } from '../../src/w3/reg';
/* R36: every station has a "look here" line and three "you learned" lines, in both languages, short enough for a child */
describe('w3 teach lines', () => {
  it('covers all 27 stations, zh and en', () => {
    expect(STATIONS.length).toBe(27);
    for (const s of STATIONS) {
      const t = TEACH[s]; expect(t, s).toBeTruthy();
      for (const line of t!) {
        const [zh, en] = line.split('|');
        expect(zh && en, `${s}: ${line}`).toBeTruthy();
        expect(zh!.length, `${s} zh too long: ${zh}`).toBeLessThanOrEqual(48);
        expect(en!.length, `${s} en too long: ${en}`).toBeLessThanOrEqual(130);
      }
    }
  });
  it('quiz and medal callouts point at their marks', () => {
    expect(QUIZ_N.map((n) => n[0])).toEqual(['plate', 'a1']);
    const m = MEDAL_N('学到了|learned');
    expect(m.map((n) => n[0])).toEqual(['medal', 'now']);
    expect(m[0]![4]).toContain('learned');
  });
});
