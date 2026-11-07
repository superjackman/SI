/* R51 注意力动画讲解 (storyboard 03): seven shots, about 30 s, plain SVG + CSS, no video. Auto-plays once when it scrolls
   into view, can be paused and stepped frame by frame; with prefers-reduced-motion it never auto-plays and has no
   motion (just ‹ › steps). Lazy: only step 8a loads it. The numbers are the shared example (KM12 / steps 7 and 8a):
   scores 16 / 8 / 0, ÷ √64, softmax. */
import { tx, type L } from '../l4/txt';
import { D_ATT, attW, fmt } from '../vf/calc';

type T = readonly [string, string];
const W = 300, TW = 40, GAP = (W - 7 * TW) / 6, TY = 132, TH = 28;
const tok = (l: L) => (l === 'zh' ? ['小猫', '坐在', '垫子', '上', '因为', '它', '很累'] : ['cat', 'sat', 'on', 'mat', 'as', 'it', 'tired']);
/** the three words that get a score (cat, mat, as / 小猫, 垫子, 因为) and "it" */
const IDX = (l: L) => (l === 'zh' ? [0, 2, 4] : [0, 3, 4]), IT = 5;
const cx = (i: number) => i * (TW + GAP) + TW / 2;
const CAP: readonly T[] = [
  ['“它很累”——它是谁？人一眼就懂，AI 怎么知道？', '“it was tired”: who is “it”? You know at a glance. How does an AI know?'],
  ['每个词先变成一串数字：空间里的一个箭头（词向量）。', 'Every word first becomes a list of numbers: an arrow in space (a word vector).'],
  ['“它”带着需求 Q：“我在找一个会累的东西”；别的词亮出名牌 K。', '“it” carries a need, Q: “I’m looking for something that can be tired”; the other words show their name tags, K.'],
  ['需求 · 名牌 = 匹配分（点积）：越对得上，分越高。', 'need · tag = match score (dot product): the better they match, the higher the score.'],
  ['先除以 √64 = 8，防止一家独占；再用 softmax 变成加起来 100% 的比例。', 'First divide by √64 = 8 so no one word takes everything; then softmax turns them into shares that add up to 100%.'],
  ['按比例把大家的内容 V 混进来：“它”现在带着“小猫”的意思。', 'Mix in everyone’s content V by those shares: “it” now carries the meaning of the cat.'],
  ['一句话记住：注意力 = 找谁 + 打分 + 按比例混合。', 'In one line: attention = look for whom + score + mix by shares.'],
];
const N = CAP.length;
function frame(f: number, l: L): string {
  const z = (a: string, b: string) => tx([a, b], l), ws = tok(l), ix = IDX(l), w = attW(D_ATT, 64), sc = D_ATT.map((v) => v / 8);
  const hit = (i: number) => (f >= 2 && f <= 4 && ix.includes(i) ? ' k' : f >= 5 && i === ix[0] ? ' v' : '');
  let back = '', front = '';
  if (f === 1) back += ws.map((_, i) => { const a = [-0.9, -0.4, 0.5, 1.1, -1.2, -0.7, 0.8][i]!; return `<line class="ly-af" x1="${cx(i)}" y1="${TY - 4}" x2="${(cx(i) + 22 * Math.sin(a)).toFixed(1)}" y2="${(TY - 4 - 40 * Math.cos(a * 0.5)).toFixed(1)}" stroke="var(--link)" stroke-width="2.5" marker-end="url(#ly-tb)"/>`; }).join('');
  // the search beam from 它 / it to the words it checks
  if (f === 2 || f === 3) back += ix.map((i, j) => `<path class="ly-af ly-beam" d="M${cx(IT)} ${TY} Q ${(cx(i) + cx(IT)) / 2} ${TY - 46 - j * 10} ${cx(i)} ${TY}"/>`).join('');
  if (f === 5) back += ix.map((i, j) => `<path class="ly-af ly-flow" d="M${cx(i)} ${TY - 2} Q ${(cx(i) + cx(IT)) / 2} ${TY - 70 + j * 18} ${cx(IT)} ${TY - 2}" stroke-width="${(2 + 14 * w[j]!).toFixed(1)}"/>`).join('');
  if (f === 0) front += `<text class="ly-af ly-big" x="${W / 2}" y="78" text-anchor="middle">${z('它 = ？', 'it = ?')}</text>`;
  if (f === 2) front += `<text class="ly-af" x="${W / 2}" y="26" text-anchor="middle" fill="var(--navy)">${z('Q：我在找一个会累的东西', 'Q: something that can be tired')}</text>` + [[ix[0]!, z('K：动物', 'K: animal')], [ix[1]!, z('K：物品', 'K: object')], [ix[2]!, z('K：原因', 'K: reason')]].map(([i, t], j) => `<text class="ly-af" x="${Math.min(W - 24, Math.max(24, cx(i as number)))}" y="${TY + TH + 16 + (j % 2) * 17}" text-anchor="middle" fill="var(--good-bg)">${t}</text>`).join('');
  if (f === 3) front += ix.map((i, j) => `<text class="ly-af ly-num" x="${cx(i)}" y="${TY + TH + 22}" text-anchor="middle">${D_ATT[j]}</text>`).join('') + `<text x="${W / 2}" y="26" text-anchor="middle" fill="var(--card)">${z('需求 · 名牌 = 匹配分', 'need · tag = match score')}</text>`;
  if (f === 4) {
    front += `<text x="${W / 2}" y="20" text-anchor="middle" fill="var(--card)">${D_ATT.join(', ')} ÷ √64 → ${sc.map((v) => fmt(v, 0)).join(', ')} → softmax</text>`;
    front += ix.map((i, j) => `<text x="6" y="${46 + j * 22}" fill="var(--card)">${ws[i]}</text><rect class="ly-af ly-grow" x="54" y="${34 + j * 22}" width="${(190 * w[j]!).toFixed(1)}" height="14" rx="4" fill="var(--good-bg)"/><text x="${(60 + 190 * w[j]!).toFixed(1)}" y="${46 + j * 22}" fill="var(--good-bg)">${fmt(100 * w[j]!, 1)}%</text>`).join('');
  }
  if (f === 5) front += `<text x="${W / 2}" y="22" text-anchor="middle" fill="var(--link)">${z(`V 按 ${ix.map((_, j) => fmt(100 * w[j]!, 1) + '%').join(' / ')} 流进“它”`, `V flows into “it” by ${ix.map((_, j) => fmt(100 * w[j]!, 1) + '%').join(' / ')}`)}</text>`;
  if (f === 6) front += `<text class="ly-af" x="${W / 2}" y="46" text-anchor="middle" fill="var(--card)" font-weight="700">${z('找谁 + 打分 + 混合', 'look + score + mix')}</text><text class="ly-af" x="${W / 2}" y="86" text-anchor="middle"><tspan fill="var(--card)">softmax(</tspan><tspan fill="var(--navy)">Q</tspan><tspan fill="var(--card)"> × </tspan><tspan fill="var(--good-bg)">Kᵀ</tspan><tspan fill="var(--card)"> / √d) × </tspan><tspan fill="var(--link)">V</tspan></text>`;
  const toks = ws.map((t, i) => `<rect x="${(cx(i) - TW / 2).toFixed(1)}" y="${TY}" width="${TW}" height="${TH}" rx="6" class="ly-tk${i === IT && f !== 1 ? (f >= 5 ? ' itv' : ' it') : hit(i)}"/><text x="${cx(i).toFixed(1)}" y="${TY + 19}" text-anchor="middle" class="ly-tt">${t}</text>`).join('');
  return `<svg class="ly-asvg" viewBox="0 0 ${W} 196" role="img" aria-label="${tx(CAP[f]!, l)}"><defs><marker id="ly-tb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--link)"/></marker></defs>${back}${toks}${front}</svg>`;
}
/** draw the animation into `el` */
export function att(el: HTMLElement, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  const reduce = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
  let f = 0, timer = 0, played = false;
  el.classList.add('ly-anim'); if (reduce) el.classList.add('rm');
  el.innerHTML = `<div class="ly-stage" aria-live="polite"></div><p class="ly-acap"></p><div class="ly-actl"><button type="button" class="l4-b" data-at="prev" aria-label="${z('上一个镜头', 'Previous shot')}">‹</button>${reduce ? '' : `<button type="button" class="l4-b ly-play" data-at="play"></button>`}<span class="ly-afn"></span><button type="button" class="l4-b" data-at="next" aria-label="${z('下一个镜头', 'Next shot')}">›</button></div>`;
  const st = el.querySelector<HTMLElement>('.ly-stage')!, cap = el.querySelector<HTMLElement>('.ly-acap')!, fn = el.querySelector<HTMLElement>('.ly-afn')!, pb = el.querySelector<HTMLElement>('[data-at="play"]');
  const playing = () => timer !== 0;
  const show = () => {
    st.innerHTML = frame(f, l); cap.textContent = tx(CAP[f]!, l); fn.textContent = z(`镜头 ${f + 1} / ${N}`, `Shot ${f + 1} / ${N}`); el.dataset.f = String(f + 1);
    if (pb) { pb.textContent = playing() ? z('⏸ 暂停', '⏸ Pause') : f === N - 1 ? z('↺ 重播', '↺ Replay') : z('▶ 播放', '▶ Play'); pb.setAttribute('aria-pressed', String(playing())); }
  };
  const stop = () => { if (timer) { clearInterval(timer); timer = 0; } };
  const play = () => { stop(); if (f === N - 1) f = 0; timer = window.setInterval(() => { if (!el.isConnected) { stop(); return; } if (f < N - 1) f++; if (f === N - 1) stop(); show(); }, 4200); show(); };
  el.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-at]'); if (!b) return;
    const k = b.dataset.at;
    if (k === 'play') { if (playing()) stop(); else play(); show(); return; }
    stop(); f = k === 'prev' ? Math.max(0, f - 1) : Math.min(N - 1, f + 1); show();
  });
  show();
  /* R56 回炉: the micro-loop opens one exact shot (0-based) */
  el.addEventListener('att-go', (e) => { const k = Number((e as CustomEvent<number>).detail); if (!Number.isInteger(k)) return; stop(); played = true; f = Math.max(0, Math.min(N - 1, k)); show(); el.scrollIntoView({ block: 'center' }); });
  // auto-play once, the first time it is actually on screen
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting) && !played && el.isConnected && !el.closest('[hidden]')) { played = true; io.disconnect(); play(); } }, { threshold: 0.6 });
    io.observe(el);
  }
}
