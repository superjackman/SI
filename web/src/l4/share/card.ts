/* R40: the words of a knowledge-point share card, from a five-part card (shared by the card sheet and 享).
   Knowledge only: ② idea, ③ parts, ④ how, ⑤ why; `head` / `badge` add one honest line (a real milestone). */
import type { Card } from '../c/kc';
import { UI, tx, type L } from '../txt';
import type { Data } from './draw';

type T2 = readonly [string, string];
/** the layer a card belongs to: header tag and the share picture's layer line and colour */
export function lvOf(id: string): { tag: T2 | null; lv: T2; c: string; n: number } {
  if (id.startsWith('KM')) return { tag: ['第5层 · 数学', 'Layer 5 · maths'], lv: ['第5层 · 背后的数学', 'Layer 5 · The maths'], c: '#7c3aed', n: 5 };
  if (id.startsWith('KA')) return { tag: ['第1层 · 知识卡', 'Layer 1 · card'], lv: ['第1层 · 用户怎么用 AI 助手', 'Layer 1 · Using an AI assistant'], c: '#0891b2', n: 1 };
  if (id.startsWith('KB')) return { tag: ['第2层 · 知识卡', 'Layer 2 · card'], lv: ['第2层 · Agent 原理', 'Layer 2 · How an Agent works'], c: '#0d9488', n: 2 };
  if (id.startsWith('KC')) return { tag: ['第3层 · 知识卡', 'Layer 3 · card'], lv: ['第3层 · 大模型原理', 'Layer 3 · How an LLM works'], c: '#4f46e5', n: 3 };
  return { tag: null, lv: ['第4层 · Transformer 内部', 'Layer 4 · Inside a Transformer'], c: '#2563eb', n: 4 };
}
export const strip = (h: string) => { const d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
const WHY = /^(设计|为什么行得通|Design|Why it works)\s*/;
/** ⑤'s "why it works" line (else its design line, else its last line) */
export function whyOf(c: Card) {
  const why = document.createElement('div'); why.innerHTML = c.s[4]; const wl = Array.from(why.querySelectorAll('div')).map((x) => strip(x.innerHTML));
  return (wl.find((s) => /^(为什么行得通|Why it works)/.test(s)) ?? wl.find((s) => WHY.test(s)) ?? wl[wl.length - 1] ?? '').replace(WHY, '');
}
export function cardData(l: L, id: string, c: Card, url: string, site: string, head = '', badge = id): Data {
  const tmp = document.createElement('div'); tmp.innerHTML = c.s[2];
  const parts = Array.from(tmp.querySelectorAll('li')).slice(0, 3).map((li) => { const k = li.querySelector('.k')?.textContent ?? ''; return { n: k, s: (li.textContent ?? '').replace(k, '').replace(/^[：:\s]+/, '') }; });
  const how = document.createElement('div'); how.innerHTML = c.s[3]; how.querySelectorAll('.ex,.sub').forEach((x) => x.remove());
  const why = document.createElement('div'); why.innerHTML = c.s[4]; const wl = Array.from(why.querySelectorAll('div')).map((x) => strip(x.innerHTML));
  return {
    site, url, lv: tx(lvOf(id).lv, l), lvC: lvOf(id).c, path: `${id} · ${tx(UI.kcT, l)}`, icon: '🧩', name: c.n, idea: strip(c.s[1]), parts,
    co: strip(how.innerHTML).slice(0, 160), why: (wl.find((s) => WHY.test(s)) ?? wl[wl.length - 1] ?? '').replace(WHY, '').slice(0, 160),
    head, badge, scan: tx(['扫码一层层看懂 AI', 'Scan to see AI layer by layer'], l), how: tx(['怎么配合', 'How it works'], l), whyT: tx(['为什么这么设计', 'Why so'], l),
  };
}
