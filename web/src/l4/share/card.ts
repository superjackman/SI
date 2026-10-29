/* R40: the words of a knowledge-point share card, from a five-part card (shared by the card sheet and 享).
   Knowledge only: ② idea, ③ parts, ④ how, ⑤ why; `head` / `badge` add one honest line (a real milestone). */
import type { Card } from '../c/kc';
import { UI, tx, type L } from '../txt';
import type { Data } from './draw';

type T2 = readonly [string, string];
/** the layer a card belongs to: header tag and the share picture's layer line and colour */
export function lvOf(id: string): { tag: T2 | null; lv: T2; c: string; n: number } {
  if (id.startsWith('KM')) return { tag: ['第5层 · 知识卡', 'Layer 5 · card'], lv: ['第5层 · 背后的数学', 'Layer 5 · The maths behind it'], c: '#7c3aed', n: 5 };
  if (id.startsWith('KA')) return { tag: ['第1层 · 知识卡', 'Layer 1 · card'], lv: ['第1层 · 我怎么用 AI', 'Layer 1 · How I use AI'], c: '#0891b2', n: 1 };
  if (id.startsWith('KB')) return { tag: ['第2层 · 知识卡', 'Layer 2 · card'], lv: ['第2层 · AI 助手怎么工作', 'Layer 2 · How an AI assistant works'], c: '#0d9488', n: 2 };
  if (id.startsWith('KC')) return { tag: ['第3层 · 知识卡', 'Layer 3 · card'], lv: ['第3层 · 大模型怎么得来', 'Layer 3 · How a big model is made'], c: '#4f46e5', n: 3 };
  return { tag: ['第4层 · 知识卡', 'Layer 4 · card'], lv: ['第4层 · Transformer 内部', 'Layer 4 · Inside a Transformer'], c: '#2563eb', n: 4 };
}
export const strip = (h: string) => { const d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
const WHY = /^(设计|为什么行得通|Design|Why it works)\s*/;
/** ⑤'s "why it works" line (else its design line, else its last line) */
export function whyOf(c: Card) {
  const why = document.createElement('div'); why.innerHTML = c.s[4]; const wl = Array.from(why.querySelectorAll('div')).map((x) => strip(x.innerHTML));
  return (wl.find((s) => /^(为什么行得通|Why it works)/.test(s)) ?? wl.find((s) => WHY.test(s)) ?? wl[wl.length - 1] ?? '').replace(WHY, '');
}
/** hand-written plain points (the reference's two); other cards use their own ② parts */
const PTS: Record<string, [string[], string[]]> = {
  K06: [['几个头各算一套「该看谁」', '结果拼起来，再混合回原来大小', '每个头看什么，是训练自己学出来的'], ['Several heads each work out “who to look at”', 'Their results are joined, then mixed back to size', 'What each head looks for is learned in training']],
  KA04: [['先给模型看工具说明', '模型只写「调哪个、填什么」', '程序去执行，结果交回模型'], ['The model first reads the tool descriptions', 'It only writes “which tool, which inputs”', 'A program runs it and hands the result back']],
};
export function cardData(l: L, id: string, c: Card, url: string, site: string, head = '', badge = id): Data {
  const tmp = document.createElement('div'); tmp.innerHTML = c.s[2];
  const parts = Array.from(tmp.querySelectorAll('li')).slice(0, 3).map((li) => {
    // "<k>name</k>：text" → name / text; "<k>原始分数</k>（logits）：…" keeps the qualifier with the name; no colon → the whole line
    const t = (li.textContent ?? '').replace(/\s+/g, ' ').trim(), k = li.querySelector('.k')?.textContent ?? '', rest = t.replace(k, '');
    if (!k || /^\s*[：:]/.test(rest)) return { n: k, s: rest.replace(/^[：:\s]+/, '') };
    const i = t.search(/[：:]/); return i > 0 ? { n: t.slice(0, i).trim(), s: t.slice(i + 1).trim() } : { n: '', s: t };
  });
  const how = document.createElement('div'); how.innerHTML = c.s[3]; how.querySelectorAll('.ex,.sub').forEach((x) => x.remove());
  const why = document.createElement('div'); why.innerHTML = c.s[4]; const wl = Array.from(why.querySelectorAll('div')).map((x) => strip(x.innerHTML));
  return {
    site, url, lv: tx(lvOf(id).tag ?? lvOf(id).lv, l), lvC: lvOf(id).c, path: `${id} · ${tx(UI.kcT, l)}`, icon: '🧩', name: c.n, idea: strip(c.s[1]), parts,
    co: strip(how.innerHTML).slice(0, 160), why: (wl.find((s) => WHY.test(s)) ?? wl[wl.length - 1] ?? '').replace(WHY, '').slice(0, 160),
    pts: PTS[id]?.[l === 'en' ? 1 : 0] ?? parts.map((p) => { const s1 = p.s.split(/[；;。]\s*/)[0]!.trim(); return p.n ? `${p.n}${l === 'en' ? ': ' : '：'}${s1}` : s1; }),
    sub: tx(['一层层看懂 AI', 'AI, layer by layer'], l),
    head, badge, scan: tx(['扫码直达这张卡', 'Scan to open this card'], l), how: tx(['怎么配合', 'How it works'], l), whyT: tx(['为什么这么设计', 'Why so'], l),
  };
}
