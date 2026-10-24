/* T4b extension lab (M11, R23): labEmbOut — 我爱吃 → ? in five steps: look up the cards (front dictionary), the layers
   rewrite them, the LAST position is dot-multiplied with every row of the scoring table, softmax with temperature,
   draw one. All numbers are made-up examples; the maths is in ../cfmath (unit-tested). */
import type { Env } from '../../legacy/runtime';
import { byId, num, tr } from '../kit';
import { DIMS, dot, EMB, IDS, OUT, pick, POS, run, SENT, VOCAB, type V } from '../cfmath';

export const LABS = [{ ids: ['labEmbOut', 'eoOut'], hooks: [] as string[] }];
const STEPS = 5;

export function mount(env: Env) {
  const t = tr(env), en = env.lang === 'en';
  const w = (p: [string, string]) => (en ? p[1] : p[0]);
  const vec = (v: V) => `<span class="eo-v">[${v.map((x) => num(x, 2)).join(', ')}]</span>`;
  const barH = (x: number, max: number, c = '') => `<span class="eo-b${c}" style="width:${Math.max(0, Math.min(100, (x / max) * 100)).toFixed(1)}%"></span>`;
  const go = () => {
    const out = byId(env, 'eoOut'), card = byId(env, 'labEmbOut'); if (!out || !card) return;
    let step = 0, T = 1, tally: number[] = VOCAB.map(() => 0), last = -1;
    const pct = (p: number) => num(p * 100, 1) + '%';
    const views: (() => string)[] = [
      () => `<p>${t('① 每个词元按编号去<b>前面的字典</b>里查出自己那一行（名片），<b>不做任何计算</b>，再加上“第几个”的位置信息。', '① Each token looks up its own row (name card) in the <b>front dictionary</b> by its id, <b>no computing at all</b>, then position information (“which place”) is added.')}</p>
<p class="eo-dims">${t('5 个维度（举例）：', '5 dimensions (example): ')}${DIMS.map((d, i) => `<span>${i + 1}. ${w(d)}</span>`).join('')}</p>
<table><thead><tr><th>${t('词元（玩具编号）', 'Token (toy id)')}</th><th>${t('名片 + 位置 = 开始的数', 'card + position = start')}</th></tr></thead><tbody>${IDS.map((id, i) => `<tr data-k="row${i}"><td><b>${w(SENT[i]!)}</b> #${id}</td><td>${vec(EMB[id]!)} + ${vec(POS(i))}<br>= ${vec(run().x0[i]!)}</td></tr>`).join('')}</tbody></table>
<p>${t('注意“吃”的名片：“像动作”最大（1），“像食物”只有 0.3。它只说“吃”这个字一般是什么意思，不知道前面是“我爱”。', 'Look at the card for “eating”: “action” is biggest (1), “food” only 0.3. It only says what the word usually means; it does not know “I love” came before.')}</p>`,
      () => { const r = run(); const tr3 = r.trace, mx = Math.max(...tr3.flat().map(Math.abs));
        return `<p>${t('② 中间层<b>改名片</b>。每一层：先看自己和前面的词（注意力，只看前面），把看到的加进来；再按一条小规则自己加工（前馈）。这里只画最后一个位置“吃”，其实每个位置都在改。', '② The middle layers <b>rewrite the cards</b>. Each layer: look at itself and the earlier words (attention, only backwards) and add what it sees; then process it with a small rule (feed-forward). Only the last position “eating” is drawn here; in fact every position changes.')}</p>
<p class="eo-att">${[r.l1, r.l2].map((l, k) => `${t(`第 ${k + 1} 层，“吃”看：`, `Layer ${k + 1}, “eating” looks at: `)}${l.att[2]!.map((a, j) => `${w(SENT[j]!)} <b>${pct(a)}</b>`).join(t('、', ', '))}`).join('<br>')}</p>
<table class="eo-tr"><thead><tr><th>${t('维度', 'Dim')}</th><th>${t('开始', 'Start')}</th><th>${t('第 1 层后', 'After 1')}</th><th>${t('第 2 层后', 'After 2')}</th></tr></thead><tbody>${DIMS.map((d, i) => `<tr><td>${w(d)}</td>${tr3.map((v, s) => `<td class="n" data-k="tr${s}_${i}">${num(v[i]!, 2)}${barH(Math.abs(v[i]!), mx, i === 0 ? ' f' : '')}</td>`).join('')}</tr>`).join('')}</tbody></table>
<p>${t('“像食物”从 0.3 涨到', '“Food” rises from 0.3 to')} <b data-k="food">${num(r.last[0]!, 2)}</b>${t('，“像动作”反而变小了：这串数现在表示的是“<b>下一个词应该像什么</b>”，叫它“最后的想法”。', ', while “action” shrinks: these numbers now mean “<b>what the next word should look like</b>”, the “final thought”.')}</p>`; },
      () => { const r = run(), raw = OUT.map((o) => dot(EMB[2]!, o)), ord = VOCAB.map((_, i) => i).sort((a, b) => r.scores[b]! - r.scores[a]!), mx = Math.max(...r.scores);
        const rawTop = raw.indexOf(Math.max(...raw));
        return `<p>${t('③ 只拿<b>最后一个位置</b>的“最后的想法”，和<b>后面的打分表</b>里每个词的一行做点积（对应位置相乘再加起来），每个词得一个分数（logits）。', '③ Only the <b>last position’s</b> final thought is dot-multiplied (multiply matching places, add up) with every word’s row in the <b>back scoring table</b>, giving every word a score (logit).')}</p>
<table><thead><tr><th>${t('候选词', 'Word')}</th><th>${t('用“吃”原名片', 'Raw card')}</th><th>${t('用最后的想法', 'Final thought')}</th></tr></thead><tbody>${ord.map((i) => `<tr${i === ord[0] ? ' class="on"' : ''}><td>${w(VOCAB[i]!)}</td><td class="n">${num(raw[i]!, 2)}${i === rawTop ? ' ⭐' : ''}</td><td class="n" data-k="s${i}">${num(r.scores[i]!, 2)}${barH(r.scores[i]!, mx)}</td></tr>`).join('')}</tbody></table>
<p>${t('如果直接拿“吃”<b>没改过的名片</b>去打分，赢的是', 'Scored with the <b>unrewritten card</b> of “eating”, the winner would be')} <b data-k="rawTop">${w(VOCAB[rawTop]!)}</b>${t('（它也像动作）；改过以后，赢的是', ' (also an action); after rewriting, the winner is')} <b data-k="top">${w(VOCAB[ord[0]!]!)}</b>${t('。分数还不是答案，下一步把它变成概率。', '. Scores are not the answer yet; next they become probabilities.')}</p>`; },
      () => { const r = run(T), ord = VOCAB.map((_, i) => i).sort((a, b) => r.probs[b]! - r.probs[a]!);
        return `<p>${t('④ softmax：每个分数先<b>除以温度 T</b>，再算 e（约 2.718）的这么多次方，最后除以总和，变成加起来正好 100% 的概率。', '④ Softmax: divide every score by the <b>temperature T</b>, raise e (about 2.718) to that power, then divide by the total, giving probabilities that add up to exactly 100%.')}</p>
<div class="k-ctl"><label>${t('温度 T', 'Temperature T')} = <b id="eoTv">${num(T, 1)}</b><input type="range" id="eoT" min="0.2" max="2" step="0.1" value="${T}"></label></div>
<table class="eo-p"><tbody>${ord.map((i) => `<tr><td>${w(VOCAB[i]!)}</td><td class="eo-pc">${barH(r.probs[i]!, 1, ' p')}</td><td class="n" data-k="p${i}">${pct(r.probs[i]!)}</td></tr>`).join('')}</tbody></table>
<p>${t('第一名', 'First place')} <b>${w(VOCAB[ord[0]!]!)}</b> = <b data-k="ptop">${pct(r.probs[ord[0]!]!)}</b>${t('。T 小于 1：差距被放大，第一名更稳；T 大于 1：差距被压平，更随机。', '. T below 1: gaps grow, first place is safer; T above 1: gaps shrink, more random.')}</p>`; },
      () => { const r = run(T), n = tally.reduce((a, b) => a + b, 0);
        return `<p>${t('⑤ 按上一步的概率<b>抽一个</b>词接到句子后面（温度 T = ', '⑤ <b>Draw one</b> word by the probabilities of the previous step and append it (temperature T = ')}${num(T, 1)}${t('）。接上以后，真实模型会带着新句子再走一遍，猜下一个。', '). After appending, a real model runs the new sentence through again to guess the next one.')}</p>
<p class="eo-sent" data-k="sent">${SENT.map((s) => w(s)).join(en ? ' ' : '')}${en ? ' ' : ''}<b>${last >= 0 ? w(VOCAB[last]!) : '＿'}</b></p>
<p class="bp-nav"><button type="button" class="btn primary" data-eo-act="1">${t('抽一次', 'Draw once')}</button><button type="button" class="btn" data-eo-act="20">${t('抽 20 次', 'Draw 20 times')}</button><button type="button" class="btn" data-eo-act="0">${t('清空', 'Clear')}</button></p>
<table><thead><tr><th>${t('词', 'Word')}</th><th>${t('概率', 'Chance')}</th><th>${t('抽中次数', 'Drawn')}</th></tr></thead><tbody>${VOCAB.map((v, i) => `<tr><td>${w(v)}</td><td class="n">${pct(r.probs[i]!)}</td><td class="n" data-k="c${i}">${tally[i]}</td></tr>`).join('')}</tbody></table>
<p>${t('一共抽了', 'Drawn')} <b data-k="n">${n}</b> ${t('次。分最高的也不是每次都中。', 'times. Even the top score does not win every time.')}</p>`; },
    ];
    const draw = () => {
      out.innerHTML = views[step]!();
      card.querySelectorAll<HTMLButtonElement>('[data-eo]').forEach((b) => { const on = +(b.dataset.eo ?? -1) === step; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      const pv = byId<HTMLButtonElement>(env, 'eoPrev'), nx = byId<HTMLButtonElement>(env, 'eoNext');
      if (pv) pv.disabled = step === 0; if (nx) nx.disabled = step === STEPS - 1;
      out.dataset.step = String(step);
    };
    card.addEventListener('click', (e) => {
      const el = e.target as HTMLElement, s = el.closest<HTMLElement>('[data-eo]'), a = el.closest<HTMLElement>('[data-eo-act]');
      if (s) { step = +(s.dataset.eo ?? 0); draw(); return; }
      if (el.closest('#eoPrev')) { step = Math.max(0, step - 1); draw(); return; }
      if (el.closest('#eoNext')) { step = Math.min(STEPS - 1, step + 1); draw(); return; }
      if (a) {
        const k = +(a.dataset.eoAct ?? 0), p = run(T).probs;
        if (!k) { tally = VOCAB.map(() => 0); last = -1; } else for (let i = 0; i < k; i++) { last = pick(p, Math.random()); tally[last]!++; }
        draw();
      }
    });
    out.addEventListener('input', (e) => {
      const el = e.target as HTMLInputElement; if (el.id !== 'eoT') return;
      T = Number(el.value); const r = run(T);
      /* update in place so the slider keeps focus while dragging */
      const tv = byId(env, 'eoTv'); if (tv) tv.textContent = num(T, 1);
      const ord = VOCAB.map((_, i) => i).sort((a, b) => r.probs[b]! - r.probs[a]!);
      const body = out.querySelector('table.eo-p tbody'); if (body) body.innerHTML = ord.map((i) => `<tr><td>${w(VOCAB[i]!)}</td><td class="eo-pc">${barH(r.probs[i]!, 1, ' p')}</td><td class="n" data-k="p${i}">${pct(r.probs[i]!)}</td></tr>`).join('');
      const pt = out.querySelector('[data-k="ptop"]'); if (pt) pt.textContent = pct(r.probs[ord[0]!]!);
    });
    draw();
  };
  return { labs: [go], eager: () => {} };
}
