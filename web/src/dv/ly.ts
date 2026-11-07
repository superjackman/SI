/* R52 layered body on every derivation station: one screen of the idea, then the picture, the numbers,
   the formula, and the quiz. Unlabeled dots mark how far the page is open; nothing on screen names a teaching
   procedure. The depth switch 30 秒 / 5 分钟 / 深入 caps what can be shown (1 / 3 / 5) and is remembered in
   localStorage, as is how far each page has been opened. Nothing here navigates, so it never adds a history entry.
   A lazy chunk: loaded only when a station with `ly` is opened. */
import './ly.css';
import { tx, type L } from '../l4/txt';
import type { Ly, Stage } from './types';
import { fillDvText } from './nums';
import { D_SM4, fmt, softmax } from '../vf/calc';
import { life } from './ill';
import { workedHtml } from './rail';
import { ML } from './mld';
import { DEMO } from '../vf/data';

import { LY_DEPTH, depthGet, depthSet, okD, type Depth } from './prog';

export { LY_DEPTH, depthGet, depthSet, type Depth };
export const LY_OPEN = 'si.ly.open';
/** how many layers each depth can show */
export const DEPTH_MAX: Readonly<Record<Depth, number>> = { s: 1, m: 3, d: 5 };
/** the smallest depth that shows layer k */
export const depthFor = (k: number): Depth => (k <= 1 ? 's' : k <= 3 ? 'm' : 'd');
const openAll = (): Record<string, number> => { try { const v = JSON.parse(localStorage.getItem(LY_OPEN) || '{}') as unknown; return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, number>) : {}; } catch { return {}; } };
/** how many layers of `page` the reader has opened (1–5) */
export const openGet = (page: string) => { const n = Number(openAll()[page]); return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 1; };
const openSet = (page: string, n: number) => { const o = openAll(); o[page] = n; try { localStorage.setItem(LY_OPEN, JSON.stringify(o)); } catch { /* private mode */ } };
/** layers shown = what was opened, capped by the depth */
export const shown = (open: number, d: Depth) => Math.max(1, Math.min(open, DEPTH_MAX[d]));

const NAME: readonly (readonly [string, string])[] = [['类比', 'Analogy'], ['图', 'Picture'], ['数字', 'Numbers'], ['公式', 'Formula'], ['小测', 'Check']];
/** depth labels stay in the source so both languages name the same three depths, even though the switch is not on the page */
export const DLAB: Readonly<Record<Depth, readonly [string, string]>> = { s: ['30 秒', '30 sec'], m: ['5 分钟', '5 min'], d: ['深入', 'Deep'] };

type Mk = (s: string) => string;
const P = (xs: string[], mk: Mk, c = '') => xs.map((x) => `<p${c ? ` class="${c}"` : ''}>${mk(x)}</p>`).join('');
const MOT = new Set(['6', '7', '8b', '9', '12']);

/* ---------- the pictures (pure html; the attention one is an animation in ./att) ---------- */
function picSm(l: L, mk: Mk) {
  const z = (a: string, b: string) => tx([a, b], l), p = softmax(D_SM4), lab = l === 'zh' ? ['蓝', '绿', '红', '天'] : ['blue', 'green', 'red', 'sky'];
  const rows = D_SM4.map((v, i) => `<div class="ly-smr"><span class="ly-sml">${lab[i]}</span><span class="ly-c ly-q ly-sms">${fmt(v, 1)}</span><span class="ly-sma" aria-hidden="true">→</span><span class="ly-smb"><i style="width:${Math.max(2, Math.round(100 * p[i]!))}%"></i></span><span class="ly-c ly-k ly-smp">${fmt(100 * p[i]!, 1)}%</span></div>`).join('');
  // the penalty curve −ln p on p ∈ (0, 1], the three probabilities the page talks about marked
  const X = (q: number) => 8 + q * 284, Y = (v: number) => 8 + (1 - Math.min(v, 3.5) / 3.5) * 84;
  let c = ''; for (let k = 0; k <= 60; k++) { const q = 0.03 + (0.97 * k) / 60; c += `${k ? 'L' : 'M'}${X(q).toFixed(1)} ${Y(-Math.log(q)).toFixed(1)}`; }
  const pts = [[0.0536, 'var(--bad)'], [p[0]!, 'var(--highlight)'], [0.998, 'var(--good)']] as const;
  const svg = `<svg class="ly-pen" viewBox="0 0 300 100" role="img" aria-label="${z('罚分曲线：概率越小，罚分越大', 'Penalty curve: the smaller the probability, the bigger the penalty')}"><line x1="8" y1="92" x2="292" y2="92" stroke="var(--link)"/><line x1="8" y1="8" x2="8" y2="92" stroke="var(--link)"/><path d="${c}" fill="none" stroke="var(--link)" stroke-width="2.5"/>${pts.map(([q, col]) => `<circle cx="${X(q).toFixed(1)}" cy="${Y(-Math.log(q)).toFixed(1)}" r="5" fill="${col}"/>`).join('')}</svg>`;
  const leg = [[`{#p0}`, `{#ce0}`, 'r'], [`${fmt(100 * p[0]!, 1)}%`, '`−ln 0.625 ≈ 0.47`', 'q'], [`{#p1}`, `{#ce1}`, 'k']].map(([a, b, c2]) => {
    const body = mk(fillDvText(`p=${a} → ${z('罚分', 'penalty')} ${b}`, l));
    // keep the trailing number with the arrow so 360px never leaves a one-glyph last line
    return `<li><span class="ly-dot ly-${c2}" aria-hidden="true"></span><span class="nw">${body}</span></li>`;
  }).join('');
  return `<div class="ly-sm" role="group" aria-label="softmax"><div class="ly-smh"><span>${z('候选', 'Token')}</span><span class="ly-c ly-q">${z('分数', 'Score')}</span><span></span><span class="ly-c ly-k">${z('softmax 后的概率', 'Probability after softmax')}</span></div>${rows}</div>
<p class="ly-cap">${z('罚分 = −ln p（横轴：给正确答案的概率 p，纵轴：罚分）', 'Penalty = −ln p (across: the probability p of the right answer; up: the penalty)')}</p>${svg}<ul class="ly-leg">${leg}</ul>`;
}
function picBowl(l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  const X = (w: number) => (w + 0.6) * 72, Y = (w: number) => 192 - (w + 0.4) * 72;
  const lv = [0.25, 1, 2.25, 4, 6], ell = lv.map((c, i) => `<ellipse cx="${X(2)}" cy="${Y(1)}" rx="${(Math.sqrt(c) * 72).toFixed(1)}" ry="${(Math.sqrt(c / 2) * 72).toFixed(1)}" fill="none" stroke="${i === lv.length - 1 ? 'var(--link)' : 'var(--link)'}" stroke-width="${i === lv.length - 1 ? 1.6 : 1.2}"/>`).join('');
  // gradient descent from (0, 0) with η = 0.1: both coordinates move in the same step
  const pts: [number, number][] = [[0, 0]]; for (let k = 0; k < 10; k++) { const [a, b] = pts[pts.length - 1]!; pts.push([a - 0.1 * 2 * (a - 2), b - 0.1 * 4 * (b - 1)]); }
  const path = pts.map(([a, b], k) => `${k ? 'L' : 'M'}${X(a).toFixed(1)} ${Y(b).toFixed(1)}`).join('');
  const s = 0.15, x0 = X(0), y0 = Y(0), dx = 4 * s * 72, dy = 4 * s * 72;
  const ar = (id: string, c: string) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`;
  return `<svg class="ly-bowl" viewBox="0 0 300 200" role="img" aria-label="${z('碗形损失的俯视图：负梯度由两个偏导合成', 'The bowl-shaped loss from above: the negative gradient is made of the two partial derivatives')}"><defs>${ar('ly-aq', 'var(--highlight)')}${ar('ly-ak', 'var(--good)')}${ar('ly-av', 'var(--link)')}</defs>
<line x1="${x0}" y1="196" x2="${x0}" y2="4" stroke="var(--link)" stroke-dasharray="3 3"/><line x1="4" y1="${y0}" x2="296" y2="${y0}" stroke="var(--link)" stroke-dasharray="3 3"/>${ell}
<path d="${path}" fill="none" stroke="var(--card)" stroke-width="1" stroke-dasharray="2 3"/>${pts.slice(1).map(([a, b]) => `<circle cx="${X(a).toFixed(1)}" cy="${Y(b).toFixed(1)}" r="2.6" fill="var(--card)"/>`).join('')}
<line x1="${x0}" y1="${y0}" x2="${x0 + dx}" y2="${y0}" stroke="var(--highlight)" stroke-width="3" marker-end="url(#ly-aq)"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 - dy}" stroke="var(--good)" stroke-width="3" marker-end="url(#ly-ak)"/><line x1="${x0}" y1="${y0}" x2="${x0 + dx}" y2="${y0 - dy}" stroke="var(--link)" stroke-width="3.5" marker-end="url(#ly-av)"/>
<circle cx="${x0}" cy="${y0}" r="4.5" fill="var(--bad-bg)"/><path d="M${X(2)} ${Y(1) - 7}l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" fill="var(--navy)"/></svg>
<ul class="ly-leg"><li><span class="ly-dot ly-r" aria-hidden="true"></span><span class="nw">${z('起点 (0,0)：横 w1 · 纵 w2', 'Start (0,0); across w1, up w2')}</span></li><li><span class="ly-dot ly-q" aria-hidden="true"></span><span class="nw">${z('只动 w1：−∂L/∂w1 = 4', 'Only w1: −∂L/∂w1 = 4')}</span></li><li><span class="ly-dot ly-k" aria-hidden="true"></span><span class="nw">${z('只动 w2：−∂L/∂w2 = 4', 'Only w2: −∂L/∂w2 = 4')}</span></li><li><span class="ly-dot ly-v" aria-hidden="true"></span><span class="nw">${z('合起来是负梯度 (4,4)，一步改两个', 'Together: negative gradient (4,4), one step')}</span></li><li><span class="ly-c ly-q" aria-hidden="true">★ </span><span class="nw">${z('碗底 (2, 1)', 'the bottom (2, 1)')}</span></li></ul>`;
}

function picXor(l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  const pts: [number, number, string][] = [[40, 40, '0,0→0'], [40, 140, '0,1→1'], [200, 40, '1,0→1'], [200, 140, '1,1→0']];
  const dots = pts.map(([x, y, lab]) => `<circle cx="${x}" cy="${y}" r="10" fill="${lab.endsWith('0') ? 'var(--bad)' : 'var(--good)'}"/><text x="${x}" y="${y + 28}" text-anchor="middle" fill="var(--link)" font-size="11">${lab}</text>`).join('');
  return `<svg class="ly-xor" viewBox="0 0 280 190" role="img" aria-label="${z('XOR：一条直线分不开', 'XOR: one line cannot separate')}"><rect x="8" y="8" width="264" height="174" rx="8" fill="var(--card)" stroke="var(--link)"/>${dots}<line x1="20" y1="160" x2="220" y2="30" stroke="var(--highlight)" stroke-width="2" stroke-dasharray="4 3"/><text x="140" y="100" text-anchor="middle" fill="var(--navy)" font-size="12">${z('直线切不开', 'a line fails')}</text></svg>
<ul class="ly-leg"><li><span class="ly-dot ly-k" aria-hidden="true"></span>${z('输出 1', 'output 1')}</li><li><span class="ly-dot ly-r" aria-hidden="true"></span>${z('输出 0', 'output 0')}</li><li><span class="ly-c ly-q" aria-hidden="true">— </span>${z('任意直线都会把某一类切错', 'any straight cut misclassifies one class')}</li></ul>`;
}
function picDot(l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  return `<svg class="ly-dotp" viewBox="0 0 300 160" role="img" aria-label="${z('两个向量的点积', 'Dot product of two vectors')}"><line x1="40" y1="120" x2="260" y2="120" stroke="var(--link)"/><line x1="40" y1="120" x2="40" y2="20" stroke="var(--link)"/>
<line x1="40" y1="120" x2="160" y2="50" stroke="var(--highlight)" stroke-width="3" marker-end="url(#ly-aq)"/><line x1="40" y1="120" x2="200" y2="90" stroke="var(--good)" stroke-width="3"/>
<text x="170" y="45" fill="var(--navy)" font-size="12">q</text><text x="210" y="95" fill="var(--good)" font-size="12">k</text>
<text x="150" y="145" text-anchor="middle" fill="var(--link)" font-size="12">${z('方向越近，点积越大', 'closer directions → larger dot product')}</text>
<defs><marker id="ly-aq" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--navy)"/></marker></defs></svg>`;
}

function picBlk(l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  return `<div class="ly-blk" role="group" aria-label="${z('一个解码块', 'One decoder block')}"><div class="ly-bx">${z('输入：每个词一串数（词向量）', 'In: one list of numbers per word (word vectors)')}</div>
<div class="ly-bs"><span class="ly-bn">${z('× N 层', '× N layers')}</span>
<div class="ly-br c">${z('归一化', 'Normalise')}</div><div class="ly-br q">${z('多头注意力：词和词交流', 'Multi-head attention: words talk')}<small class="ly-c ly-r">${z('位置：RoPE 旋转 q、k', 'Position: RoPE rotates q, k')}</small></div><div class="ly-ba">${z('⊕ 加回输入（残差）', '⊕ add back the input (residual)')}</div>
<div class="ly-br c">${z('归一化', 'Normalise')}</div><div class="ly-br k">${z('FFN：每个词各自消化', 'FFN: each word thinks alone')}</div><div class="ly-ba">${z('⊕ 加回（残差）', '⊕ add back (residual)')}</div></div>
<div class="ly-bx">${z('输出头 → 下一个词元的概率', 'Output head → probability of the next token')}</div></div>`;
}

/** break a programmer's note into indented pseudo-code lines instead of one paragraph */
const codeLines = (s: string) => {
  let out = '';
  let depth = 0;
  let brace = 0;
  const nl = () => { out += '\n' + '  '.repeat(brace); };
  for (const c of s) {
    if (c === '(' || c === '（' || c === '[' || c === '⟦') depth++;
    else if (c === ')' || c === '）' || c === ']' || c === '⟧') depth = Math.max(0, depth - 1);
    if (c === '{') { brace++; out += ' {'; nl(); continue; }
    if (c === '}') { brace = Math.max(0, brace - 1); nl(); out += '}'; nl(); continue; }
    if ((c === ';' || c === '；') && depth === 0) { out += c; nl(); continue; }
    if (c === ' ' && (out.endsWith('\n') || out.endsWith('  '))) continue;
    out += c;
  }
  return out.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim()).join('\n');
};
const norm = (s: string) => s.replace(/<[^>]+>/g, '').replace(/⟦[a-z]:([^⟧]*)⟧/g, '$1').replace(/[`*]/g, '').replace(/\{#[^}]+\}/gi, '').replace(/\s+/g, '').replace(/[，。、：；！？,.!?:;“”"'（）()【】\-—–]/g, '');
const MOTIF = [/大雾/, /雾里/, /蒙着/, /下山/, /大碗/, /碗底/, /碗形/, /收音机/, /旋钮/, /纸条/, /罚分/, /天气预报/, /fog/i, /blindfold/i, /bowl/i];
const skipLine = (s: string) => /NumPy|数字层|看动画/.test(s) || s.includes('拖一') || s.includes('从图到') || (s.includes('同一件') && s.includes('写成图')) || s.includes('先自己');
const fxPlain = (s: string) => s.replace(/⟦[a-z]:([^⟧]*)⟧/g, '$1').replace(/[`*]/g, '').replace(/\{#[^}]+\}/gi, '').replace(/\s+/g, ' ').trim();
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** one chapter: picture, experiment and its step, the formula once, why the other ways fail, then code */
export function html(S: Stage & { ly: Ly }, page: string, l: L, mk: Mk, exK: string): string {
  void exK;
  const Y = S.ly;
  const key = page.replace(/^D\//, '');
  const own = life(key, l);
  const pic = Y.pic === 'sm' ? picSm(l, mk) : Y.pic === 'bowl' ? picBowl(l) : Y.pic === 'blk' ? picBlk(l) : Y.pic === 'xor' ? picXor(l) : Y.pic === 'dot' ? picDot(l) : Y.pic === 'att' ? `<div class="ly-att" data-att="1"></div>` : own;
  const mot = MOT.has(key) ? `<div class="ly-mot" data-mot="${key}"></div>` : '';
  const seen: string[] = [];
  const motifs = new Set<string>();
  const note = (s: string) => {
    const n = norm(s);
    if (n.length >= 8) seen.push(n);
    for (const r of MOTIF) if (r.test(s)) motifs.add(r.source);
  };
  const fresh = (s: string, motif: boolean) => {
    const n = norm(s);
    if (n.length >= 12) {
      for (const p of seen) {
        if (p === n) return false;
        const short = p.length < n.length ? p : n;
        const long = p.length < n.length ? n : p;
        if (short.length >= 18 && long.includes(short)) return false;
      }
    }
    if (motif) for (const r of MOTIF) if (r.test(s) && motifs.has(r.source)) return false;
    return true;
  };
  const keep = (s: string, motif: boolean) => {
    if (!s.trim() || skipLine(s)) return false;
    if (!fresh(s, motif)) return false;
    note(s);
    return true;
  };
  note(Y.hook);
  const an = Y.an.filter((x) => keep(x, true));
  const labeled = Y.pic === 'sm' || Y.pic === 'bowl' || Y.pic === 'xor' || Y.pic === 'dot' || Y.pic === 'blk';
  const caps = labeled ? [] : Y.pc.filter((x) => keep(x, true));
  let stepSrc = '';
  if (key !== '2') for (const c of [...Y.num, ...S.x]) if (keep(c, false)) { stepSrc = c; break; }
  const g0 = ML[key]?.goals[0];
  let lead = l === 'en' ? 'That step, written as a formula.' : '把这一步写成式子，是这样。';
  if (g0) {
    const raw = fillDvText(tx(g0.why[g0.a]!, l), l).replace(/`[^`]*`/g, '').replace(/\*\*/g, '');
    const bit = raw.split(/[。！？.!?]/)[0]?.trim() ?? '';
    const line = bit ? (l === 'en' ? `${bit}.` : `${bit}。`) : '';
    if (line && keep(line, false)) lead = line;
  }
  for (const f of Y.fx) note(fxPlain(f));
  const why: string[] = [];
  for (const g of ML[key]?.goals ?? []) g.why.forEach((w, i) => {
    if (i === g.a) return;
    const s = fillDvText(tx(w, l), l);
    if (keep(s, false)) why.push(s);
  });
  const codeLead = l === 'en' ? 'In a program, that is the same step.' : '放到程序里，还是这一步。';
  const code = codeLines(Y.jv).split('\n').map((line) => { const pad = line.match(/^ */)?.[0] ?? ''; return pad + mk(line); }).join('\n');
  const H = (zh: string, en: string) => `<h2 class="st-sec">${l === 'en' ? en : zh}</h2>`;
  const flow = (xs: string[]) => {
    const bits = xs.map((s) => s.trim()).filter(Boolean);
    const groups: string[][] = [];
    let cur: string[] = [];
    for (const s of bits) {
      cur.push(s);
      if (cur.length >= 2 || s.length > 90) { groups.push(cur); cur = []; }
    }
    if (cur.length) groups.push(cur);
    return groups.map((g) => `<p>${g.map(mk).join('')}</p>`).join('');
  };
  const hasDemo = !!DEMO[`D/${key}`];
  const twin = new Set(['bowl', 'xor', 'fit', 'slope', 'shelf', 'dot', 'lora', 'cache', 'knob', 'book']);
  const showStill = !hasDemo || !twin.has(Y.pic);
  const still = showStill ? `<div class="st-fig" data-fig="pic-${Y.pic}">${pic}${P(caps, mk, 'ly-cap')}</div>` : '';
  const motFig = MOT.has(key) ? `<div class="st-fig" data-fig="mot-${key}">${mot}</div>` : '';
  const exp = `<div class="${hasDemo ? 'st-fig' : 'st-step'}" ${hasDemo ? 'data-fig="exp"' : ''}><div class="vf-slot" id="fig" data-vf-part="demo"></div>${workedHtml(key, l, stepSrc ? mk(stepSrc) : '')}</div>`;
  const figure = still + motFig + exp;
  const symBits = Y.fe.map((raw) => {
    const plain = raw.replace(/⟦[a-z]:([^⟧]*)⟧/g, '$1').replace(/[`*]/g, '').trim();
    const bits = plain.split(/[：:]/);
    if (bits.length < 2) return plain;
    const name = bits[0]!.trim(), rest = bits.slice(1).join(l === 'en' ? ': ' : '：').trim();
    return l === 'en' ? `${name} is ${rest}` : `${name}是${rest}`;
  }).filter(Boolean);
  const symSentence = symBits.length
    ? (l === 'en' ? `Here ${symBits.join('; ')}.` : `其中${symBits.join('，')}。`)
    : '';
  const symHtml = symSentence.length > 160
    ? `<dl class="fx-def">${Y.fe.map((raw) => {
        const plain = raw.replace(/⟦[a-z]:([^⟧]*)⟧/g, '$1').replace(/[`*]/g, '').trim();
        const bits = plain.split(/[：:]/);
        const name = (bits[0] ?? plain).trim();
        const rest = bits.slice(1).join(l === 'en' ? ': ' : '：').trim();
        return rest ? `<div><dt>${esc(name)}</dt><dd>${esc(rest)}</dd></div>` : `<div><dt></dt><dd>${esc(plain)}</dd></div>`;
      }).join('')}</dl>`
    : (symSentence ? `<p>${esc(symSentence)}</p>` : '');
  const shownFx = Y.fx.filter((f) => /[=←≈]/.test(fxPlain(f)));
  const displayFx = shownFx.length ? shownFx : Y.fx.slice(0, 1);
  const aside = Y.fx.filter((f) => !displayFx.includes(f)).map((f) => fxPlain(f)).filter(Boolean);
  const tail = [symSentence, ...aside].filter(Boolean).join(l === 'en' ? ' ' : '');
  const explain = tail.length > 180 ? symHtml : (tail ? `<p>${esc(tail)}</p>` : '');
  const formulas = displayFx.map((f, i) => {
    const before = i === 0 ? lead : (l === 'en' ? 'The same relation, written once more.' : '同一个关系，再写成一种。');
    const after = i === displayFx.length - 1 ? explain : '';
    return `<p>${esc(before)}</p><p class="formula fx-line">${esc(fxPlain(f))}</p>${after}`;
  }).join('');
  const qSlot = (i: number) => `<div class="st-q" data-vf-part="check" data-vf-i="${i}"></div>`;
  const L5 = [
    `${H('这一步在做什么', 'What this step is doing')}<div data-ask="by"></div><p class="ly-hook">${mk(Y.hook)}</p>${flow(an)}`,
    `${H('看一看', 'Look')}${figure}<div data-ask="num"></div>`,
    `${H('用符号写下来', 'In symbols')}<div class="ly-fx" id="formula">${formulas}</div>${qSlot(0)}`,
    `${H('另外的办法为什么不行', 'Why the other ways fail')}${why.length ? flow(why) : ''}<div data-ask="pred"></div><div data-vf-part="myth"></div>${qSlot(1)}<p>${esc(codeLead)}</p><pre class="st-code" id="code"><code>${code}</code></pre>${qSlot(2)}`,
    `${H('换种办法会怎样', 'What if you chose another way')}${qSlot(3)}<div data-ask="choice"></div>`,
  ];
  const secs = L5.map((b, k) => `<section class="ly-l" data-ly="${k + 1}"><h3 class="ly-h" tabindex="-1"></h3>${b}</section>`).join('');
  return `<div class="ly" data-ly-page="${page}" lang="${l === 'en' ? 'en' : 'zh-CN'}">${secs}<div class="ly-nx"></div></div>`;
}

/** wire the layered body inside `host`: depth, 懂了 → next layer, the bar, the two 验证 parts, the pictures */
export function wire(host: HTMLElement, page: string, l: L) {
  const root = host.querySelector<HTMLElement>('.ly'); if (!root) return;
  const z = (a: string, b: string) => tx([a, b], l);
  let d = depthGet(), open = openGet(page);
  const reduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
  const draw = () => {
    const v = shown(open, d), max = DEPTH_MAX[d];
    root.dataset.depth = d; root.dataset.shown = '5';
    root.querySelectorAll<HTMLElement>('.ly-l').forEach((s) => { s.hidden = false; });
    root.querySelectorAll<HTMLElement>('[data-ly-d]').forEach((b) => { const on = b.dataset.lyD === d; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
    root.querySelectorAll<HTMLElement>('[data-ly-go]').forEach((b) => {
      const k = Number(b.dataset.lyGo); b.className = k < v ? 'done' : k === v ? 'on' : k <= max ? 'off' : 'out';
      b.setAttribute('aria-label', `${tx(NAME[k - 1]!, l)}${k <= v ? z('，已展开', ', open') : k <= max ? '' : z('，在更深一档', ', in a deeper setting')}`);
      if (k === v) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    const nx = root.querySelector<HTMLElement>('.ly-nx');
    if (nx) nx.innerHTML = '';
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
  const demo = root.querySelector<HTMLElement>('[data-vf-part="demo"]');
  void import('../vf/ui').then(async (m) => {
    if (demo?.isConnected) m.mount(demo, page, l, undefined, 'demo');
    const ids = (await import('../vf/ids')).VF_Q[page] ?? [];
    root.querySelectorAll<HTMLElement>('[data-vf-i]').forEach((slot) => {
      const id = ids[Number(slot.dataset.vfI)];
      if (!id || !slot.isConnected) { slot.remove(); return; }
      m.mount(slot, page, l, undefined, 'check', { ids: [id] });
    });
    const myth = root.querySelector<HTMLElement>('[data-vf-part="myth"]');
    if (myth?.isConnected) m.mount(myth, page, l, undefined, 'check', { myths: true });
  });
  const at = root.querySelector<HTMLElement>('[data-att]');
  if (at) void import('./att').then((m) => { if (at.isConnected) m.att(at, l); });
  const motEl = root.querySelector<HTMLElement>('[data-mot]');
  if (motEl) void import('./motion').then((m) => { if (motEl.isConnected) m.mount(motEl, motEl.dataset.mot ?? '', l); });
}
