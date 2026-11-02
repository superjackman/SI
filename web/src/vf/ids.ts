/* R50 验证优化 · which self-check questions sit on which page (stage D/n or card), and the reader's progress.
   Tiny and text-free so the chain, the map and the card sheet can count ticks without loading the questions. */
export const VF_KEY = 'si.vf';
const S = (n: number, k: string) => k.split('').map((c) => `s${n}${c}`);
/** page → question ids (shared ids: a question solved on the card is solved on the stage too) */
export const VF_Q: Record<string, string[]> = {
  'D/0': S(0, 'ab'), 'D/1': S(1, 'abc'), 'D/2': S(2, 'abc'), 'D/3': S(3, 'abc'), 'D/4': S(4, 'abc'), 'D/5': S(5, 'abc'),
  'D/6': S(6, 'ab'), 'D/7': S(7, 'ab'), 'D/8': S(8, 'abc'), 'D/9': S(9, 'abc'), 'D/10': S(10, 'abc'), 'D/11': S(11, 'abc'),
  'D/12': S(12, 'abc'), 'D/13': S(13, 'ab'), 'D/14': S(14, 'ab'), 'D/15': S(15, 'abc'), 'D/16': S(16, 'ab'),
  KM01: ['m1a', 'm1b'], KM02: ['s6a', 'm2b', 'm2c'], KM03: ['m3a', 'm3b'], KM04: ['s7b', 'm4b'], KM05: ['m5a', 'm5b'], KM06: ['m6a', 'm6b'],
  KM07: ['m7a', 'm7b', 'm7c'], KM08: ['m8a', 'm8b'], KM09: ['s4a', 'm9b'], KM10: ['s2a', 'm10a', 's2c', 'm10b'], KM11: ['m11a', 'm11b'],
  KM12: ['s8a', 's7a', 'm12c'], KM13: ['s5b', 'm13b', 'm13c'],
  K07: ['s8a', 's8c'], K11: ['k11a'], K12: ['s12c'], K13: ['s1b', 's16b'], K14: ['k14a', 's4a'], K15: ['s12c'],
  KA07: ['s15a'], KC04: ['s9c'], KC07: ['s10a', 's10b', 's10c'], KC11: ['s12c'], KC13: ['s11a', 's11b', 's11c'], KC14: ['s12a', 's12b'],
};
export const vfDone = (): Set<string> => { try { const v = JSON.parse(localStorage.getItem(VF_KEY) || '[]') as unknown; return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []); } catch { return new Set(); } };
export const vfAdd = (id: string) => { const s = vfDone(); if (s.has(id)) return; s.add(id); try { localStorage.setItem(VF_KEY, JSON.stringify([...s].sort())); } catch { /* private mode */ } };
/** done / total on one page */
export const vfStat = (page: string, d = vfDone()) => { const q = VF_Q[page] ?? []; return { s: q.filter((k) => d.has(k)).length, t: q.length }; };
/** done / total over the 17 stage pages */
export const vfStages = (n: number, d = vfDone()) => { let s = 0, t = 0; for (let i = 0; i < n; i++) { const r = vfStat('D/' + i, d); s += r.s; t += r.t; } return { s, t }; };
/** card pages that only carry 常见误解 (no question); r50 checks this list against vf/data */
const VF_MO = ['K06', 'KC06', 'KC09', 'KC12'];
/** does this card / stage get a 验证 block at all? (so the sheet only loads it when there is something to show) */
export const hasVf = (page: string) => page in VF_Q || VF_MO.includes(page);
export const VF_MC_ONLY = VF_MO;
