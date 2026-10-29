/* R39: the small diagrams on the knowledge cards of layers 1, 2 and 3 (the part the card covers is lit). */
import type { L } from '../l4/txt';
type T2 = readonly [string, string];
const tx = (t: T2, l: L) => (l === 'en' ? t[1] : t[0]);
const SH = (c: string) => ` style="filter:drop-shadow(0 0 3px ${c})"`;
function b(x: number, y: number, w: number, h: number, t: string, on: boolean, orc = false) {
  const [f, st, tc] = orc ? (on ? ['#3b1f0a', '#ff9a3c', '#ffe2c4'] : ['#160d08', '#6a4a2a', '#c0a080']) : on ? ['#2350c8', '#d6ecff', '#ffffff'] : ['#0a1430', '#2a3c6c', '#7d8db8'];
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${f}" stroke="${st}" stroke-width="${on ? 1.6 : 1}"${on ? SH(st!) : ''}/><text x="${x + w / 2}" y="${y + h / 2 + 4.3}" text-anchor="middle" font-size="12" font-weight="${on ? 700 : 400}" fill="${tc}"${squeeze(t, w)}>${t}</text>`;
}
function fr(x: number, y: number, w: number, h: number, t: string, on: boolean) {
  const c = on ? '#9cc8ff' : '#34509a';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="none" stroke="${c}" stroke-width="${on ? 1.6 : 1}"${on ? SH(c) : ' stroke-dasharray="4 3"'}/><text x="${x + w / 2}" y="${y + 14}" text-anchor="middle" font-size="12" font-weight="700" fill="${on ? '#ffffff' : '#8fa8e0'}">${t}</text>`;
}
const a = (d: string, on: boolean) => `<path d="${d}" fill="none" stroke="${on ? '#8fe3ff' : '#4a6ab8'}" stroke-width="${on ? 1.8 : 1.1}" marker-end="url(#lxk${on ? 1 : 0})"/>`;
/** keep 12px text inside narrow boxes: squeeze glyph spacing instead of shrinking */
const squeeze = (t: string, w: number) => { const est = [...t].reduce((a, ch) => a + (ch.charCodeAt(0) > 0x2e80 ? 12 : 6.9), 0); return est > w - 6 ? ` textLength="${w - 6}" lengthAdjust="spacingAndGlyphs"` : ''; };
const MK = '<defs><marker id="lxk0" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#4a6ab8"/></marker><marker id="lxk1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#8fe3ff"/></marker></defs>';
const N1: Record<string, T2> = { you: ['你', 'You'], ag: ['AI 助手', 'AI assistant'], llm: ['大模型', 'LLM'], pla: ['规划', 'Plan'], mem: ['记忆', 'Memory'], loop: ['循环', 'Loop'], tf: ['工具箱', 'Toolbox'], t1: ['查车次', 'Trains'], t2: ['下单', 'Order'], t3: ['付款', 'Pay'], cf: ['需确认', 'Confirm'] };
const N2: Record<string, T2> = { per: ['感知', 'Perceive'], pla: ['规划', 'Plan'], mem: ['记忆', 'Memory'], llm: ['大模型', 'LLM'], obs: ['观察', 'Observe'], too: ['调工具', 'Tools'] };
const N3: Record<string, T2> = { t1: ['海量文字', 'Lots of text'], t2: ['分词字典', 'Vocabulary'], t3: ['预训练', 'Pre-training'], t4: ['微调', 'Fine-tuning'], t5: ['对齐', 'Alignment'], par: ['模型参数', 'Parameters'], u1: ['你的文字进来', 'Your text in'], u2: ['分词', 'Tokenize'], u3: ['Transformer', 'Transformer'], u4: ['得到下一个字', 'Next character'], u5: ['接到末尾再来', 'Append, repeat'] };
export interface MiniSpec { mk: 'l1' | 'l2' | 'l3'; hl: string[]; ar?: string[]; fr?: boolean | string[] }
/** the card's small diagram as an SVG string (width 128) */
export function lxMini(c: MiniSpec, l: L): string {
  const s: string[] = [], on = (k: string) => c.hl.includes(k), ao = (k: string) => (c.ar ?? []).includes(k); let H: number;
  if (c.mk === 'l1') {
    const n = (k: string) => tx(N1[k]!, l);
    s.push(b(34, 4, 60, 20, n('you'), on('you')), a('M58 24 V31', ao('a1')), a('M70 31 V25', ao('a4')), fr(2, 33, 124, 80, n('ag'), on('ag')));
    for (const [k, x, y] of [['llm', 8, 54], ['pla', 66, 54], ['mem', 8, 84], ['loop', 66, 84]] as const) s.push(b(x, y, 54, 22, n(k), on(k)));
    s.push(a('M64 113 V124', ao('a3')), fr(2, 126, 124, 78, n('tf'), on('tf')), b(8, 147, 54, 22, n('t1'), on('t1')), b(66, 147, 54, 22, n('t2'), on('t2')), b(8, 176, 54, 22, n('t3'), on('t3')), b(66, 176, 54, 22, n('cf'), on('cf'), true));
    H = 208;
  } else if (c.mk === 'l2') {
    const n = (k: string) => tx(N2[k]!, l);
    s.push(b(34, 2, 60, 22, n('per'), on('per')), b(80, 34, 46, 22, n('pla'), on('pla')), b(2, 34, 50, 22, n('mem'), on('mem')), b(30, 64, 68, 34, n('llm'), on('llm')), b(2, 106, 58, 22, n('obs'), on('obs')), b(72, 106, 54, 22, n('too'), on('too')));
    s.push(a('M94 13 Q103 13 103 31', ao('r1')), a('M103 56 V103', ao('r2')), a('M72 117 H63', ao('r3')), a('M25 106 V59', ao('r4')), a('M25 34 Q25 13 31 13', ao('r5')));
    for (const d of ['M64 24 V62', 'M80 49 L84 62', 'M50 49 L46 62', 'M52 106 L54 98', 'M80 106 L76 98']) s.push(`<path d="${d}" stroke="#4a6ab8" stroke-width="1" stroke-dasharray="2 2"/>`);
    if (on('loop')) s.push(`<text x="64" y="146" text-anchor="middle" font-size="12" fill="#ffd77a">${tx(['↺ 转到完成', '↺ until done'], l)}</text>`);
    H = on('loop') ? 150 : 132;
  } else {
    const bw = 104, bh = 16, g = 3, x = 14, pos: Record<string, number> = {}, f: Record<string, number> = {}, frs = Array.isArray(c.fr) ? c.fr : []; let y = 2;
    f.t = y; y += 4; for (const k of ['t1', 't2', 't3', 't4', 't5']) { pos[k] = y; y += bh + g; }
    f.te = y; y += 6; pos.par = y; y += bh + g + 3; f.u = y; y += 4;
    for (const k of ['u1', 'u2', 'u3', 'u4', 'u5']) { pos[k] = y; y += bh + g; }
    f.ue = y; H = y + 3;
    for (const k of ['t', 'u']) { const o = frs.includes(k); s.push(`<rect x="4" y="${f[k]}" width="120" height="${f[k + 'e']! - f[k]!}" rx="6" fill="none" stroke="${o ? '#9cc8ff' : '#34509a'}" stroke-width="${o ? 1.6 : 1}"${o ? '' : ' stroke-dasharray="4 3"'}/>`); }
    const xr = x + bw + 4; s.push(`<path d="M${x + bw} ${pos.par! + bh / 2} H${xr} V${pos.u3! + bh / 2} H${x + bw + 1}" fill="none" stroke="#8a7440" stroke-dasharray="3 2"/>`, `<path d="M${x} ${pos.u5! + bh / 2} H${x - 5} V${pos.u1! + bh / 2} H${x}" fill="none" stroke="#4a6ab8"/>`);
    for (const k of ['t1', 't2', 't3', 't4', 't5', 'par', 'u1', 'u2', 'u3', 'u4', 'u5']) {
      const o = on(k), [fi, st, tc] = o ? ['#2350c8', '#d6ecff', '#ffffff'] : k === 'par' ? ['#1a1406', '#8a7440', '#c8b07a'] : ['#0a1430', '#2a3c6c', '#7d8db8'];
      s.push(`<rect x="${x}" y="${pos[k]}" width="${bw}" height="${bh}" rx="5" fill="${fi}" stroke="${st}" stroke-width="${o ? 1.6 : 1}"${o ? SH(st!) : ''}/><text x="${x + bw / 2}" y="${pos[k]! + 12.2}" text-anchor="middle" font-size="12" font-weight="${o ? 700 : 400}" fill="${tc}"${squeeze(tx(N3[k]!, l), bw)}>${tx(N3[k]!, l)}</text>`);
    }
  }
  return `<svg class="l4-mini lx-mini" width="128" height="${H}" viewBox="0 0 128 ${H}" aria-hidden="true">${MK}${s.join('')}</svg>`;
}
