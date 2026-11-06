/* Life scene first, then the same objects become the diagram. Tap eases; drag follows.
   The ten stops on 看懂大模型. Other stops keep the still picture. */
import { tx, type L } from '../l4/txt';
import { CAST_KEYS, ST6_ANG, castMath } from './cast';
import { life } from './ill';

export { ST6_ANG };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export const CAP: Record<string, readonly [string, string, string, string]> = {
  '6': ['户口编号，看不出谁住得近', 'ID numbers, no sense of who lives near whom', '猫和狗的方向靠近，车离得远', 'cat and dog point nearly the same way; the car does not'],
  '7': ['纸条越传越淡', 'A note that fades as it is passed', '回头看整句，不用把前面挤掉', 'Look back over the sentence, instead of squeezing the start out'],
  '8a': ['三个人，一束光打在其中一个身上', 'Three people, a light on one of them', '对得上的名牌分更高', 'A tag that matches scores higher'],
  '8b': ['几层楼叠在一起', 'Floors stacked into one building', '注意力、加回原稿、再各自消化', 'Attention, add the original back, then each word alone'],
  '9': ['下一格还空着', 'The next square is still empty', '看见前面的字，猜下一个', 'See the words so far and guess the next'],
  'E': ['同一张卷子才比得了分', 'The same paper, or the scores cannot be compared', '困惑度是犹豫，不是对不对', 'Perplexity is hesitation, not right or wrong'],
  '10': ['两张卡片，有人指向一张', 'Two cards, a hand pointing at one', '人选哪份更好', 'A person says which answer is better'],
  '11': ['大块冻住，角上贴一条', 'A large block frozen, a strip on the corner', '只暖旁边那条细路', 'Only the thin side path is warmed'],
  '12': ['问过的人记在本子上', 'People already asked stay in the notebook', 'K 和 V 不用再算一遍', 'K and V are not computed again'],
  '16': ['一根线串起几颗珠子', 'One thread through several beads', '从第 0 站走到这里', 'From stop 0 to here'],
};

export function morph(key: string, l: L): string {
  if (!CAST_KEYS.has(key)) return life(key, l);
  const cap = CAP[key]!, z = (a: string, b: string) => tx([a, b], l);
  return `<div class="dv-morph" data-morph="1" data-at="life" style="--m:0"><div class="dv-morn"><div class="dv-ma">${life(key, l)}</div><div class="dv-mb">${castMath(key, l)}</div></div>
<p class="dv-mcap"><span class="a">${esc(z(cap[0], cap[1]))}</span><span class="b">${esc(z(cap[2], cap[3]))}</span></p>
<label class="dv-msl"><span>${z('拖一下，从图到式子', 'Drag, from the picture to the diagram')}</span><input type="range" min="0" max="100" value="0" aria-label="${z('从图到式子', 'From the picture to the diagram')}"></label></div>`;
}

export function morphWire(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-morph]').forEach((box) => {
    if (box.dataset.wired) return; box.dataset.wired = '1';
    let frame = 0;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paint = (v: number) => {
      const x = Math.max(0, Math.min(1, v));
      box.style.setProperty('--m', x.toFixed(3));
      box.dataset.at = x >= 0.5 ? 'math' : 'life';
      const pct = String(Math.round(x * 100));
      const inp = box.querySelector<HTMLInputElement>('input');
      if (inp && inp.value !== pct) inp.value = pct;
      box.querySelector('.dv-ma svg')?.setAttribute('aria-hidden', x >= 0.5 ? 'true' : 'false');
      box.querySelector('.dv-mb svg')?.setAttribute('aria-hidden', x >= 0.5 ? 'false' : 'true');
    };
    const go = (to: number) => {
      cancelAnimationFrame(frame);
      const from = Number(box.style.getPropertyValue('--m')) || 0;
      if (reduce || Math.abs(to - from) < 0.01) { paint(to); return; }
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / 420);
        const e = k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2;
        paint(from + (to - from) * e);
        if (k < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };
    box.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('input, label')) return;
      const cur = Number(box.style.getPropertyValue('--m')) || 0;
      go(cur > 0.5 ? 0 : 1);
    });
    box.querySelector('input')?.addEventListener('input', (e) => {
      cancelAnimationFrame(frame);
      paint(Number((e.target as HTMLInputElement).value) / 100);
    });
  });
}
