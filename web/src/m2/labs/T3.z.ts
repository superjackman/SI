/* T3 R14 lab: labBpe — byte-pair-encoding merges on the corpus of Sennrich et al. 2016 (Algorithm 1), stepped one merge
   at a time, plus tokenizing a typed word with the merges learned so far. Maths in ../zmath (unit-tested). */
import type { Env } from '../../legacy/runtime';
import { byId, setTxt, tr, wire } from '../kit';
import { bpeEncode, cleanWord, learnBpe } from '../zmath';

export const LABS = [{ ids: ['labBpe', 'bpK', 'bpOut'], hooks: [] as string[] }];
export const BPE_N = 10;
const H = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function mount(env: Env) {
  const t = tr(env);
  const goBpe = () => {
    const out = byId(env, 'bpOut'), kEl = byId<HTMLInputElement>(env, 'bpK'), wEl = byId<HTMLInputElement>(env, 'bpW'); if (!out || !kEl) return;
    const R = learnBpe(BPE_N);
    const v = wire(env, ['bpK', 'bpW'], draw);
    const step = (d: number) => { kEl.value = String(Math.max(0, Math.min(BPE_N, v('bpK') + d))); draw(); };
    byId(env, 'bpPrev')?.addEventListener('click', () => step(-1));
    byId(env, 'bpNext')?.addEventListener('click', () => step(1));
    function draw() {
      const k = v('bpK'), S = R.steps[k]!, merges = R.merges.slice(0, k), vocab = R.vocab.slice(0, R.base.length + k);
      setTxt(env, 'bpKv', String(k));
      const nx = byId<HTMLButtonElement>(env, 'bpNext'), pv = byId<HTMLButtonElement>(env, 'bpPrev');
      if (nx) nx.disabled = k >= BPE_N; if (pv) pv.disabled = k <= 0;
      const chip = (s: string, c = '') => `<span class="bp-t${c}">${H(s)}</span>`;
      const top = S.counts.map((e, i) => [e, i] as const).sort((a, b) => b[0][1] - a[0][1] || a[1] - b[1]).slice(0, 6);
      const isBest = (p: [string, string]) => !!S.best && S.best[0] === p[0] && S.best[1] === p[1];
      const raw = wEl ? wEl.value : '', w = cleanWord(raw), toks = w ? bpeEncode(w, merges) : [];
      out!.innerHTML = `<p class="bp-h">${t('语料现在的切分', 'The corpus as currently split')}</p>
<table><tbody>${S.words.map(([s, f]) => `<tr><td>${s.map((x) => chip(x)).join('')}</td><td class="n">×${f}</td></tr>`).join('')}</tbody></table>
<p class="bp-h">${t('相邻两块的出现次数（前 6）', 'Adjacent-pair counts (top 6)')}</p>
<table><tbody>${top.map(([[p, c]]) => `<tr${isBest(p) ? ' class="on"' : ''}><td>${chip(p[0])} + ${chip(p[1])}${isBest(p) ? ` <span class="bp-nx">← ${t('下一次合并', 'next merge')}</span>` : ''}</td><td class="n">${c}</td></tr>`).join('')}</tbody></table>
<p>${t('下一次合并', 'Next merge')}: <b data-k="next">${S.best ? `${H(S.best[0])} + ${H(S.best[1])} → ${H(S.best.join(''))}` : t(`已做满 ${BPE_N} 次（论文例子的设定）`, `all ${BPE_N} done (the paper’s example setting)`)}</b></p>
<p class="bp-h">${t('已学到的合并（按顺序）', 'Merges learned so far (in order)')}: <span data-k="merges">${merges.length ? merges.map(([a, b], i) => `${i + 1}. ${H(a)}+${H(b)}`).join(' · ') : '—'}</span></p>
<p class="bp-h">${t('词表', 'Vocabulary')}: <b data-k="vsize">${vocab.length}</b> ${t('个', 'tokens')}</p><p class="bp-v">${vocab.map((x, i) => chip(x, i >= R.base.length ? ' new' : '')).join('')}</p>
<p class="bp-h">${t('你输入的词', 'Your word')}${w && w !== raw ? ` (${t('只取字母', 'letters only')}: ${H(w)})` : ''}: ${toks.length ? `<b data-k="ntok">${toks.length}</b> ${t('个词元', 'tokens')}` : '—'}</p>
<p class="bp-v" data-k="tok">${toks.map((x) => chip(x, x.length === 1 && !R.base.includes(x) ? ' unk' : '')).join('')}</p>`;
    }
    draw();
  };
  return { labs: [goBpe], eager: () => {} };
}
