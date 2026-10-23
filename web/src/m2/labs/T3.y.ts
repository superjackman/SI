/* T3 extension labs (M8, R11 gaps 4 and 3): labBeam — greedy vs beam search over an illustrative two-step tree;
   labPpl — perplexity of four next-word probabilities. Maths in ../ymath (unit-tested). */
import type { Env } from '../../legacy/runtime';
import { byId, num, setTxt, tr, wire } from '../kit';
import { allPaths, beam, BEAM_TREE, nll, ppl } from '../ymath';

export const LABS = [{ ids: ['labBeam', 'bmK', 'bmOut'], hooks: [] as string[] }, { ids: ['labPpl', 'pp1', 'ppOut'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env), tree = BEAM_TREE[env.lang === 'en' ? 'en' : 'zh'], sep = env.lang === 'en' ? ' ' : '';
  const goBeam = () => {
    const out = byId(env, 'bmOut'); if (!out) return;
    const v = wire(env, ['bmK'], draw);
    function draw() {
      const k = v('bmK'), r = beam(tree, k), keep = new Set(r.kept2.map((b) => b.tokens.join('|'))), best = allPaths(tree)[0]!;
      setTxt(env, 'bmKv', String(k));
      const rows = r.cands.map((b) => `<tr${keep.has(b.tokens.join('|')) ? ' class="on"' : ''}><td>${b.tokens.join(sep)}</td><td class="n">${num(b.p)}</td><td>${keep.has(b.tokens.join('|')) ? '✓' : ''}</td></tr>`).join('');
      out!.innerHTML = `<p>${t('第 1 步保留', 'Kept after step 1')}: <b data-k="kept1">${r.kept1.map((b) => `${b.tokens[0]} (${num(b.p)})`).join(t('、', ', '))}</b></p>
<table class="bm-t"><thead><tr><th>${t('候选句', 'Candidate')}</th><th>${t('整句概率', 'Probability')}</th><th>${t('保留', 'Kept')}</th></tr></thead><tbody>${rows}</tbody></table>
<p>${t('最终输出', 'Output')}: <b data-k="best">${r.best.tokens.join(sep)}</b> = <b data-k="bestp">${num(r.best.p)}</b> · ${t('所有 9 句里最好的', 'Best of all 9')}: ${best.tokens.join(sep)} = ${num(best.p)}</p>
<p data-k="verdict">${r.best.p < best.p ? t('束太窄：错过了整体最好的句子。', 'Beam too narrow: it missed the overall best sentence.') : t('找到了整体最好的句子。', 'Found the overall best sentence.')}</p>`;
    }
    draw();
  };
  const goPpl = () => {
    const out = byId(env, 'ppOut'); if (!out) return;
    const ids = ['pp1', 'pp2', 'pp3', 'pp4'];
    const v = wire(env, ids, draw);
    byId(env, 'ppU')?.addEventListener('click', () => { for (const id of ids) { const e = byId<HTMLInputElement>(env, id); if (e) e.value = '0.25'; } draw(); });
    function draw() {
      const ps = ids.map((id) => v(id));
      ids.forEach((id, i) => setTxt(env, id + 'v', String(ps[i])));
      out!.innerHTML = `<p>−ln p: ${ps.map((p) => num(-Math.log(p) + 0, 3)).join(' · ')}</p>
<p>${t('平均交叉熵', 'Average cross-entropy')} = <b data-k="nll">${num(nll(ps))}</b> nats · ${t('困惑度', 'Perplexity')} = <b data-k="ppl">${num(ppl(ps), 3)}</b></p>`;
    }
    draw();
  };
  return { labs: [goBeam, goPpl], eager: () => {} };
}
