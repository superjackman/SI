/* Short pictures on the 看懂大模型 path. They play when scrolled into view or when 重播 is tapped,
   then rest on the last frame so the text around them stays readable. prefers-reduced-motion and the
   设置 animation switch leave the last frame in place. */
import { tx, type L } from '../l4/txt';
import { animOn } from '../store/prefs';

export const MOTION_AT = ['6', '7', '8b', '9', '12'] as const;
const CAP: Record<(typeof MOTION_AT)[number], readonly [string, string]> = {
  '6': ['编号到表里取出一行，这一行就是这个词的向量。', 'The id picks one row. That row is the word’s vector.'],
  '7': ['记忆一个词一个词往后传，隔得远就淡。', 'Memory moves one word at a time. A far word fades.'],
  '8b': ['同一串数先和别的词交流，再各自消化，原稿加回来。', 'The numbers talk with other words, then each one digests, and the original is added back.'],
  '9': ['每个候选先有概率。可以总拿最高的，也可以按概率抽一个。', 'Each candidate has a probability. Take the top one, or draw one by that probability.'],
  '12': ['旧词的 K 和 V 留着，新词只算自己的一份。', 'Old K and V stay. The new word only computes its own.'],
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const chips = (xs: string[], on: number) => `<ol class="mv-chips">${xs.map((t, i) => `<li class="${i === on ? 'on' : ''}">${esc(t)}</li>`).join('')}</ol>`;
function fig(k: string, l: L): string {
  const zh = l !== 'en', label = esc(tx(CAP[k as (typeof MOTION_AT)[number]], l));
  if (k === '6') {
    return `<div class="mv-fig mv-lookup" role="img" aria-label="${label}"><b>${zh ? '猫' : 'cat'}</b><i class="mv-line" aria-hidden="true"></i>${chips([zh ? '0.8 · 0.1 · 0.6' : '0.8 · 0.1 · 0.6', zh ? '狗  0.7' : 'dog  0.7', zh ? '车  0.1' : 'car  0.1'], 0)}</div>`;
  }
  if (k === '7') return `<div class="mv-fig" role="img" aria-label="${label}">${chips(zh ? ['我', '很', '累'] : ['I', 'am', 'tired'], 2)}<i class="mv-line" aria-hidden="true"></i></div>`;
  if (k === '8b') return `<div class="mv-fig mv-stack" role="img" aria-label="${label}">${chips(zh ? ['输入', '交流', '消化', '加回'] : ['in', 'talk', 'digest', 'add back'], 3)}<i class="mv-line down" aria-hidden="true"></i></div>`;
  if (k === '9') {
    const lab = zh ? ['蓝', '灰', '白'] : ['blue', 'grey', 'white'], w = [78, 36, 14];
    return `<div class="mv-fig mv-bars" role="img" aria-label="${label}">${lab.map((t, i) => `<div><span>${esc(t)}</span><i class="mv-grow" style="width:${w[i]!}%"></i></div>`).join('')}</div>`;
  }
  return `<div class="mv-fig" role="img" aria-label="${label}">${chips(zh ? ['旧 K', '旧 V', '新'] : ['old K', 'old V', 'new'], 2)}<i class="mv-line" aria-hidden="true"></i></div>`;
}

export function mount(el: HTMLElement, k: string, l: L) {
  if (!MOTION_AT.includes(k as (typeof MOTION_AT)[number])) return;
  const key = k as (typeof MOTION_AT)[number];
  const z = (a: string, b: string) => tx([a, b], l);
  el.innerHTML = `${fig(key, l)}<p class="ly-mcap">${esc(tx(CAP[key], l))}</p><p class="ly-mnote" data-mot-note hidden></p><button type="button" class="l4-b" data-mot-go="replay">${esc(z('重播', 'Replay'))}</button>`;
  const note = el.querySelector<HTMLElement>('[data-mot-note]')!;
  const still = z('画面保持不动。', 'The picture stays still.');
  let played = false, timer = 0;
  const replay = () => {
    if (!animOn()) { el.classList.remove('play'); note.hidden = false; note.textContent = still; return; }
    note.hidden = true;
    if (timer) clearTimeout(timer);
    el.classList.remove('play'); void el.offsetWidth; el.classList.add('play');
    timer = window.setTimeout(() => { if (el.isConnected) el.classList.remove('play'); timer = 0; }, 2800);
  };
  el.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('[data-mot-go]')) return;
    e.stopPropagation(); played = true; replay();
  });
  const onAnim = () => { if (!el.isConnected) { removeEventListener('si-anim', onAnim); return; } if (!animOn()) el.classList.remove('play'); };
  addEventListener('si-anim', onAnim);
  if (animOn() && typeof IntersectionObserver === 'function') {
    const io = new IntersectionObserver((es) => {
      if (played || !es.some((x) => x.isIntersecting) || !el.isConnected || el.closest('[hidden]')) return;
      played = true; io.disconnect(); replay();
    }, { threshold: 0.5 });
    io.observe(el);
  } else if (!animOn()) { note.hidden = false; note.textContent = still; }
}
