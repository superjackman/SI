import { alphabet, forwardAttn, makeNet, sampleNext, trainStep, windows, type Net } from './tiny-gpt';

const POEM = '床前明月光疑是地上霜举头望明月低头思故乡';
const DAY = '今天天气真好我们去公园走路妈妈说明天早点起床吃饭小明把杯子放在桌上';
const POEM_EN = 'the cat sat on the mat as it was tired the cat sat ';
const DAY_EN = 'today we walk in the park mom says eat and sleep ';

let chars: string[] = [];
let id = new Map<string, number>();
let net: Net = makeNet(1, 16, 16);
let data: number[][] = [];
let on = false, step = 0;
const curve: number[] = [];

function load(scene: string, lang: string) {
  on = false;
  const text = lang === 'en' ? (scene === 'day' ? DAY_EN : POEM_EN) : (scene === 'day' ? DAY : POEM);
  const alph = alphabet(text);
  chars = alph.chars;
  id = alph.id;
  net = makeNet(chars.length, 16, 16);
  data = windows(text.repeat(8), id, net.T);
  step = 0;
  curve.length = 0;
}

function tick() {
  if (!on) return;
  let loss = 0;
  for (const row of data) loss += trainStep(net, row, 0.15);
  loss /= data.length || 1;
  step += 1;
  curve.push(Number(loss.toFixed(3)));
  if (curve.length > 40) curve.shift();
  postMessage({ type: 'loss', step, loss, curve: curve.slice() });
  if (on) setTimeout(tick, 20);
}

load('poem', 'zh');

onmessage = (e: MessageEvent) => {
  const msg = e.data as { type: string; prompt?: string; temp?: number; scene?: string; slot?: string; lang?: string };
  if (msg.type === 'scene') { load(msg.scene || 'poem', msg.lang || 'zh'); postMessage({ type: 'reset' }); return; }
  if (msg.type === 'start') { if (!on) { on = true; tick(); } return; }
  if (msg.type === 'pause') { on = false; return; }
  if (msg.type === 'sample') {
    const raw = [...(msg.prompt || '')].filter((c) => id.has(c));
    const ids = raw.map((c) => id.get(c)!);
    if (!ids.length) ids.push(0);
    let att: number[][] = [];
    for (let n = 0; n < 12 && ids.length < net.T; n++) {
      const fwd = forwardAttn(net, ids);
      att = fwd.att;
      ids.push(sampleNext(fwd.logits, msg.temp ?? 0.8));
    }
    postMessage({ type: 'sample', slot: msg.slot || 'after', text: ids.map((i) => chars[i] || '').join(''), att, labels: ids.map((i) => chars[i] || ''), step });
  }
};
