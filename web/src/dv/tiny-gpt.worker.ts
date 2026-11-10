import { CORPUS, alphabet, forwardAttn, makeNet, sampleNext, trainStep, windows } from './tiny-gpt';

const { chars, id } = alphabet();
const net = makeNet(chars.length, 16, 16);
const data = windows(CORPUS.repeat(6), id, net.T);
let on = false, step = 0;
const curve: number[] = [];

function tick() {
  if (!on) return;
  let loss = 0;
  for (const row of data) loss += trainStep(net, row, 0.12);
  loss /= data.length || 1;
  step += 1;
  curve.push(Number(loss.toFixed(3)));
  if (curve.length > 60) curve.shift();
  postMessage({ type: 'loss', step, loss, curve: curve.slice() });
  if (on) setTimeout(tick, 30);
}

onmessage = (e: MessageEvent) => {
  const msg = e.data as { type: string; prompt?: string; temp?: number };
  if (msg.type === 'start') { if (!on) { on = true; tick(); } }
  else if (msg.type === 'pause') on = false;
  else if (msg.type === 'sample') {
    const raw = [...(msg.prompt || CORPUS.slice(0, 4))].filter((c) => id.has(c));
    const ids = raw.map((c) => id.get(c)!);
    if (!ids.length) ids.push(0);
    let att: number[][] = [];
    for (let n = 0; n < 12 && ids.length < net.T; n++) {
      const fwd = forwardAttn(net, ids);
      att = fwd.att;
      ids.push(sampleNext(fwd.logits, msg.temp ?? 0.8));
    }
    postMessage({ type: 'sample', text: ids.map((i) => chars[i]).join(''), att, labels: ids.map((i) => chars[i]) });
  }
};
