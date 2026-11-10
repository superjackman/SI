/* Hands-on lab for the attention / block / pretraining stations. The model loads only here. */
import { tx, type L } from '../l4/txt';

export function mount(host: HTMLElement, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  host.innerHTML = `<div class="lab-say">${z('这是一个很小的、只有一层的 Transformer。先看它还没学时怎么接，再训练，看误差下降，然后用同一个开头再接一次。', 'This is a tiny one-layer Transformer. First see how it continues before it has learned, then train, watch the error fall, and continue the same opening again.')}</div>
<div class="lab-row"><button type="button" class="l4-b ui-sec on" data-gpt-scene="poem">${z('静夜思', 'The poem')}</button><button type="button" class="l4-b ui-sec" data-gpt-scene="day">${z('日常的话', 'Everyday lines')}</button></div>
<div class="loss-box"><span class="loss-y">${z('误差', 'error')}</span><svg class="gpt-loss" viewBox="0 0 440 90" role="img" aria-label="${z('误差曲线', 'Error curve')}"></svg><span class="loss-x">${z('步数', 'steps')}</span></div>
<div class="lab-row"><span class="lab-read" data-gpt-read>${z('还没开始', 'Not started')}</span><button type="button" class="l4-b ui-pri" data-gpt="start">${z('开始训练', 'Start training')}</button><button type="button" class="l4-b ui-sec" data-gpt="pause">${z('暂停', 'Pause')}</button></div>
<div class="lab-row"><input class="lab-in" data-gpt-prompt value="${l === 'en' ? 'the cat' : '床前'}" aria-label="${z('开头几个字', 'Opening characters')}"><span class="lab-read">${z('温度', 'temperature')}</span><input type="range" min="0.2" max="1.4" step="0.1" value="0.4" data-gpt-temp><button type="button" class="l4-b ui-sec" data-gpt="go">${z('接着写', 'Continue')}</button></div>
<div class="lab-pair"><div><b>${z('还没学', 'Before training')}</b><div class="lab-read" data-gpt-before></div></div><div><b>${z('学过以后', 'After training')}</b><div class="lab-read" data-gpt-after></div></div></div>
<div class="lab-cap" data-gpt-cap>${z('格子越深，左边这个字越在看上面对应的那个字。点一个字，看它最在看谁。', 'A darker cell means the character on the left is looking harder at the one above. Click a character to see who it looks at most.')}</div>
<div class="gpt-heat" role="img" aria-label="${z('注意力', 'Attention')}"></div>`;
  const read = host.querySelector('[data-gpt-read]')!, before = host.querySelector('[data-gpt-before]')!, after = host.querySelector('[data-gpt-after]')!;
  const lossSvg = host.querySelector('.gpt-loss')!, heat = host.querySelector('.gpt-heat')!, cap = host.querySelector('[data-gpt-cap]')!;
  const lang = l === 'en' ? 'en' : 'zh';
  const worker = new Worker(new URL('./tiny-gpt.worker.ts', import.meta.url), { type: 'module' });
  let labels: string[] = [], att: number[][] = [], trained = 0;
  const drawLoss = (curve: number[]) => {
    const axis = `<line x1="8" y1="78" x2="430" y2="78" stroke="var(--ink)"/><line x1="8" y1="8" x2="8" y2="78" stroke="var(--ink)"/>`;
    if (curve.length < 2) { lossSvg.innerHTML = axis; return; }
    const max = Math.max(...curve, 0.1), min = Math.min(...curve);
    const d = curve.map((v, i) => `${i ? 'L' : 'M'}${(8 + i * 410 / Math.max(1, curve.length - 1)).toFixed(1)} ${(78 - ((v - min) / (max - min || 1)) * 64).toFixed(1)}`).join(' ');
    lossSvg.innerHTML = `${axis}<path d="${d}" fill="none" stroke="var(--navy)" stroke-width="2"/>`;
  };
  const focus = (row: number) => {
    heat.querySelectorAll('[data-row]').forEach((el) => el.classList.toggle('hot', Number((el as HTMLElement).dataset.row) === row));
    const line = att[row] || [];
    let best = 0, bestA = -1;
    for (let j = 0; j <= row && j < line.length; j++) if ((line[j] || 0) > bestA) { bestA = line[j] || 0; best = j; }
    const who = labels[row] || '';
    const at = labels[best] || '';
    if (who) cap.textContent = z(`「${who}」最在看「${at}」。格子越深，看得越专心。`, `“${who}” looks most at “${at}”. A darker cell means a harder look.`);
  };
  const drawHeat = (next: number[][], labs: string[]) => {
    att = next; labels = labs;
    const n = Math.min(labs.length, 12);
    const head = `<span></span>${labs.slice(0, n).map((ch) => `<span>${ch}</span>`).join('')}`;
    let rows = '';
    for (let i = 0; i < n; i++) {
      const line = next[i] || [];
      let cells = '';
      for (let j = 0; j < n; j++) {
        const a = j <= i ? (line[j] || 0) : 0;
        cells += `<i data-row="${i}" style="opacity:${Math.max(0.12, a).toFixed(2)}"></i>`;
      }
      rows += `<span class="heat-ch" data-row="${i}" role="button" tabindex="0">${labs[i]}</span>${cells}`;
    }
    heat.innerHTML = `<div class="heat" style="grid-template-columns:auto repeat(${n}, 1.5em)">${head}${rows}</div>`;
    if (n) focus(n - 1);
  };
  const sample = (slot: 'before' | 'after') => {
    const prompt = host.querySelector<HTMLInputElement>('[data-gpt-prompt]')!.value;
    const temp = Number(host.querySelector<HTMLInputElement>('[data-gpt-temp]')!.value);
    worker.postMessage({ type: 'sample', prompt, temp, slot });
  };
  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data as { type: string; step: number; loss: number; curve: number[]; text: string; att: number[][]; labels: string[]; slot?: string };
    if (msg.type === 'reset') { trained = 0; read.textContent = z('还没开始', 'Not started'); drawLoss([]); after.textContent = ''; sample('before'); return; }
    if (msg.type === 'loss') { trained = msg.step; read.textContent = `${z('第', 'step ')}${msg.step}${z(' 步 · 误差 ', ' · error ')}${msg.loss.toFixed(3)}`; drawLoss(msg.curve); }
    if (msg.type === 'sample') {
      if (msg.slot === 'before') before.textContent = msg.text;
      else after.textContent = msg.text;
      drawHeat(msg.att, msg.labels);
    }
  };
  host.addEventListener('click', (e) => {
    const scene = (e.target as HTMLElement).closest<HTMLElement>('[data-gpt-scene]');
    if (scene) {
      host.querySelectorAll('[data-gpt-scene]').forEach((el) => el.classList.toggle('on', el === scene));
      const prompt = host.querySelector<HTMLInputElement>('[data-gpt-prompt]')!;
      prompt.value = scene.dataset.gptScene === 'day' ? (lang === 'en' ? 'today' : '今天') : (lang === 'en' ? 'the cat' : '床前');
      worker.postMessage({ type: 'scene', scene: scene.dataset.gptScene, lang });
      return;
    }
    const heatHit = (e.target as HTMLElement).closest<HTMLElement>('[data-row]');
    if (heatHit && heat.contains(heatHit)) { focus(Number(heatHit.dataset.row)); return; }
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-gpt]'); if (!b) return;
    const k = b.dataset.gpt;
    if (k === 'start') worker.postMessage({ type: 'start' });
    else if (k === 'pause') worker.postMessage({ type: 'pause' });
    else if (k === 'go') sample(trained > 0 ? 'after' : 'before');
  });
  drawLoss([]);
  worker.postMessage({ type: 'scene', scene: 'poem', lang });
}
