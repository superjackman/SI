// Visible station questions must not repeat a prompt or a numeric setup.
import { describe, expect, it } from 'vitest';
import { ML } from '../../src/dv/mld';
import { DV_KEY } from '../../src/dv/links';
import { varQ } from '../../src/vf/var';
import { VF_Q } from '../../src/vf/ids';
import { QQ } from '../../src/vf/data';
import { fillDvText } from '../../src/dv/nums';
import { tx } from '../../src/l4/txt';

const nums = (s: string) => [...s.matchAll(/\d+(?:\.\d+)?/g)].map((m) => m[0]).join(',');
const bare = (s: string) => s.replace(/\d+(?:\.\d+)?/g, '#').replace(/\s+/g, '').replace(/[？?。，,：:（）()[\]]/g, '');

describe('station questions do not repeat', () => {
  it('no two visible questions share a prompt or the same numbers', () => {
    const bad: string[] = [];
    for (const k of DV_KEY) {
      const g = ML[k]!.goals[0]!;
      const id = VF_Q['D/' + k]![0]!;
      const qs = [
        ['num', fillDvText(tx(varQ(g.vk, 0).q, 'zh'), 'zh')],
        ['vf', fillDvText(tx(QQ[id]!.q, 'zh'), 'zh')],
        ['pred', fillDvText(tx(g.pr.q, 'zh'), 'zh')],
        ['choice', fillDvText(tx(g.q, 'zh'), 'zh')],
      ] as const;
      for (let i = 0; i < qs.length; i++) for (let j = i + 1; j < qs.length; j++) {
        const a = qs[i]!, b = qs[j]!;
        const na = nums(a[1]), nb = nums(b[1]);
        if ((na && na === nb) || bare(a[1]) === bare(b[1])) bad.push(`${k} ${a[0]}/${b[0]} nums=${na} :: ${a[1].slice(0, 42)} || ${b[1].slice(0, 42)}`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
