/* Hands-on lab for the attention / block / pretraining stations. The model loads only here. */
import { tx, type L } from '../l4/txt';

export function mount(host: HTMLElement, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  host.innerHTML = `<p class="lab-say">${z('这是一个很小的、只有一层的 Transformer。它在几句短话上现学现用：床前明月光，和几句日常的话。按开始训练，看损失下降，再让它接着写。', 'This is a tiny one-layer Transformer. It learns a few short lines live, including a public-domain poem. Start training, watch the loss fall, then let it continue a line.')}</p>
<svg class="gpt-loss" viewBox="0 0 440 80" role="img" aria-label="${z('损失曲线', 'Loss curve')}"></svg>
<div class="lab-row"><span class="lab-read" data-gpt-read>${z('还没开始', 'Not started')}</span><button type="button" class="l4-b ui-pri" data-gpt="start">${z('开始训练', 'Start training')}</button><button type="button" class="l4-b ui-sec" data-gpt="pause">${z('暂停', 'Pause')}</button></div>
<div class="lab-row"><input class="lab-in" data-gpt-prompt value="${z('床前', '床前')}" aria-label="${z('开头几个字', 'Opening characters')}"><span class="lab-read">${z('温度', 'temperature')}</span><input type="range" min="0.2" max="1.4" step="0.1" value="0.8" data-gpt-temp><button type="button" class="l4-b ui-sec" data-gpt="go">${z('接着写', 'Continue')}</button></div>
<p class="lab-read" data-gpt-out></p>
<svg class="gpt-heat" viewBox="0 0 440 160" role="img" aria-label="${z('注意力', 'Attention')}"></svg>`;
  const read = host.querySelector('[data-gpt-read]')!, out = host.querySelector('[data-gpt-out]')!, lossSvg = host.querySelector('.gpt-loss')!, heat = host.querySelector('.gpt-heat')!;
  const worker = new Worker(new URL('./tiny-gpt.worker.ts', import.meta.url), { type: 'module' });
  const drawLoss = (curve: number[]) => {
    if (curve.length < 2) { lossSvg.innerHTML = ''; return; }
    const max = Math.max(...curve, 0.1), min = Math.min(...curve);
    const d = curve.map((v, i) => `${i ? 'L' : 'M'}${(20 + i * 400 / Math.max(1, curve.length - 1)).toFixed(1)} ${(70 - ((v - min) / (max - min || 1)) * 56).toFixed(1)}`).join(' ');
    lossSvg.innerHTML = `<path d="${d}" fill="none" stroke="var(--navy)" stroke-width="2"/>`;
  };
  const drawHeat = (att: number[][], labels: string[]) => {
    const n = Math.min(labels.length, 12);
    const cell = Math.min(28, 400 / Math.max(1, n));
    let body = '';
    for (let i = 0; i < n; i++) {
      body += `<text x="4" y="${18 + i * cell}" fill="var(--ink)" font-size="12">${labels[i]}</text>`;
      const row = att[i] || [];
      for (let j = 0; j < n; j++) {
        const a = row[j] || 0;
        body += `<rect x="${28 + j * cell}" y="${6 + i * cell}" width="${cell - 2}" height="${cell - 2}" fill="var(--navy)" opacity="${Math.max(0.06, a).toFixed(2)}"/>`;
      }
    }
    heat.setAttribute('viewBox', `0 0 440 ${Math.max(40, 12 + n * cell)}`);
    heat.innerHTML = body;
  };
  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data as { type: string; step: number; loss: number; curve: number[]; text: string; att: number[][]; labels: string[] };
    if (msg.type === 'loss') { read.textContent = `${z('第', 'step ')}${msg.step}${z(' 步 · 损失 ', ' · loss ')}${msg.loss.toFixed(3)}`; drawLoss(msg.curve); }
    if (msg.type === 'sample') { out.textContent = msg.text; drawHeat(msg.att, msg.labels); }
  };
  host.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-gpt]'); if (!b) return;
    const k = b.dataset.gpt;
    if (k === 'start') worker.postMessage({ type: 'start' });
    else if (k === 'pause') worker.postMessage({ type: 'pause' });
    else if (k === 'go') {
      const prompt = host.querySelector<HTMLInputElement>('[data-gpt-prompt]')!.value;
      const temp = Number(host.querySelector<HTMLInputElement>('[data-gpt-temp]')!.value);
      worker.postMessage({ type: 'sample', prompt, temp });
    }
  });
}
