/* R51 逐层展开 (layered teaching), the pilot on steps 1, 2, 8a and 8b: one concept per screen, five layers
   ① 为什么要关心 + 类比 → ② 图 / 动画 → ③ 数字 (+ the slider demo) → ④ 公式 (each part colour-mapped to the analogy) → ⑤ 小测 + 常见误解.
   A 5-part progress bar on top; 「懂了，下一层」 reveals the next layer; the depth switch 30 秒 / 5 分钟 / 深入 caps what can be shown
   (1 / 3 / 5 layers) and is remembered in localStorage, as is how far each page has been opened. Nothing here navigates,
   so it never adds a history entry. A lazy chunk: only the pilot pages load it. */
import './ly.css';
import { tx, type L } from '../l4/txt';
import type { Ly, Stage } from './types';
import { fillDvText } from './nums';
import { D_SM4, fmt, softmax } from '../vf/calc';

export const LY_DEPTH = 'si.ly.depth', LY_OPEN = 'si.ly.open';
export type Depth = 's' | 'm' | 'd';
/** how many layers each depth can show */
export const DEPTH_MAX: Readonly<Record<Depth, number>> = { s: 1, m: 3, d: 5 };
/** the smallest depth that shows layer k */
export const depthFor = (k: number): Depth => (k <= 1 ? 's' : k <= 3 ? 'm' : 'd');
const okD = (v: unknown): v is Depth => v === 's' || v === 'm' || v === 'd';
export const depthGet = (): Depth => { try { const v = localStorage.getItem(LY_DEPTH); return okD(v) ? v : 'm'; } catch { return 'm'; } };
const depthSet = (d: Depth) => { try { localStorage.setItem(LY_DEPTH, d); } catch { /* private mode */ } };
const openAll = (): Record<string, number> => { try { const v = JSON.parse(localStorage.getItem(LY_OPEN) || '{}') as unknown; return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, number>) : {}; } catch { return {}; } };
/** how many layers of `page` the reader has opened (1–5) */
export const openGet = (page: string) => { const n = Number(openAll()[page]); return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 1; };
const openSet = (page: string, n: number) => { const o = openAll(); o[page] = n; try { localStorage.setItem(LY_OPEN, JSON.stringify(o)); } catch { /* private mode */ } };
/** layers shown = what was opened, capped by the depth */
export const shown = (open: number, d: Depth) => Math.max(1, Math.min(open, DEPTH_MAX[d]));

const NAME: readonly (readonly [string, string])[] = [['类比', 'Hook'], ['图', 'Picture'], ['数字', 'Numbers'], ['公式', 'Formula'], ['小测', 'Check']];
const HEAD: readonly (readonly [string, string])[] = [['为什么要关心 · 生活类比', 'Why care · an everyday analogy'], ['看图', 'See it'], ['算一算真实的数', 'The real numbers'], ['公式：每一块对应刚才的类比', 'The formula: each part maps back to the analogy'], ['小测 + 常见误解', 'Check yourself + common misconceptions']];
const NXT: readonly (readonly [string, string])[] = [['懂了，看图', 'Got it: see the picture'], ['懂了，看数字', 'Got it: the numbers'], ['懂了，看公式', 'Got it: the formula'], ['懂了，做小测', 'Got it: check yourself']];
const CIRC = ['①', '②', '③', '④', '⑤'];
const DLAB: Readonly<Record<Depth, readonly [string, string]>> = { s: ['30 秒', '30 s'], m: ['5 分钟', '5 min'], d: ['深入', 'Deep'] };

type Mk = (s: string) => string;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const P = (xs: string[], mk: Mk, c = '') => xs.map((x) => `<p${c ? ` class="${c}"` : ''}>${mk(x)}</p>`).join('');
const UL = (xs: string[], mk: Mk, c = '') => (xs.length ? `<ul${c ? ` class="${c}"` : ''}>${xs.map((x) => `<li>${mk(x)}</li>`).join('')}</ul>` : '');
const plain = (s: string) => s.replace(/⟦[a-z]:([^⟧]*)⟧/g, '$1');

/* ---------- the pictures (pure html; the attention one is an animation in ./att) ---------- */
function picSm(l: L, mk: Mk) {
  const z = (a: string, b: string) => tx([a, b], l), p = softmax(D_SM4), lab = l === 'zh' ? ['蓝', '绿', '红', '天'] : ['blue', 'green', 'red', 'sky'];
  const rows = D_SM4.map((v, i) => `<div class="ly-smr"><span class="ly-sml">${lab[i]}</span><span class="ly-c ly-q ly-sms">${fmt(v, 1)}</span><span class="ly-sma" aria-hidden="true">→</span><span class="ly-smb"><i style="width:${Math.max(2, Math.round(100 * p[i]!))}%"></i></span><span class="ly-c ly-k ly-smp">${fmt(100 * p[i]!, 1)}%</span></div>`).join('');
  // the penalty curve −ln p on p ∈ (0, 1], the three probabilities the page talks about marked
  const X = (q: number) => 8 + q * 284, Y = (v: number) => 8 + (1 - Math.min(v, 3.5) / 3.5) * 84;
  let c = ''; for (let k = 0; k <= 60; k++) { const q = 0.03 + (0.97 * k) / 60; c += `${k ? 'L' : 'M'}${X(q).toFixed(1)} ${Y(-Math.log(q)).toFixed(1)}`; }
  const pts = [[0.0536, '#ff8a80'], [p[0]!, '#ffd166'], [0.998, '#34d399']] as const;
  const svg = `<svg class="ly-pen" viewBox="0 0 300 100" role="img" aria-label="${z('罚分曲线：概率越小，罚分越大', 'Penalty curve: the smaller the probability, the bigger the penalty')}"><line x1="8" y1="92" x2="292" y2="92" stroke="#33508f"/><line x1="8" y1="8" x2="8" y2="92" stroke="#33508f"/><path d="${c}" fill="none" stroke="#c4b5fd" stroke-width="2.5"/>${pts.map(([q, col]) => `<circle cx="${X(q).toFixed(1)}" cy="${Y(-Math.log(q)).toFixed(1)}" r="5" fill="${col}"/>`).join('')}</svg>`;
  const leg = [[`{#p0}`, `{#ce0}`, 'r'], [`${fmt(100 * p[0]!, 1)}%`, '`−ln 0.625 ≈ 0.47`', 'q'], [`{#p1}`, `{#ce1}`, 'k']].map(([a, b, c2]) => `<li><span class="ly-dot ly-${c2}" aria-hidden="true"></span>${mk(fillDvText(`p = ${a} → ${z('罚分', 'penalty')} ${b}`, l))}</li>`).join('');
  return `<div class="ly-sm" role="group" aria-label="softmax"><div class="ly-smh"><span>${z('候选', 'Token')}</span><span class="ly-c ly-q">${z('分数', 'Score')}</span><span></span><span class="ly-c ly-k">${z('softmax 后的概率', 'Probability after softmax')}</span></div>${rows}</div>
<p class="ly-cap">${z('罚分 = −ln p（横轴：给正确答案的概率 p，纵轴：罚分）', 'Penalty = −ln p (across: the probability p of the right answer; up: the penalty)')}</p>${svg}<ul class="ly-leg">${leg}</ul>`;
}
function picBowl(l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  const X = (w: number) => (w + 0.6) * 72, Y = (w: number) => 192 - (w + 0.4) * 72;
  const lv = [0.25, 1, 2.25, 4, 6], ell = lv.map((c, i) => `<ellipse cx="${X(2)}" cy="${Y(1)}" rx="${(Math.sqrt(c) * 72).toFixed(1)}" ry="${(Math.sqrt(c / 2) * 72).toFixed(1)}" fill="none" stroke="${i === lv.length - 1 ? '#5b8cff' : '#2f4f99'}" stroke-width="${i === lv.length - 1 ? 1.6 : 1.2}"/>`).join('');
  // gradient descent from (0, 0) with η = 0.1: both coordinates move in the same step
  const pts: [number, number][] = [[0, 0]]; for (let k = 0; k < 10; k++) { const [a, b] = pts[pts.length - 1]!; pts.push([a - 0.1 * 2 * (a - 2), b - 0.1 * 4 * (b - 1)]); }
  const path = pts.map(([a, b], k) => `${k ? 'L' : 'M'}${X(a).toFixed(1)} ${Y(b).toFixed(1)}`).join('');
  const s = 0.15, x0 = X(0), y0 = Y(0), dx = 4 * s * 72, dy = 4 * s * 72;
  const ar = (id: string, c: string) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`;
  return `<svg class="ly-bowl" viewBox="0 0 300 200" role="img" aria-label="${z('碗形损失的俯视图：负梯度由两个偏导合成', 'The bowl-shaped loss from above: the negative gradient is made of the two partial derivatives')}"><defs>${ar('ly-aq', '#ffd166')}${ar('ly-ak', '#34d399')}${ar('ly-av', '#c4b5fd')}</defs>
<line x1="${x0}" y1="196" x2="${x0}" y2="4" stroke="#33508f" stroke-dasharray="3 3"/><line x1="4" y1="${y0}" x2="296" y2="${y0}" stroke="#33508f" stroke-dasharray="3 3"/>${ell}
<path d="${path}" fill="none" stroke="#e6eeff" stroke-width="1" stroke-dasharray="2 3"/>${pts.slice(1).map(([a, b]) => `<circle cx="${X(a).toFixed(1)}" cy="${Y(b).toFixed(1)}" r="2.6" fill="#e6eeff"/>`).join('')}
<line x1="${x0}" y1="${y0}" x2="${x0 + dx}" y2="${y0}" stroke="#ffd166" stroke-width="3" marker-end="url(#ly-aq)"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 - dy}" stroke="#34d399" stroke-width="3" marker-end="url(#ly-ak)"/><line x1="${x0}" y1="${y0}" x2="${x0 + dx}" y2="${y0 - dy}" stroke="#c4b5fd" stroke-width="3.5" marker-end="url(#ly-av)"/>
<circle cx="${x0}" cy="${y0}" r="4.5" fill="#ff8a80"/><path d="M${X(2)} ${Y(1) - 7}l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" fill="#ffd166"/></svg>
<ul class="ly-leg"><li><span class="ly-dot ly-r" aria-hidden="true"></span>${z('起点 (0, 0)，横轴 w1，纵轴 w2', 'Start (0, 0); across w1, up w2')}</li><li><span class="ly-dot ly-q" aria-hidden="true"></span>${z('只动 w1：−∂L/∂w1 = 4', 'Only w1: −∂L/∂w1 = 4')}</li><li><span class="ly-dot ly-k" aria-hidden="true"></span>${z('只动 w2：−∂L/∂w2 = 4', 'Only w2: −∂L/∂w2 = 4')}</li><li><span class="ly-dot ly-v" aria-hidden="true"></span>${z('合起来：负梯度 (4, 4)，一步同时改两个', 'Together: the negative gradient (4, 4), one step changes both')}</li><li><span class="ly-c ly-q" aria-hidden="true">★ </span>${z('碗底 (2, 1)', 'the bottom (2, 1)')}</li></ul>`;
}
function picBlk(l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  return `<div class="ly-blk" role="group" aria-label="${z('一个解码块', 'One decoder block')}"><div class="ly-bx">${z('输入：每个词一串数（词向量）', 'In: one list of numbers per word (word vectors)')}</div>
<div class="ly-bs"><span class="ly-bn">${z('× N 层', '× N layers')}</span>
<div class="ly-br c">${z('归一化', 'Normalise')}</div><div class="ly-br q">${z('多头注意力：词和词交流', 'Multi-head attention: words talk')}<small class="ly-c ly-r">${z('位置：RoPE 旋转 q、k', 'Position: RoPE rotates q, k')}</small></div><div class="ly-ba">${z('⊕ 加回输入（残差）', '⊕ add back the input (residual)')}</div>
<div class="ly-br c">${z('归一化', 'Normalise')}</div><div class="ly-br k">${z('FFN：每个词各自消化', 'FFN: each word thinks alone')}</div><div class="ly-ba">${z('⊕ 加回（残差）', '⊕ add back (residual)')}</div></div>
<div class="ly-bx">${z('输出头 → 下一个词元的概率', 'Output head → odds for the next token')}</div></div>`;
}

/** the layered body of a pilot stage page (replaces ①–④, the try-it line and the 验证 block) */
export function html(S: Stage & { ly: Ly }, page: string, l: L, mk: Mk, exK: string): string {
  const z = (a: string, b: string) => tx([a, b], l), Y = S.ly, d = depthGet(), v = shown(openGet(page), d);
  const pic = Y.pic === 'sm' ? picSm(l, mk) : Y.pic === 'bowl' ? picBowl(l) : Y.pic === 'blk' ? picBlk(l) : `<div class="ly-att" data-att="1"></div>`;
  const fxs = Y.fx.map(plain), more = S.f.filter((f) => !fxs.includes(f));
  const L5 = [
    `<p class="ly-hook"><b>${z('为什么要关心', 'Why care')}</b>${mk(Y.hook)}</p>${P(Y.an, mk)}<details class="ly-jv"><summary>${z('我是程序员：换个说法', 'I’m a programmer: say it in code')}</summary><p>${mk(Y.jv)}</p></details>`,
    `${pic}${P(Y.pc, mk, 'ly-cap')}`,
    `${UL([...Y.num, ...S.x], mk, 'ly-num')}${exK}<div class="vf-slot" data-vf-part="demo"></div>`,
    `<div class="ly-fx">${Y.fx.map((f) => `<p>${mk(f)}</p>`).join('')}</div>${UL(Y.fe, mk, 'ly-fe')}<details class="ly-more"><summary>${z('深入：原理、更多公式和出处', 'Deeper: the reasoning, more formulas, sources')}</summary><p>${mk(S.q)}</p>${UL(S.i, mk)}${UL(more, mk)}<p class="dv-do"><b>${z('动手验证', 'Try it')}</b>${mk(S.h)}</p></details>`,
    `<div class="vf-slot" data-vf-part="check"></div>`,
  ];
  const seg = (['s', 'm', 'd'] as const).map((k) => `<button type="button" role="radio" data-ly-d="${k}" aria-checked="${k === d}"${k === d ? ' class="on"' : ''}>${esc(tx(DLAB[k], l))}</button>`).join('');
  const bar = NAME.map((n, k) => `<li><button type="button" data-ly-go="${k + 1}"><b>${CIRC[k]}</b><span>${esc(tx(n, l))}</span></button></li>`).join('');
  const secs = L5.map((b, k) => `<section class="ly-l" data-ly="${k + 1}"${k + 1 > v ? ' hidden' : ''}><h3 class="ly-h" tabindex="-1"><span class="ly-n">${CIRC[k]}</span>${esc(tx(HEAD[k]!, l))}</h3>${b}</section>`).join('');
  return `<div class="ly" data-ly-page="${page}" lang="${l === 'en' ? 'en' : 'zh-CN'}"><div class="ly-top"><div class="g-seg ly-dep" role="radiogroup" aria-label="${z('学多深', 'How deep')}">${seg}</div><ol class="ly-pg" aria-label="${z('五层进度', 'Five layers')}">${bar}</ol></div>${secs}<div class="ly-nx"></div></div>`;
}

/** wire the layered body inside `host`: depth, 懂了 → next layer, the bar, the two 验证 parts, the pictures */
export function wire(host: HTMLElement, page: string, l: L) {
  const root = host.querySelector<HTMLElement>('.ly'); if (!root) return;
  const z = (a: string, b: string) => tx([a, b], l);
  let d = depthGet(), open = openGet(page);
  const reduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
  const draw = () => {
    const v = shown(open, d), max = DEPTH_MAX[d];
    root.dataset.depth = d; root.dataset.shown = String(v);
    root.querySelectorAll<HTMLElement>('.ly-l').forEach((s) => { s.hidden = Number(s.dataset.ly) > v; });
    root.querySelectorAll<HTMLElement>('[data-ly-d]').forEach((b) => { const on = b.dataset.lyD === d; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
    root.querySelectorAll<HTMLElement>('[data-ly-go]').forEach((b) => {
      const k = Number(b.dataset.lyGo); b.className = k < v ? 'done' : k === v ? 'on' : k <= max ? 'off' : 'out';
      b.setAttribute('aria-label', `${CIRC[k - 1]} ${tx(NAME[k - 1]!, l)}${k <= v ? z('（已展开）', ' (open)') : k <= max ? '' : z('（在更深一档）', ' (in a deeper setting)')}`);
      if (k === v) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    const nx = root.querySelector<HTMLElement>('.ly-nx')!;
    nx.innerHTML = v >= 5 ? `<p class="ly-end">${z('✓ 五层都看完了。下面是下一步。', '✓ All five layers done. The next step is below.')}</p>`
      : v < max ? `<button type="button" class="l4-b g-jump ly-go" data-ly-a="next">${esc(tx(NXT[v - 1]!, l))}</button>`
      : `<button type="button" class="l4-b g-info ly-go" data-ly-a="up">${d === 's' ? z('想多看一点？切到 5 分钟：图和数字', 'Want more? Switch to 5 min: picture and numbers') : z('想看公式和小测？切到深入', 'Want the formula and a check? Switch to Deep')}</button>`;
  };
  const focus = (k: number) => { const h = root.querySelector<HTMLElement>(`.ly-l[data-ly="${k}"] .ly-h`); if (!h) return; h.focus({ preventScroll: true }); h.scrollIntoView({ block: 'start', behavior: reduce() ? 'auto' : 'smooth' }); };
  const openTo = (k: number) => { if (k > open) { open = k; openSet(page, k); } if (k > DEPTH_MAX[d]) { d = depthFor(k); depthSet(d); } draw(); focus(k); };
  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-ly-d],[data-ly-go],[data-ly-a]'); if (!b) return;
    if (b.dataset.lyD && okD(b.dataset.lyD)) { d = b.dataset.lyD; depthSet(d); if (DEPTH_MAX[d] > open) { open = DEPTH_MAX[d]; openSet(page, open); } draw(); return; }
    if (b.dataset.lyGo) { openTo(Number(b.dataset.lyGo)); return; }
    if (b.dataset.lyA === 'next') openTo(shown(open, d) + 1);
    else if (b.dataset.lyA === 'up') openTo(DEPTH_MAX[d] + 1);
  });
  draw();
  const demo = root.querySelector<HTMLElement>('[data-vf-part="demo"]'), chk = root.querySelector<HTMLElement>('[data-vf-part="check"]');
  void import('../vf/ui').then((m) => { if (demo?.isConnected) m.mount(demo, page, l, undefined, 'demo'); if (chk?.isConnected) m.mount(chk, page, l, undefined, 'check'); });
  const at = root.querySelector<HTMLElement>('[data-att]');
  if (at) void import('./att').then((m) => { if (at.isConnected) m.att(at, l); });
}
