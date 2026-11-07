/* Four progress ratios. Visible labels stay Chinese (or English). D/I/T/R is the rollup key, not a label on screen. */
import { tx, type L } from './txt';
import { DV_KEY, DV_N } from '../dv/links';
import { masteredSt, mlAll, seenSt } from '../dv/prog';
import { VF_Q, vfDone } from '../vf/ids';

export interface Cell { k: 'D' | 'I' | 'T' | 'R'; zh: string; en: string; n: number; d: number }

export function cells(): Cell[] {
  const seen = seenSt(), mastered = masteredSt(), done = vfDone(), ml = mlAll();
  const questions = DV_KEY.flatMap((k) => VF_Q['D/' + k] ?? []);
  const tried = new Set<string>();
  for (const k of DV_KEY) {
    const ids = VF_Q['D/' + k] ?? [];
    if (ids.some((id) => done.has(id))) tried.add(k);
    const s = ml[k];
    if (s && ((s.p?.some((n) => n >= 0)) || (s.m?.some((n) => n === 1)) || (s.c?.some((n) => n > 0)))) tried.add(k);
  }
  const right = questions.filter((id) => done.has(id)).length;
  return [
    { k: 'D', zh: '读过', en: 'Read', n: seen.size, d: DV_N },
    { k: 'I', zh: '做过', en: 'Tried', n: tried.size, d: DV_N },
    { k: 'T', zh: '答对', en: 'Right', n: right, d: Math.max(1, questions.length) },
    { k: 'R', zh: '掌握', en: 'Mastered', n: mastered.size, d: DV_N },
  ];
}

const pct = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);

export function ratioHtml(l: L): string {
  const row = cells();
  const attr = row.map((c) => `${c.k}:${c.n}/${c.d}`).join(' ');
  const boxes = row.map((c) => {
    const p = pct(c.n, c.d);
    return `<div class="hm-ratio" data-k="${c.k}"><span>${tx([c.zh, c.en], l)}</span><b>${c.n}/${c.d}</b><i>${p}%</i><div class="bar"><u style="width:${p}%"></u></div></div>`;
  }).join('');
  return `<div class="hm-ratios" data-ditr="${attr}">${boxes}</div>`;
}
