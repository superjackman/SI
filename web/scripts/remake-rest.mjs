/* The other 21 stations. Same rules as the approved samples:
   one spoken sentence, one moving picture, times from the real audio. */
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const repo = join(dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = join(repo, 'videos/zh');
mkdirSync(outDir, { recursive: true });

const INK = '#1c1915', NAVY = '#15202b', CARD = '#fffcf7', LINK = '#1a4a6b';
const GOOD = '#135636', HL = '#7a3f06', LV4 = '#1e40af', LINE = '#d9d3c7';
const COLS = [LINK, GOOD, HL, LV4];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
const lossOf = (w, b) => [[1, 3], [2, 5], [3, 7]].reduce((s, [x, y]) => s + (w * x + b - y) ** 2, 0) / 3;

const B = (shot, say, at) => ({ shot, say, at });

/* Numbers checked before any frame is drawn. */
const exp2 = Math.exp(2), exp1 = Math.exp(1);
if (Math.abs(lossOf(0, 0) - 83 / 3) > 1e-9) throw new Error('loss 0,0');
if (Math.abs(lossOf(2, 0) - 1) > 1e-9) throw new Error('loss 2,0');
if (Math.abs(lossOf(2, 1)) > 1e-9) throw new Error('loss 2,1');
if (2 * 4 + 1 !== 9) throw new Error('unseen');
if (Math.abs(0.7 + 0.1 * 3 - 1) > 1e-9) throw new Error('shares');
if (Math.abs((0.25 + 0 + 0.25) / 3 - 1 / 6) > 1e-9) throw new Error('sq');
if (6 * 1 * 0.5 !== 3 || 6 + 1 + 0.5 !== 7.5) throw new Error('factors');
if (Math.round(1000000 / 256) !== 3906) throw new Error('bags');
{
  let v = 0; const seq = [];
  for (let i = 0; i < 4; i++) { v = 0.9 * v + 1; seq.push(+v.toFixed(2)); }
  if (seq.join(',') !== '1,1.9,2.71,3.44') throw new Error('momentum ' + seq);
}
if (224 / 16 !== 14 || 14 * 14 !== 196) throw new Error('patches');
if ((100 * 101) / 2 !== 5050) throw new Error('sum');
if (Math.abs(1 / (1 + Math.exp(-1)) - 0.731) > 0.001) throw new Error('sigmoid');

const BOARDS = {
  /* 第 1 站 */
  '0': [
    B('line', '先看这三颗点。它们从上面落下来，正好排在一条斜线上。', (t) => ({ kind: 'line', w: 0, b: 0, fall: t, line: 0, hot: '' })),
    B('line', '两颗旋钮还停在零。线是平的，罚分停在 27.67。', (t) => ({ kind: 'line', w: 0, b: 0, fall: 1, line: t, hot: '' })),
    B('line', '左边这颗从 0 拧到 2。线变陡，罚分从 27.67 降到 1.00。', (t) => ({ kind: 'line', w: lerp(0, 2, t), b: 0, fall: 1, line: 1, hot: 'w' })),
    B('line', '右边这颗从 0 拧到 1。线贴住三颗点，罚分变成 0。', (t) => ({ kind: 'line', w: 2, b: lerp(0, 1, t), fall: 1, line: 1, hot: 'b' })),
    B('line', '没见过的 4，沿同一条线算出 9。', (t) => ({ kind: 'line', w: 2, b: 1, fall: 1, line: 1, hot: 'both', ghost: t })),
    B('crowd', '这样的点如果堆得很多，眼睛就看不过来了。', (t) => ({ kind: 'crowd', n: Math.round(lerp(3, 48, t)) })),
    B('line', '所以要让机器自己把旋钮停在该停的地方。', (t) => ({ kind: 'line', w: lerp(0.4, 2, t), b: lerp(0.2, 1, t), fall: 1, line: 1, hot: 'both' })),
    B('words', '下一站要说的是，下一个字有多大可能。', (t) => ({ kind: 'words', words: ['下', '一', '个', '字'], flow: t, scores: [] })),
  ],
  /* 第 2 站 */
  P: [
    B('shares', '每猜下一个字，是在给每个候选打一份可能性。', (t) => ({ kind: 'shares', items: shareGrow(['蓝', '绿', '红', '天'], [0.25, 0.25, 0.25, 0.25], t) })),
    B('shares', '蓝、绿、红、天现在一样大，每份都是 0.25。', (t) => ({ kind: 'shares', items: shareHold(['蓝', '绿', '红', '天'], [0.25, 0.25, 0.25, 0.25], t) })),
    B('shares', '四份加起来必须是 1。少了，就等于宣布某个字不可能。', (t) => ({ kind: 'shares', items: shareHold(['蓝', '绿', '红', '天'], [0.25, 0.25, 0.25, 0.25], t), warn: t > 0.45 })),
    B('shares', '已知天空是，最大的一份让给蓝，蓝升到 0.70。', (t) => ({ kind: 'shares', items: shareFromTo(['蓝', '绿', '红', '天'], [0.25, 0.25, 0.25, 0.25], [0.7, 0.1, 0.1, 0.1], t) })),
    B('shares', '剩下的 0.30 平分给另外三个，每份 0.10。', (t) => ({ kind: 'shares', items: shareHold(['蓝', '绿', '红', '天'], [0.7, 0.1, 0.1, 0.1], t) })),
    B('shares', '四份重新加回 1.00。', (t) => ({ kind: 'shares', items: shareHold(['蓝', '绿', '红', '天'], [0.7, 0.1, 0.1, 0.1], t) })),
    B('tally', '下一站用这个数来量，这次猜得有多离谱。', (t) => ({ kind: 'tally', big: (lerp(0, 0.47, t)).toFixed(2), unit: '罚分', rows: [{ label: '猜偏了', v: lerp(0, 0.47, t), max: 1 }] })),
  ],
  /* 第 3 站 */
  '1': [
    B('tally', '每猜一次，都要先知道这次错了多少。', (t) => ({ kind: 'tally', big: lerp(0, 0.5, t).toFixed(2), unit: '这一次的偏差', rows: [] })),
    B('steps', '三次猜一个数，偏差是正 0.50、0、负 0.50。', (t) => ({ kind: 'steps', items: ['+0.50', '0', '−0.50'], on: t * 3, note: '正负还没处理' })),
    B('steps', '正负直接相加，得到 0，看起来像没罚分。', (t) => ({ kind: 'steps', items: ['+0.50', '0', '−0.50'], on: 3, note: '加起来 ' + lerp(0.5, 0, t).toFixed(2) })),
    B('steps', '先平方再平均。0.25、0、0.25，平均是 0.17。', (t) => ({ kind: 'steps', items: ['0.25', '0', '0.25'], on: t * 3, note: '平均 ' + ((0.25 + 0 + 0.25) / 3 * Math.min(1, t * 1.2)).toFixed(2) })),
    B('tally', '越离谱，这一格罚得越重。', (t) => ({ kind: 'tally', big: lerp(0.25, 1, t).toFixed(2), unit: '偏差的平方', rows: [{ label: '小偏差', v: 0.25, max: 1 }, { label: '大偏差', v: lerp(0.25, 1, t), max: 1 }] })),
    B('tally', '换成猜字。蓝的可能是 0.625，罚分大约 0.47。', (t) => ({ kind: 'tally', big: lerp(0, 0.47, t).toFixed(2), unit: '罚分', rows: [{ label: '蓝 0.625', v: 0.625, max: 1 }] })),
    B('line', '有了这个数，才知道旋钮该往哪边拧。', (t) => ({ kind: 'line', w: lerp(0, 2, t), b: lerp(0, 1, t), fall: 1, line: 1, hot: 'both' })),
  ],
  /* 第 6 站 */
  '4': [
    B('steps', '最后的罚分变大了。要问是谁弄大的。', (t) => ({ kind: 'steps', items: ['第 1 层', '第 2 层', '第 3 层'], on: t * 3, note: '罚分往回传' })),
    B('steps', '三层的倍数是 6、1 和 0.5。', (t) => ({ kind: 'steps', items: ['6', '1', '0.5'], on: t * 3, note: '每一层一个倍数' })),
    B('tally', '把它们加起来得到 7.5。这个数不属于任何一层。', (t) => ({ kind: 'tally', big: lerp(0, 7.5, t).toFixed(1), unit: '加出来的，不对', rows: [{ label: '6+1+0.5', v: lerp(0, 7.5, t), max: 8 }] })),
    B('tally', '应该乘回去。6 乘 1 乘 0.5，等于 3。', (t) => ({ kind: 'tally', big: (6 * lerp(0.2, 1, t) * 0.5).toFixed(2), unit: '乘回去', rows: [{ label: '6×1×0.5', v: 6 * lerp(0.2, 1, t) * 0.5, max: 3 }] })),
    B('steps', '只留下最后一层的 0.5，前面两层就听不到。', (t) => ({ kind: 'steps', items: ['听不到', '听不到', '0.5'], on: 1 + t * 2, note: '前面两层是空的' })),
    B('steps', '乘着传回去，最前面的旋钮也能收到。', (t) => ({ kind: 'steps', items: ['收到 3', '传到第 2 层', '传到第 1 层'], on: t * 3, note: '最前面也能收到', scan: t })),
    B('flow', '下一站面对很多条，不能每一步都看完。', (t) => ({ kind: 'flow', n: Math.round(lerp(4, 28, t)), label: '一条一条太多' })),
  ],
  /* 第 7 站 */
  '5': [
    B('flow', '数据有上百万条。每一步看完全部，太慢。', (t) => ({ kind: 'flow', n: Math.round(lerp(2, 36, t)), label: '上百万条' })),
    B('flow', '分成一袋一袋，每袋 256 条。', (t) => ({ kind: 'flow', n: Math.round(lerp(1, 8, t)), label: '每袋 256' })),
    B('tally', '一百万除以 256，一轮大约要走 3906 步。', (t) => ({ kind: 'tally', big: '3906', unit: '步', rows: [{ label: '1000000 ÷ 256', v: lerp(0, 3906, t), max: 3906 }] })),
    B('tally', '等全部看完再动一次，一轮就只剩 1 步。', (t) => ({ kind: 'tally', big: String(Math.max(1, Math.round(lerp(3906, 1, t)))), unit: '步', rows: [{ label: '看完全部才动', v: lerp(3906, 1, t), max: 3906 }] })),
    B('tally', '同方向的坡留住一部分。1 滚成 1.90。', (t) => ({ kind: 'tally', big: lerp(1, 1.9, t).toFixed(2), unit: '滚起来的坡', rows: [{ label: '留下九成，再加上新的', v: lerp(1, 1.9, t), max: 4 }] })),
    B('tally', '再滚成 2.71，然后是 3.44，越走越顺。', (t) => ({ kind: 'tally', big: lerp(1.9, 3.44, t).toFixed(2), unit: '滚起来的坡', rows: [{ label: '越叠越顺', v: lerp(1.9, 3.44, t), max: 4 }] })),
    B('flow', '一小袋一小袋走，才又快又稳。', (t) => ({ kind: 'flow', n: Math.round(lerp(2, 12, t)), label: '又快又稳' })),
  ],
  /* 第 8 站 */
  '6': [
    B('words', '电脑不认猫这个字，只认一排数。', (t) => ({ kind: 'words', words: ['猫'], flow: t, scores: [{ name: '变成一排数', v: t }] })),
    B('words', '猫和狗的方向更齐，乘出来是 0.96。', (t) => ({ kind: 'words', words: ['猫', '狗'], flow: t, scores: [{ name: '乘出来', v: lerp(0, 0.96, t) }] })),
    B('words', '猫和汽车差得远，乘出来只有 0.30。', (t) => ({ kind: 'words', words: ['猫', '汽车'], flow: t, scores: [{ name: '乘出来', v: lerp(0, 0.3, t) }] })),
    B('tally', '方向更齐的两个词，乘出来的数更大。', (t) => ({ kind: 'tally', big: '', unit: '', rows: [{ label: '猫·狗 0.96', v: 0.96, max: 1 }, { label: '猫·汽车 0.30', v: lerp(0, 0.3, t), max: 1 }] })),
    B('words', '切词的时候，low、lower、lowest 反复一起出现。', (t) => ({ kind: 'words', words: ['low', 'lower', 'lowest'], flow: t, scores: [] })),
    B('words', '最常见的一对先粘成一块。', (t) => ({ kind: 'words', words: t < 0.5 ? ['low', 'er'] : ['lower'], flow: t, scores: [{ name: '先粘这对', v: t }] })),
    B('words', '词不再是互不相干的编号。', (t) => ({ kind: 'words', words: ['猫', '狗', '汽车'], flow: t, scores: [{ name: '方向能比', v: lerp(0.3, 0.96, t) }] })),
  ],
  /* 第 9 站 */
  '7': [
    B('words', '句子有长有短。一个词一个词往后传。', (t) => ({ kind: 'words', words: ['天', '空', '是', '蓝'], flow: t, scores: [] })),
    B('words', '纸条传得越远，开头的那一点就越淡。', (t) => ({ kind: 'words', words: ['开头', '中段', '后头'], flow: t, scores: [{ name: '开头还剩', v: lerp(1, 0.15, t) }] })),
    B('steps', '三个词的分数是 2、1 和 0。', (t) => ({ kind: 'steps', items: ['2', '1', '0'], on: t * 3, note: '还是原来的分数' })),
    B('steps', '先把它们变大，得到 7.39、2.72 和 1.00。', (t) => ({ kind: 'steps', items: [lerp(2, 7.39, t).toFixed(2), lerp(1, 2.72, t).toFixed(2), lerp(0, 1, t).toFixed(2)], on: 3, note: '变大以后' })),
    B('tally', '加起来是 11.11。第一份是 0.67。', (t) => ({ kind: 'tally', big: '0.67', unit: '第一份', rows: [{ label: '7.39+2.72+1.00=11.11', v: lerp(0, 0.67, t), max: 1 }] })),
    B('words', '所以每个词都要能回头看整句。', (t) => ({ kind: 'words', words: ['回头', '看', '整句'], flow: 1 - t, scores: [{ name: '看得到开头', v: lerp(0.15, 1, t) }] })),
    B('words', '下一站看「它」到底在看前面的哪个词。', (t) => ({ kind: 'words', words: ['小猫', '它'], flow: t, scores: [] })),
  ],
  /* 第 10 站 */
  '8a': [
    B('words', '「它」是谁？人一眼就知道是小猫。', (t) => ({ kind: 'words', words: ['小猫', '坐在', '垫子', '因为', '它'], flow: t, scores: [] })),
    B('words', '按离得近，它会去看「因为」。这是错的。', (t) => ({ kind: 'words', words: ['小猫', '因为', '它'], flow: lerp(0, 1, t), scores: [{ name: '看因为', v: lerp(0, 0.8, t) }] })),
    B('words', '按对得上的程度，小猫的分数最高。', (t) => ({ kind: 'words', words: ['小猫', '垫子', '因为', '它'], flow: lerp(1, 0, t), scores: [{ name: '小猫', v: lerp(0.1, 0.66, t) }] })),
    B('shares', '大约三分之二，也就是 0.66，落在小猫上。', (t) => ({ kind: 'shares', items: shareGrow(['小猫', '垫子', '因为', '坐在'], [0.66, 0.2, 0.1, 0.04], t) })),
    B('shares', '垫子 0.20，因为 0.10，坐在 0.04。加起来是 1。', (t) => ({ kind: 'shares', items: shareHold(['小猫', '垫子', '因为', '坐在'], [0.66, 0.2, 0.1, 0.04], t) })),
    B('words', '它取的是对得上的内容，不是谁离得近。', (t) => ({ kind: 'words', words: ['它', '→', '小猫'], flow: t, scores: [{ name: '0.66', v: 0.66 }] })),
  ],
  /* 第 11 站 */
  '8b': [
    B('steps', '回头看名牌，只是一层里的一件事。', (t) => ({ kind: 'steps', items: ['看名牌', '加回去', '各自消化'], on: t, note: '一层里的三件事' })),
    B('steps', '大模型像一栋楼，同一种楼层叠很多层。', (t) => ({ kind: 'steps', items: ['1', '2', '3', '4', '5', '6'], on: t * 6, note: '往上叠' })),
    B('steps', '这里叠了 6 层。', (t) => ({ kind: 'steps', items: ['1', '2', '3', '4', '5', '6'], on: t * 6, note: '一共 6 层', scan: t })),
    B('steps', '每一层先让词互相看名牌。', (t) => ({ kind: 'steps', items: ['看名牌'], on: t, note: '名牌对上了 ' + Math.round(t * 100) + '%', scan: t })),
    B('steps', '再把原来的说法加回去，然后各自消化。', (t) => ({ kind: 'steps', items: ['原来的说法', '加回去', '各自消化'], on: t * 3, note: '一层做完' })),
    B('flow', '一层做完，交给下一层。数从左流到右。', (t) => ({ kind: 'flow', n: 6, label: '交到第 ' + (1 + Math.floor(t * 5.99)) + ' 层', flow: t })),
  ],
  /* 第 12 站 */
  '9': [
    B('words', '房子有了。让它猜下一个字。', (t) => ({ kind: 'words', words: ['天', '空', '？'], flow: t, scores: [] })),
    B('words', '「天空是蓝色的」这一句，同时练了 5 道题。', (t) => ({ kind: 'words', words: ['天', '空', '是', '蓝', '色', '的'], flow: t, scores: [{ name: '题', v: lerp(0, 5, t) / 5 }] })),
    B('words', '文字自己就是答案，不用另外找人来标。', (t) => ({ kind: 'words', words: ['空', '是', '蓝', '色', '的'], flow: t, scores: [{ name: '答案就在下一字', v: t }] })),
    B('tally', '开练时，正确的字只有 5.4% 的可能。', (t) => ({ kind: 'tally', big: lerp(0, 5.4, t).toFixed(1) + '%', unit: '正确的字', rows: [{ label: '刚开始', v: lerp(0, 5.4, t), max: 100 }] })),
    B('tally', '两百步以后，升到 99.8%。', (t) => ({ kind: 'tally', big: lerp(5.4, 99.8, t).toFixed(1) + '%', unit: '正确的字', rows: [{ label: '走到第 ' + Math.round(lerp(0, 200, t)) + ' 步', v: lerp(5.4, 99.8, t), max: 100 }] })),
    B('shares', '温度不拧旋钮，只把这份分布拧尖或者拧平。', (t) => ({ kind: 'shares', items: t < 0.5 ? shareFromTo(['正确', '其他'], [0.5, 0.5], [0.9, 0.1], t * 2) : shareFromTo(['正确', '其他'], [0.9, 0.1], [0.4, 0.6], (t - 0.5) * 2) })),
  ],
  /* 第 13 站 */
  E: [
    B('tally', '练完以后，不能靠感觉说它变强了。', (t) => ({ kind: 'tally', big: '？', unit: '先别凭感觉', rows: [{ label: '要有一把尺子', v: t, max: 1 }] })),
    B('tally', '平均还在四个候选里犹豫，这个程度就是 4。', (t) => ({ kind: 'tally', big: lerp(8, 4, t).toFixed(0), unit: '还在犹豫的份数', rows: [{ label: '四个里挑', v: lerp(8, 4, t), max: 8 }] })),
    B('steps', '同一张卷子，做对 8 题，共 10 题。', (t) => ({ kind: 'steps', items: Array.from({ length: 10 }, (_, i) => (i < 8 ? '对' : '错')), on: t * 10, note: '10 题' })),
    B('tally', '8 除以 10，准确率是 80%。', (t) => ({ kind: 'tally', big: '80%', unit: '做对的比例', rows: [{ label: '8÷10', v: lerp(0, 80, t), max: 100 }] })),
    B('steps', '题如果已经出现在练习里，这个分数就不能拿来比。', (t) => ({ kind: 'steps', items: ['练习里见过', '不能比'], on: t * 2, note: '尺子要换一套新题' })),
    B('tally', '犹豫变少，只说明它更敢下判断，不等于答对了。', (t) => ({ kind: 'tally', big: lerp(4, 1.2, t).toFixed(1), unit: '犹豫变少', rows: [{ label: '更敢说', v: lerp(0.2, 1, t), max: 1 }, { label: '答对', v: 0.8, max: 1 }] })),
  ],
  /* 第 14 站 */
  '10': [
    B('words', '只会接着往下写，还不等于听得懂吩咐。', (t) => ({ kind: 'words', words: ['接着', '写', '下去'], flow: t, scores: [] })),
    B('steps', '同一个问题，两份回答摆在一起。', (t) => ({ kind: 'steps', items: ['讲清原因', '自己去查'], on: t * 2, note: '让人来挑' })),
    B('steps', '讲清原因的那份被人选中，分数 1.5。', (t) => ({ kind: 'steps', items: ['1.5 选中', '0.5'], on: 1 + t, note: '人选了左边' })),
    B('tally', '奖励的差是 1.5 减 0.5，等于 1。', (t) => ({ kind: 'tally', big: lerp(1.5, 1, t).toFixed(2), unit: '差', rows: [{ label: '1.5−0.5', v: lerp(0, 1, t), max: 1.5 }] })),
    B('tally', '收成 0 到 1 之间的数，大约是 0.73。', (t) => ({ kind: 'tally', big: (1 / (1 + Math.exp(-lerp(0, 1, t)))).toFixed(2), unit: '靠向选中的那份', rows: [{ label: '差从 0 收到 1', v: 1 / (1 + Math.exp(-lerp(0, 1, t))), max: 1 }] })),
    B('line', '旋钮就往被选中的那边靠。', (t) => ({ kind: 'line', w: lerp(0, 1.2, t), b: lerp(0, 0.4, t), fall: 1, line: 1, hot: 'both' })),
  ],
  /* 第 15 站 */
  '11': [
    B('tally', '把整块都解开再拧，太贵。', (t) => ({ kind: 'tally', big: '整块', unit: '太贵', rows: [{ label: '要动的个数', v: lerp(0.2, 1, t), max: 1 }] })),
    B('tally', '整块有 1600 万个数要动。', (t) => ({ kind: 'tally', big: '1600 万', unit: '整块', rows: [{ label: '整块', v: lerp(0, 1600, t), max: 1600 }] })),
    B('tally', '旁边那条细路只动 6 万多个。', (t) => ({ kind: 'tally', big: lerp(0, 6, t).toFixed(0) + ' 万', unit: '细路', rows: [{ label: '细路', v: lerp(0, 6, t), max: 1600 }, { label: '整块还在', v: 1600, max: 1600 }] })),
    B('tally', '6 万除以 1600 万，得到 0.0038，大约千分之四。', (t) => ({ kind: 'tally', big: '0.0038', unit: '细路占整块', rows: [{ label: '60000÷16000000', v: lerp(0, 0.0038, t), max: 0.01 }] })),
    B('steps', '大块冻住，只拧旁边这条细路。', (t) => ({ kind: 'steps', items: ['大块冻住', '细路在拧'], on: 1 + t, note: '只动细的那条' })),
    B('steps', '细路的结果再加回原来的结果。', (t) => ({ kind: 'steps', items: ['原来的', '+', '细路'], on: t * 3, note: '加回去' })),
  ],
  /* 第 16 站 */
  '12': [
    B('words', '字只能一个一个往外写。', (t) => ({ kind: 'words', words: ['一', '个', '一', '个'], flow: t, scores: [] })),
    B('words', '已经算过的，别每次从头再算。', (t) => ({ kind: 'words', words: ['算过', '记下来'], flow: t, scores: [{ name: '不用重算', v: t }] })),
    B('steps', '问过的内容记在本子上。', (t) => ({ kind: 'steps', items: ['名牌', '内容'], on: t * 2, note: '记在本子上' })),
    B('tally', '没有这本子，写 100 个字要把 1 加到 100。', (t) => ({ kind: 'tally', big: String(Math.round(lerp(1, 100, t))), unit: '加到这里', rows: [{ label: '1+2+…', v: lerp(1, 100, t), max: 100 }] })),
    B('tally', '1 加到 100，一共是 5050 次重算。', (t) => ({ kind: 'tally', big: '5050', unit: '次重算', rows: [{ label: '100×101÷2', v: lerp(0, 5050, t), max: 5050 }] })),
    B('words', '有了本子，下一步直接接着写。', (t) => ({ kind: 'words', words: ['本子', '下一步'], flow: t, scores: [{ name: '不用从头', v: lerp(1, 0, t) }] })),
  ],
  /* 第 17 站 */
  '13': [
    B('words', '它会过期，也会编。别逼它把资料背下来。', (t) => ({ kind: 'words', words: ['别', '背', '下来'], flow: t, scores: [] })),
    B('words', '先去资料里找相关的一段。', (t) => ({ kind: 'words', words: ['资料', '里', '找'], flow: t, scores: [{ name: '先找', v: t }] })),
    B('words', '年假这一问，和休假那一页方向更齐。', (t) => ({ kind: 'words', words: ['年假', '休假'], flow: t, scores: [{ name: '更齐', v: lerp(0, 0.82, t) }] })),
    B('tally', '齐的程度是 0.82。报销流程只有 0.31。', (t) => ({ kind: 'tally', big: '0.82', unit: '休假这一页', rows: [{ label: '休假 0.82', v: lerp(0, 0.82, t), max: 1 }, { label: '报销 0.31', v: 0.31, max: 1 }] })),
    B('words', '所以只把休假那一页放进来。', (t) => ({ kind: 'words', words: ['休假那一页'], flow: t, scores: [{ name: '0.82', v: 0.82 }] })),
    B('words', '回答再注明，它从哪一页来。', (t) => ({ kind: 'words', words: ['来自', '休假', '那一页'], flow: t, scores: [] })),
  ],
  /* 第 18 站 */
  '14': [
    B('words', '只会说还不够，还得能办事。', (t) => ({ kind: 'words', words: ['说', '办'], flow: t, scores: [] })),
    B('words', '下雨就把户外会议改到线上。', (t) => ({ kind: 'words', words: ['下雨', '会议', '改线上'], flow: t, scores: [] })),
    B('steps', '第一步问天气。第二步查日历。', (t) => ({ kind: 'steps', items: ['问天气', '查日历', '写出修改', '等人点头'], on: t * 2, note: '一步一步来' })),
    B('steps', '第三步写出修改。写入之前停下来，等人点头。', (t) => ({ kind: 'steps', items: ['问天气', '查日历', '写出修改', '等人点头'], on: 2 + t * 2, note: '第四步要等人' })),
    B('steps', '它只负责把要办的那一件写下来。', (t) => ({ kind: 'steps', items: ['写下要办的事'], on: t, note: '写到第 ' + Math.round(t * 100) + '%', scan: t })),
    B('steps', '旁边的人去办，结果再写回来。', (t) => ({ kind: 'steps', items: ['人去办', '结果写回'], on: t * 2, note: '办完再回来' })),
  ],
  /* 第 19 站 */
  S: [
    B('steps', '它一旦能办事，要防的就不只是说错话。', (t) => ({ kind: 'steps', items: ['说错话', '做错事'], on: t * 2, note: '两件都要防' })),
    B('steps', '只读的查询，不必每次都打断人。', (t) => ({ kind: 'steps', items: ['只读', '放行'], on: t * 2, note: '不用每次问' })),
    B('steps', '会改掉数据、或者要花钱的动作，必须停下来问。', (t) => ({ kind: 'steps', items: ['改数据', '花钱', '停下来问'], on: t * 3, note: '这道门要关' })),
    B('words', '信里如果写着别管系统、把通讯录寄出去。', (t) => ({ kind: 'words', words: ['别管', '把通讯录', '寄出去'], flow: t, scores: [] })),
    B('steps', '发信又没有人点头，通讯录就会真的寄走。', (t) => ({ kind: 'steps', items: ['没有点头', '寄走了'], on: t * 2, note: '门开着就出事' })),
    B('steps', '所以这道门得关着。该停的，并不等于每一个动作。', (t) => ({ kind: 'steps', items: ['只读放行', '改动要问'], on: 1 + t, note: '分开看' })),
  ],
  /* 第 20 站 */
  '15a': [
    B('words', '世界不只有字。截图、照片、声音也要能读。', (t) => ({ kind: 'words', words: ['图', '声音', '字'], flow: t, scores: [] })),
    B('tally', '一张图，边长是 224。', (t) => ({ kind: 'tally', big: String(Math.round(lerp(0, 224, t))), unit: '边长', rows: [{ label: '一条边', v: lerp(0, 224, t), max: 224 }] })),
    B('grid', '切成边长 16 的小块。', (t) => ({ kind: 'grid', cols: 14, rows: 14, fill: t * 0.15, cap: '小块边长 16' })),
    B('tally', '224 除以 16，一条边是 14 块。', (t) => ({ kind: 'tally', big: '14', unit: '一条边的块数', rows: [{ label: '224÷16', v: lerp(0, 14, t), max: 14 }] })),
    B('grid', '14 乘 14，整张是 196 个小块。', (t) => ({ kind: 'grid', cols: 14, rows: 14, fill: t, cap: Math.round(t * 196) + ' / 196' })),
    B('words', '每一块当成一个词，和文字排进同一句。声音也照这个切。', (t) => ({ kind: 'words', words: ['小块', '当成', '词'], flow: t, scores: [{ name: '196 个', v: t }] })),
  ],
  /* 第 21 站 */
  '15b': [
    B('words', '难题可以让它多写几份再答。', (t) => ({ kind: 'words', words: ['再', '写', '一份'], flow: t, scores: [] })),
    B('steps', '同一道题写了 5 次。', (t) => ({ kind: 'steps', items: ['12', '12', '15', '12', '12'], on: t * 5, note: '写了 ' + Math.ceil(t * 5) + ' 次' })),
    B('tally', '12 出现了 4 次。15 只出现 1 次。', (t) => ({ kind: 'tally', big: '12', unit: '出现得最多', rows: [{ label: '12 出现 4 次', v: lerp(0, 4, t), max: 5 }, { label: '15 出现 1 次', v: t > 0.5 ? 1 : 0, max: 5 }] })),
    B('steps', '投票留下出现最多的 12，不留下 15。', (t) => ({ kind: 'steps', items: ['留下 12', '丢掉 15'], on: t * 2, note: '次数多的留下' })),
    B('words', '想得更久，是多写几节，不是把窗口无缘无故拉长。', (t) => ({ kind: 'words', words: ['多写', '几节'], flow: t, scores: [{ name: '不是拉长', v: lerp(1, 0.2, t) }] })),
    B('tally', '次数才算数。', (t) => ({ kind: 'tally', big: String(Math.round(lerp(1, 4, t))), unit: '12 的次数', rows: [{ label: '次数', v: lerp(1, 4, t), max: 5 }] })),
  ],
  /* 第 22 站 */
  A: [
    B('words', '学完这些，最想知道现在能拿来做什么。', (t) => ({ kind: 'words', words: ['拿来', '做', '什么'], flow: t, scores: [] })),
    B('steps', '修这个报错，先去读相关的段落。', (t) => ({ kind: 'steps', items: ['读相关的段落'], on: t, note: '先读' })),
    B('steps', '再改，再跑测试。', (t) => ({ kind: 'steps', items: ['读', '改', '跑测试'], on: 1 + t * 2, note: '接着做' })),
    B('steps', '失败就再转一圈。', (t) => ({ kind: 'steps', items: ['读', '改', '测试', '再来'], on: (t * 4) % 4, note: '第 ' + (1 + Math.floor(t * 2.99)) + ' 圈' })),
    B('steps', '能交出去的用法，是把这些事排好顺序。', (t) => ({ kind: 'steps', items: ['读', '改', '测试', '交出去'], on: t * 4, note: '排好顺序' })),
    B('steps', '不是再加一排新旋钮。就用原来这两颗。', (t) => ({ kind: 'steps', items: ['陡 2.00', '起步 1.00', '不再加'], on: 2 + t, note: '就这两颗' })),
  ],
  /* 第 23 站 */
  '16': [
    B('words', '整条链可以收成一句话。', (t) => ({ kind: 'words', words: ['一', '句', '话'], flow: t, scores: [] })),
    B('line', '用看见的例子，把旋钮拧对。', (t) => ({ kind: 'line', w: lerp(0, 2, t), b: lerp(0, 1, t), fall: 1, line: 1, hot: 'both' })),
    B('tally', '罚分往下走，旋钮跟着坡动。', (t) => ({ kind: 'tally', big: lerp(27.67, 0, t).toFixed(2), unit: '罚分', rows: [{ label: '往下走', v: lerp(27.67, 0, t), max: 28 }] })),
    B('steps', '中间换过的是任务和数据。这一套没有换掉。', (t) => ({ kind: 'steps', items: ['例子', '罚分', '坡', '旋钮'], on: t * 4, note: '这一套还在' })),
    B('words', '一路被新问题逼到能看图、能办事。', (t) => ({ kind: 'words', words: ['看图', '办事'], flow: t, scores: [] })),
    B('steps', '到这里，这条链就合上了。', (t) => ({ kind: 'steps', items: ['线', '罚分', '弯', '楼', '工具'], on: t * 5, note: '合上' })),
  ],
};

const EXTRA = {
  '0': [
    B('line', '左边拧到一半，是 1.00。罚分还没到最低。', (t) => ({ kind: 'line', w: lerp(0, 1, t), b: 0, fall: 1, line: 1, hot: 'w' })),
    B('line', '两颗一起停在 2.00 和 1.00，罚分是 0。', (t) => ({ kind: 'line', w: lerp(1, 2, t), b: lerp(0, 1, t), fall: 1, line: 1, hot: 'both' })),
    B('line', '没见过的数也能算，因为旋钮已经停对了。', (t) => ({ kind: 'line', w: 2, b: 1, fall: 1, line: 1, hot: 'both', ghost: t })),
  ],
  P: [
    B('shares', '蓝如果只有 0.40，剩下的 0.60 也要分完。', (t) => ({ kind: 'shares', items: shareFromTo(['蓝', '绿', '红', '天'], [0.25, 0.25, 0.25, 0.25], [0.4, 0.2, 0.2, 0.2], t) })),
    B('shares', '0.40 加 0.20 加 0.20 加 0.20，还是 1。', (t) => ({ kind: 'shares', items: shareHold(['蓝', '绿', '红', '天'], [0.4, 0.2, 0.2, 0.2], t) })),
    B('shares', '四份一样大，只是其中一种分法。', (t) => ({ kind: 'shares', items: shareFromTo(['蓝', '绿', '红', '天'], [0.25, 0.25, 0.25, 0.25], [0.7, 0.1, 0.1, 0.1], t) })),
    B('tally', '最大的一份可以不是 1，只要全部加回 1。', (t) => ({ kind: 'tally', big: lerp(0.4, 1, t).toFixed(2), unit: '四份之和', rows: [{ label: '加回 1', v: lerp(0.4, 1, t), max: 1 }] })),
  ],
  '1': [
    B('tally', '偏差 0.50 的平方是 0.25。偏差 1 的平方是 1。', (t) => ({ kind: 'tally', big: lerp(0.25, 1, t).toFixed(2), unit: '平方以后', rows: [{ label: '0.50 的平方', v: 0.25, max: 1 }, { label: '1 的平方', v: lerp(0.25, 1, t), max: 1 }] })),
    B('tally', '0.25 加 0 加 0.25 等于 0.50。再除以 3，是 0.17。', (t) => ({ kind: 'tally', big: lerp(0.5, 0.17, t).toFixed(2), unit: '平均罚分', rows: [{ label: '0.50÷3', v: lerp(0.5, 0.17, t), max: 0.5 }] })),
    B('tally', '0.625 已经比较像了，所以罚分只有 0.47。', (t) => ({ kind: 'tally', big: '0.47', unit: '罚分', rows: [{ label: '可能 0.625', v: lerp(0, 0.625, t), max: 1 }] })),
    B('line', '罚分变小的方向，就是旋钮该拧的方向。', (t) => ({ kind: 'line', w: lerp(0, 2, t), b: 0, fall: 1, line: 1, hot: 'w' })),
  ],
  '4': [
    B('tally', '6 乘 1 得到 6，再乘 0.5 得到 3。', (t) => ({ kind: 'tally', big: lerp(6, 3, t).toFixed(1), unit: '乘回去', rows: [{ label: '6×1×0.5', v: lerp(6, 3, t), max: 6 }] })),
    B('tally', '7.5 只是三层相加，传不回去。', (t) => ({ kind: 'tally', big: '7.5', unit: '加出来的，不对', rows: [{ label: '6+1+0.5', v: lerp(0, 7.5, t), max: 8 }] })),
    B('steps', '最前面收到的是 3，不是只剩 0.5。', (t) => ({ kind: 'steps', items: ['3', '传到前面', '不是 0.5'], on: t * 3, note: '前面收到 3', scan: t })),
    B('steps', '每一层都乘上自己的倍数，信号才不断。', (t) => ({ kind: 'steps', items: ['×6', '×1', '×0.5'], on: t * 3, note: '一层乘一层', scan: t })),
    B('flow', '所以前面的旋钮也能跟着罚分动。', (t) => ({ kind: 'flow', n: Math.round(lerp(1, 8, t)), label: '信号回到前面', flow: t })),
  ],
  '5': [
    B('flow', '256 条走完就动一次，不用等完全部。', (t) => ({ kind: 'flow', n: Math.round(lerp(1, 8, t)), label: '一袋 256', flow: t })),
    B('tally', '第二袋再动一次。步数跟着袋数涨。', (t) => ({ kind: 'tally', big: String(Math.round(lerp(1, 8, t))), unit: '已经走的袋', rows: [{ label: '袋数', v: lerp(1, 8, t), max: 8 }] })),
    B('tally', '旧的坡先留下九成。1 乘 0.9 再加 1，是 1.90。', (t) => ({ kind: 'tally', big: lerp(1, 1.9, t).toFixed(2), unit: '0.9×1+1', rows: [{ label: '滚到 1.90', v: lerp(1, 1.9, t), max: 4 }] })),
    B('tally', '1.90 再叠一次是 2.71。再叠一次是 3.44。', (t) => ({ kind: 'tally', big: lerp(1.9, 3.44, t).toFixed(2), unit: '越叠越顺', rows: [{ label: '2.71 再到 3.44', v: lerp(1.9, 3.44, t), max: 4 }] })),
    B('flow', '方向没变的那一段坡留下来，走起来才稳。', (t) => ({ kind: 'flow', n: Math.round(lerp(2, 10, t)), label: '方向没变', flow: t })),
  ],
  '6': [
    B('tally', '猫和狗 0.96，猫和汽车 0.30。大的那个方向更齐。', (t) => ({ kind: 'tally', big: '0.96', unit: '更大', rows: [{ label: '猫·狗', v: 0.96, max: 1 }, { label: '猫·汽车', v: lerp(0, 0.3, t), max: 1 }] })),
    B('tally', '0.96 比 0.30 大，因为猫和狗的方向更齐。', (t) => ({ kind: 'tally', big: lerp(0.3, 0.96, t).toFixed(2), unit: '猫和狗', rows: [{ label: '猫·狗', v: lerp(0.3, 0.96, t), max: 1 }, { label: '猫·汽车 0.30', v: 0.3, max: 1 }] })),
    B('words', '大，不是因为这个词比较长。', (t) => ({ kind: 'words', words: ['方向齐', '不是更长'], flow: t, scores: [{ name: '比的是方向', v: lerp(0, 0.96, t) }] })),
    B('words', 'low 和 er 先粘成 lower。', (t) => ({ kind: 'words', words: t < 0.55 ? ['low', 'er'] : ['lower'], flow: t, scores: [{ name: '先粘这对', v: t }] })),
    B('words', '编号如果各不相干，猫和狗就没法比。', (t) => ({ kind: 'words', words: ['猫', '狗'], flow: t, scores: [{ name: '要能比方向', v: lerp(0, 0.96, t) }] })),
    B('words', '所以一个词是一排能比方向的数。', (t) => ({ kind: 'words', words: ['一排', '数'], flow: t, scores: [{ name: '方向', v: t }] })),
  ],
  '7': [
    B('words', '十五个词就要传十五次，不能一次看完。', (t) => ({ kind: 'words', words: ['1', '2', '3', '…', '15'], flow: t, scores: [{ name: '传到', v: t }] })),
    B('tally', '7.39 加 2.72 加 1.00，等于 11.11。', (t) => ({ kind: 'tally', big: '11.11', unit: '加起来', rows: [{ label: '7.39+2.72+1.00', v: lerp(0, 11.11, t), max: 12 }] })),
    B('tally', '7.39 除以 11.11，第一份是 0.67。', (t) => ({ kind: 'tally', big: '0.67', unit: '第一份', rows: [{ label: '7.39÷11.11', v: lerp(0, 0.67, t), max: 1 }] })),
    B('words', '开头若只靠往下传，会越来越淡。', (t) => ({ kind: 'words', words: ['开头', '越来越淡'], flow: t, scores: [{ name: '还剩', v: lerp(1, 0.15, t) }] })),
    B('words', '回头看整句，开头才不会丢。', (t) => ({ kind: 'words', words: ['回头', '整句'], flow: t, scores: [{ name: '开头还在', v: lerp(0.15, 1, t) }] })),
  ],
  '8a': [
    B('words', '距离最近的是「因为」，可它分到的只有 0.10。', (t) => ({ kind: 'words', words: ['因为', '0.10'], flow: t, scores: [{ name: '近但不对', v: lerp(0.4, 0.1, t) }] })),
    B('words', '「因为」挨得近，可分数并不高。', (t) => ({ kind: 'words', words: ['因为', '挨得近'], flow: t, scores: [{ name: '只分到', v: lerp(0.8, 0.1, t) }] })),
    B('shares', '0.66 加 0.20 加 0.10 加 0.04，等于 1。', (t) => ({ kind: 'shares', items: shareHold(['小猫', '垫子', '因为', '坐在'], [0.66, 0.2, 0.1, 0.04], t) })),
    B('words', '不先把分数缩小，几乎会只看见第一个词。', (t) => ({ kind: 'words', words: ['小猫', '其他'], flow: t, scores: [{ name: '堆在一个词上', v: lerp(0.66, 0.95, t) }] })),
    B('words', '缩小以后，小猫仍是 0.66，不是全部。', (t) => ({ kind: 'words', words: ['小猫', '0.66'], flow: t, scores: [{ name: '还留得下别人', v: lerp(0.95, 0.66, t) }] })),
    B('words', '所以它看的是对得上，不是距离。', (t) => ({ kind: 'words', words: ['它', '小猫'], flow: t, scores: [{ name: '0.66', v: 0.66 }] })),
  ],
  '8b': [
    B('flow', '一层里先看名牌，再加回原话，再各自消化，然后交给下一层。', (t) => ({ kind: 'flow', n: Math.round(lerp(1, 6, t)), label: '交到下一层', flow: t })),
    B('steps', '看完名牌，原来的说法还要加回去。', (t) => ({ kind: 'steps', items: ['名牌', '加回原话'], on: t * 2, note: '两步都要', scan: t })),
    B('steps', '加回去之后，每个词再各自消化。', (t) => ({ kind: 'steps', items: ['加回去', '各自消化'], on: t * 2, note: '消化到 ' + Math.round(t * 100) + '%', scan: t })),
    B('flow', '第 1 层做完交给第 2 层，一直交到第 6 层。', (t) => ({ kind: 'flow', n: 6, label: '交到第 ' + (1 + Math.floor(t * 5.99)) + ' 层', flow: t })),
    B('steps', '六层都是同一种楼层，不是六种新花样。', (t) => ({ kind: 'steps', items: ['1', '2', '3', '4', '5', '6'], on: t * 6, note: '同一种', scan: t })),
    B('flow', '数从左边进去，从右边出来，中间过了 6 层。', (t) => ({ kind: 'flow', n: Math.round(lerp(1, 6, t)), label: '过了 ' + (1 + Math.floor(t * 5.99)) + ' 层', flow: t })),
  ],
  '9': [
    B('words', '天空后面猜「是」，是后面猜「蓝」，一题接一题。', (t) => ({ kind: 'words', words: ['空', '是', '蓝', '色', '的'], flow: t, scores: [{ name: '第 ' + (1 + Math.floor(t * 4.99)) + ' 题', v: t }] })),
    B('tally', '五道题都用这一句自己的下一个字当答案。', (t) => ({ kind: 'tally', big: String(Math.round(lerp(1, 5, t))), unit: '道题', rows: [{ label: '不用另外标注', v: lerp(1, 5, t), max: 5 }] })),
    B('tally', '从 5.4% 出发，每一步都比上一步更敢选对的字。', (t) => ({ kind: 'tally', big: lerp(5.4, 50, t).toFixed(1) + '%', unit: '走到一半', rows: [{ label: '正确的字', v: lerp(5.4, 50, t), max: 100 }] })),
    B('tally', '走到第 200 步，正确的字占 99.8%。', (t) => ({ kind: 'tally', big: lerp(50, 99.8, t).toFixed(1) + '%', unit: '第 ' + Math.round(lerp(100, 200, t)) + ' 步', rows: [{ label: '正确的字', v: lerp(50, 99.8, t), max: 100 }] })),
    B('shares', '拧尖的时候，正确的一份升到 0.90。', (t) => ({ kind: 'shares', items: shareFromTo(['正确', '其他'], [0.5, 0.5], [0.9, 0.1], t) })),
    B('shares', '拧平的时候，正确的一份又落回 0.40。旋钮没动。', (t) => ({ kind: 'shares', items: shareFromTo(['正确', '其他'], [0.9, 0.1], [0.4, 0.6], t) })),
  ],
  E: [
    B('steps', '四个候选一样犹豫的时候，这个程度就是 4。', (t) => ({ kind: 'steps', items: ['1', '2', '3', '4'], on: t * 4, note: '四份里犹豫', scan: t })),
    B('tally', '犹豫从 4 降到 2，只是更敢选，不是更对。', (t) => ({ kind: 'tally', big: lerp(4, 2, t).toFixed(1), unit: '犹豫的份数', rows: [{ label: '更敢', v: lerp(4, 2, t), max: 4 }, { label: '答对仍要另量', v: 0.8, max: 1 }] })),
    B('steps', '10 题里对 8 题。把对的涂上，错的留着。', (t) => ({ kind: 'steps', items: ['对', '对', '对', '对', '对', '对', '对', '对', '错', '错'], on: t * 10, note: '8 对 2 错', scan: t })),
    B('tally', '8 除以 10 等于 0.80，也就是 80%。', (t) => ({ kind: 'tally', big: '0.80', unit: '8÷10', rows: [{ label: '做对的比例', v: lerp(0, 0.8, t), max: 1 }] })),
    B('words', '新题上的 80%，才能拿来比。练习里见过的不能比。', (t) => ({ kind: 'words', words: ['新题', '才能比'], flow: t, scores: [{ name: '见过的放下', v: lerp(1, 0, t) }] })),
  ],
  '10': [
    B('tally', '0.73 比一半更大，所以旋钮明显靠向被选中的那份。', (t) => ({ kind: 'tally', big: lerp(0.5, 0.73, t).toFixed(2), unit: '靠过去', rows: [{ label: '0.73', v: lerp(0.5, 0.73, t), max: 1 }] })),
    B('steps', '两份回答先摆开，人选一份，落下一份。', (t) => ({ kind: 'steps', items: ['人选中', '落选'], on: t * 2, note: '先让人挑', scan: t })),
    B('tally', '1.5 比 0.5 高 1。这个 1 还不是可能性。', (t) => ({ kind: 'tally', big: lerp(0, 1, t).toFixed(2), unit: '1.5−0.5', rows: [{ label: '差', v: lerp(0, 1, t), max: 1.5 }] })),
    B('tally', '差如果直接当成可能性，超过 1 就不像样。', (t) => ({ kind: 'tally', big: '1.00', unit: '还不能当可能性', rows: [{ label: '差', v: lerp(0, 1, t), max: 1 }] })),
    B('tally', '收进 0 到 1 以后，1 变成大约 0.73。', (t) => ({ kind: 'tally', big: (1 / (1 + Math.exp(-lerp(0, 1, t)))).toFixed(2), unit: '0 到 1 之间', rows: [{ label: '收进去', v: 1 / (1 + Math.exp(-lerp(0, 1, t))), max: 1 }] })),
    B('line', '0.73 的意思是，旋钮更靠被选中的那份。', (t) => ({ kind: 'line', w: lerp(0, 0.73, t) * 2, b: 0.2, fall: 1, line: 1, hot: 'w' })),
  ],
  '11': [
    B('steps', '整块冻住不动，细路单独拧，再把结果加回去。', (t) => ({ kind: 'steps', items: ['整块冻住', '细路拧', '加回去'], on: t * 3, note: '只动细路', scan: t })),
    B('tally', '1600 万个都拧一遍，每换一个任务都要再存一份。', (t) => ({ kind: 'tally', big: Math.round(lerp(0, 1600, t)) + ' 万', unit: '整块', rows: [{ label: '整块', v: lerp(0, 1600, t), max: 1600 }] })),
    B('tally', '细路 6 万，整块 1600 万。细的那条短得多。', (t) => ({ kind: 'tally', big: '6 万', unit: '细路', rows: [{ label: '细路 6', v: 6, max: 1600 }, { label: '整块', v: lerp(6, 1600, t), max: 1600 }] })),
    B('tally', '6 除以 1600 等于 0.00375，约成 0.0038。', (t) => ({ kind: 'tally', big: lerp(0, 0.0038, t).toFixed(4), unit: '6÷1600 万', rows: [{ label: '细路占的比例', v: lerp(0, 0.0038, t), max: 0.01 }] })),
    B('steps', '大块不动。细路拧完，再加回原来的结果。', (t) => ({ kind: 'steps', items: ['大块不动', '细路拧', '加回去'], on: t * 3, note: '加回原来的', scan: t })),
    B('flow', '新任务只多这一条细路，不必再抄整块。', (t) => ({ kind: 'flow', n: Math.round(lerp(1, 6, t)), label: '只多一条细路', flow: t })),
  ],
  '12': [
    B('words', '本子上已经有前面的字，新的一步就不用把它们再加一遍。', (t) => ({ kind: 'words', words: ['前面的字', '不用再加'], flow: t, scores: [{ name: '只算新的', v: t }] })),
    B('tally', '没有本子时，第 10 个字就要做 55 次，第 100 个字就要做 5050 次。', (t) => ({ kind: 'tally', big: '5050', unit: '100 个字从头加', rows: [{ label: '10 个字是 55，100 个字是 5050', v: lerp(0, 5050, t), max: 5050 }] })),
    B('tally', '写到第 10 个字，从头算要做 55 次。', (t) => ({ kind: 'tally', big: '55', unit: '1 加到 10', rows: [{ label: '10×11÷2', v: lerp(0, 55, t), max: 55 }] })),
    B('tally', '写到第 100 个字，从头算要做 5050 次。', (t) => ({ kind: 'tally', big: '5050', unit: '1 加到 100', rows: [{ label: '100×101÷2', v: lerp(0, 5050, t), max: 5050 }] })),
    B('words', '本子记下问过的名牌和内容。', (t) => ({ kind: 'words', words: ['名牌', '内容'], flow: t, scores: [{ name: '记下了', v: t }] })),
    B('words', '下一步只算新的那个字，旧的直接拿来用。', (t) => ({ kind: 'words', words: ['旧的', '新的'], flow: t, scores: [{ name: '重算只剩新的', v: lerp(1, 0.1, t) }] })),
    B('flow', '本子越记越多，可不用一次次从头加。', (t) => ({ kind: 'flow', n: Math.round(lerp(2, 16, t)), label: '接着写', flow: t })),
  ],
  '13': [
    B('tally', '0.82 减 0.31 等于 0.51。休假比报销齐出这一截。', (t) => ({ kind: 'tally', big: lerp(0, 0.51, t).toFixed(2), unit: '0.82−0.31', rows: [{ label: '齐出的一截', v: lerp(0, 0.51, t), max: 1 }] })),
    B('tally', '休假这一页是 0.82，报销那页是 0.31。', (t) => ({ kind: 'tally', big: lerp(0.31, 0.82, t).toFixed(2), unit: '和年假这一问', rows: [{ label: '休假', v: lerp(0.31, 0.82, t), max: 1 }, { label: '报销 0.31', v: 0.31, max: 1 }] })),
    B('words', '0.82 更大，所以留下休假，放下报销。', (t) => ({ kind: 'words', words: ['留下休假', '放下报销'], flow: t, scores: [{ name: '0.82 > 0.31', v: lerp(0.31, 0.82, t) }] })),
    B('words', '放进来的是这一页的原文，不是让它凭空编。', (t) => ({ kind: 'words', words: ['原文', '放进来'], flow: t, scores: [{ name: '有出处', v: t }] })),
    B('words', '回答末尾写上：来自休假那一页。', (t) => ({ kind: 'words', words: ['来自', '休假那一页'], flow: t, scores: [] })),
    B('flow', '先找，再答。顺序不能反。', (t) => ({ kind: 'flow', n: 2, label: t < 0.5 ? '先找' : '再答', flow: t })),
  ],
  '14': [
    B('flow', '问天气、查日历、写出修改、等人点头，一步都不跳。', (t) => ({ kind: 'flow', n: 4, label: '第 ' + (1 + Math.floor(t * 3.99)) + ' 步', flow: t })),
    B('steps', '四步走完才改完这件事：问、查、写、等。', (t) => ({ kind: 'steps', items: ['问', '查', '写', '等'], on: t * 4, note: '四步', scan: t })),
    B('steps', '问天气是第一步。查日历是第二步。', (t) => ({ kind: 'steps', items: ['1 问天气', '2 查日历'], on: t * 2, note: '先问再查', scan: t })),
    B('steps', '写出修改是第三步。写入之前是第四步，要等人。', (t) => ({ kind: 'steps', items: ['3 写出修改', '4 等人点头'], on: t * 2, note: '第四步停住', scan: t })),
    B('steps', '四步里，只有会改掉日历的那一步等人点头。', (t) => ({ kind: 'steps', items: ['问', '查', '写', '等'], on: t * 4, note: '停在最后一步', scan: t })),
    B('words', '它写下要办的那一件。旁边的人真正去办。', (t) => ({ kind: 'words', words: ['写下', '人去办'], flow: t, scores: [{ name: '结果再写回', v: t }] })),
    B('flow', '办完的结果写回来，它再接着说。', (t) => ({ kind: 'flow', n: Math.round(lerp(1, 4, t)), label: '第 ' + (1 + Math.floor(t * 3.99)) + ' 步', flow: t })),
  ],
  S: [
    B('steps', '只读的查询放行。改数据和花钱的停下来。', (t) => ({ kind: 'steps', items: ['只读放行', '改动要问', '花钱要问'], on: t * 3, note: '分开', scan: t })),
    B('words', '信里那句「把通讯录寄出去」，是会发出去的动作。', (t) => ({ kind: 'words', words: ['通讯录', '寄出去'], flow: t, scores: [{ name: '会真的发出', v: t }] })),
    B('steps', '没有人点头，这个动作就不能做。', (t) => ({ kind: 'steps', items: ['没有点头', '停住'], on: t * 2, note: '门关着', scan: t })),
    B('steps', '有人点头，才放行。点头是这一步的门。', (t) => ({ kind: 'steps', items: ['点头', '放行'], on: t * 2, note: '点头之后', scan: t })),
    B('tally', '四个动作里，该停的是会改东西的那一个，不是四个都停。', (t) => ({ kind: 'tally', big: String(Math.round(lerp(4, 1, t))), unit: '该停下来的', rows: [{ label: '不是每一个', v: lerp(4, 1, t), max: 4 }] })),
  ],
  '15a': [
    B('grid', '边长 224 的图，先按 16 一块一块铺开。', (t) => ({ kind: 'grid', cols: 14, rows: 14, fill: t * 0.3, cap: '小块边长 16' })),
    B('tally', '224 除以 16 正好是 14，没有剩下的边。', (t) => ({ kind: 'tally', big: '14', unit: '224÷16', rows: [{ label: '一条边', v: lerp(0, 14, t), max: 14 }] })),
    B('tally', '14 乘 14。十条边是 140，再加 56，是 196。', (t) => ({ kind: 'tally', big: '196', unit: '14×14', rows: [{ label: '整张的小块', v: lerp(0, 196, t), max: 196 }] })),
    B('grid', '196 个小块铺满以后，每一块当成一个词。', (t) => ({ kind: 'grid', cols: 14, rows: 14, fill: t, cap: Math.round(lerp(0, 196, t)) + ' / 196' })),
    B('words', '这些词和原来的文字排进同一句，一起往下走。', (t) => ({ kind: 'words', words: ['图的词', '文字'], flow: t, scores: [{ name: '196 个一起走', v: t }] })),
  ],
  '15b': [
    B('tally', '5 次里 12 占 4 次，也就是 0.80。15 只占 0.20。', (t) => ({ kind: 'tally', big: lerp(0.2, 0.8, t).toFixed(2), unit: '12 占的比例', rows: [{ label: '4÷5', v: lerp(0.2, 0.8, t), max: 1 }, { label: '1÷5', v: 0.2, max: 1 }] })),
    B('steps', '五次写出来的是 12、12、15、12、12。', (t) => ({ kind: 'steps', items: ['12', '12', '15', '12', '12'], on: t * 5, note: '第五次写完', scan: t })),
    B('tally', '数一数。12 有 4 票，15 有 1 票。', (t) => ({ kind: 'tally', big: '4', unit: '12 的票', rows: [{ label: '12', v: lerp(0, 4, t), max: 5 }, { label: '15', v: t > 0.6 ? 1 : 0, max: 5 }] })),
    B('tally', '4 比 1 大，所以留下 12。', (t) => ({ kind: 'tally', big: '12', unit: '留下', rows: [{ label: '4 票', v: lerp(1, 4, t), max: 5 }, { label: '1 票丢掉', v: 1, max: 5 }] })),
    B('words', '只出现一次的 15，不因为比较大就留下。', (t) => ({ kind: 'words', words: ['15', '只一次', '丢掉'], flow: t, scores: [{ name: '次数不够', v: lerp(1, 0.2, t) }] })),
    B('words', '多写几份，是为了看哪一个反复出现。', (t) => ({ kind: 'words', words: ['反复', '出现'], flow: t, scores: [{ name: '12 出现 4 次', v: t }] })),
  ],
  A: [
    B('words', '读、改、测试、再来。这四步按这个顺序交出去。', (t) => ({ kind: 'words', words: ['读', '改', '测试', '再来'], flow: t, scores: [] })),
    B('steps', '先读相关的段落，这一步还没有改任何东西。', (t) => ({ kind: 'steps', items: ['读相关段落'], on: t, note: '还没改', scan: t })),
    B('steps', '读完再改。改完再跑测试。', (t) => ({ kind: 'steps', items: ['读', '改', '测试'], on: t * 3, note: '这个顺序', scan: t })),
    B('steps', '测试失败，就回到读，再转一圈。', (t) => ({ kind: 'steps', items: ['失败', '回到读', '再改'], on: t * 3, note: '第 ' + (1 + Math.floor(t * 2)) + ' 圈', scan: t })),
    B('steps', '四步都排好：读、改、测试、不行再来。', (t) => ({ kind: 'steps', items: ['读', '改', '测试', '再来'], on: t * 4, note: '排好才能交', scan: t })),
    B('line', '旋钮还是原来那两颗，陡 2.00，起步 1.00。', (t) => ({ kind: 'line', w: 2, b: 1, fall: 1, line: lerp(0.2, 1, t), hot: 'both' })),
    B('words', '交出去的是这个顺序，不是一排新旋钮。', (t) => ({ kind: 'words', words: ['读', '改', '测试'], flow: t, scores: [{ name: '顺序', v: t }] })),
  ],
  '16': [
    B('words', '从一条线走到能看图、能办事，罚分往下走这件事没换。', (t) => ({ kind: 'words', words: ['一条线', '看图', '办事'], flow: t, scores: [{ name: '罚分还在往下', v: lerp(1, 0, t) }] })),
    B('line', '三颗点还在。旋钮从 0 拧回 2.00 和 1.00。', (t) => ({ kind: 'line', w: lerp(0, 2, t), b: lerp(0, 1, t), fall: 1, line: 1, hot: 'both' })),
    B('tally', '罚分从 27.67 走到 0。这个方向没有换。', (t) => ({ kind: 'tally', big: lerp(27.67, 0, t).toFixed(2), unit: '罚分', rows: [{ label: '往下走', v: lerp(27.67, 0, t), max: 28 }] })),
    B('steps', '换过的是要做的事：从一条线，到看图，到办事。', (t) => ({ kind: 'steps', items: ['一条线', '看图', '办事'], on: t * 3, note: '任务换了', scan: t })),
    B('words', '例子把旋钮拧对。这一点从第一站留到这里。', (t) => ({ kind: 'words', words: ['例子', '旋钮', '拧对'], flow: t, scores: [{ name: '没换', v: t }] })),
    B('flow', '一次只核对这一套里的一个想法。', (t) => ({ kind: 'flow', n: Math.round(lerp(1, 8, t)), label: '一个一个核对', flow: t })),
  ],
};
for (const key of Object.keys(EXTRA)) {
  const last = BOARDS[key].pop();
  BOARDS[key].push(...EXTRA[key], last);
}

function shareGrow(names, targets, t) {
  return names.map((name, i) => ({ name, v: targets[i] * t, color: COLS[i % 4] }));
}
function shareHold(names, targets, t) {
  return names.map((name, i) => ({ name, v: targets[i], color: COLS[i % 4], pulse: t }));
}
function shareFromTo(names, a, b, t) {
  return names.map((name, i) => ({ name, v: lerp(a[i], b[i], t), color: COLS[i % 4] }));
}

const html = `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;background:${CARD}}
svg{display:block;width:1280px;height:720px}
</style><svg id="s" viewBox="0 0 1280 720" width="1280" height="720"></svg><script>
const INK=${JSON.stringify(INK)}, NAVY=${JSON.stringify(NAVY)}, CARD=${JSON.stringify(CARD)}, LINK=${JSON.stringify(LINK)};
const GOOD=${JSON.stringify(GOOD)}, HL=${JSON.stringify(HL)}, LINE=${JSON.stringify(LINE)};
const COLS=${JSON.stringify(COLS)};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*clamp(t,0,1);
function tx(x,y,s,size,anchor){
  return '<text x="'+x+'" y="'+y+'" text-anchor="'+(anchor||'start')+'" fill="'+INK+'" font-size="'+(size||28)+'" font-family="sans-serif">'+s+'</text>';
}
function dial(cx,cy,r,value,min,max,name){
  const t=clamp((value-min)/(max-min),0,1);
  const ang=(-140+t*280)*Math.PI/180;
  const x2=cx+Math.sin(ang)*(r-6), y2=cy-Math.cos(ang)*(r-6);
  return '<g><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+CARD+'" stroke="'+NAVY+'" stroke-width="6"/>'
    +'<line x1="'+cx+'" y1="'+cy+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" stroke="'+HL+'" stroke-width="10" stroke-linecap="round"/>'
    +'<circle cx="'+cx+'" cy="'+cy+'" r="7" fill="'+HL+'"/>'
    +tx(cx, cy+r+36, name+' '+value.toFixed(2), 26, 'middle')+'</g>';
}
function lossOf(w,b){
  const pts=[[1,3],[2,5],[3,7]];
  return pts.reduce((s,[x,y])=>s+(w*x+b-y)**2,0)/pts.length;
}
function lossBar(loss){
  const h=28+clamp(loss/28,0,1)*300;
  const top=500-h;
  return '<rect x="800" y="'+top.toFixed(1)+'" width="36" height="'+h.toFixed(1)+'" fill="'+HL+'"/>'
    +tx(818, 100, loss.toFixed(2), 32, 'middle')
    +tx(760, 390, '罚分', 24, 'middle');
}
function chart(m){
  const X=x=>150+x*140, Y=y=>500-y*48;
  let s='<line x1="130" y1="500" x2="680" y2="500" stroke="'+LINE+'" stroke-width="3"/>'
    +'<line x1="130" y1="140" x2="130" y2="500" stroke="'+LINE+'" stroke-width="3"/>'
    +tx(620, 540, '输入', 22)+tx(80, 150, '结果', 22);
  const pts=[[1,3],[2,5],[3,7]];
  for(let i=0;i<3;i++){
    const p=clamp(((m.fall==null?1:m.fall)-i*0.22)/0.3,0,1);
    if(p<=0) continue;
    s+='<circle cx="'+X(pts[i][0])+'" cy="'+lerp(60,Y(pts[i][1]),p).toFixed(1)+'" r="12" fill="'+HL+'"/>';
  }
  if(m.line){
    const grow=m.line===true?1:m.line;
    const x2=lerp(0.4, 3.6, grow);
    s+='<line x1="'+X(0.4)+'" y1="'+Y(m.w*0.4+m.b)+'" x2="'+X(x2)+'" y2="'+Y(m.w*x2+m.b)+'" stroke="'+NAVY+'" stroke-width="10" stroke-linecap="round"/>';
    if(grow<1) s+='<circle cx="'+X(x2)+'" cy="'+(Y(m.w*x2+m.b)-36)+'" r="22" fill="'+NAVY+'"/>';
  }
  if(m.ghost){
    const y=lerp(40, Y(9), m.ghost);
    s+='<circle cx="'+X(4)+'" cy="'+y.toFixed(1)+'" r="12" fill="'+GOOD+'"/>';
    s+=tx(X(4), y-24, '4 → 9', 24, 'middle');
  }
  s+=dial(1040, 200, 58, m.w, -1, 4, '左边 陡');
  s+=dial(1040, 460, 58, m.b, -1, 4, '右边 起步');
  s+=lossBar(lossOf(m.w,m.b));
  return s;
}
function shares(m){
  const items=m.items||[];
  const sum=items.reduce((a,it)=>a+it.v,0);
  let s=tx(80, 90, '加起来 '+sum.toFixed(2), 40);
  items.forEach((it,i)=>{
    const x=90+i*280;
    const h=Math.max(6, it.v*380);
    const wob=it.pulse==null?0:Math.sin(it.pulse*Math.PI*2)*6;
    s+='<rect x="'+x+'" y="'+(500-h+wob)+'" width="120" height="'+h+'" fill="'+it.color+'"/>';
    s+=tx(x+60, 560, it.name, 32, 'middle');
    s+=tx(x+60, 490-h, it.v.toFixed(2), 30, 'middle');
  });
  if(m.warn) s+=tx(80, 140, '少了就不完整', 32);
  const sweep=items[0]&&items[0].pulse!=null?items[0].pulse:null;
  if(sweep!=null) s+='<circle cx="'+lerp(80,1180,sweep).toFixed(1)+'" cy="160" r="20" fill="'+NAVY+'"/>';
  return s;
}
function tally(m){
  let s=tx(80, 150, m.big==null?'':String(m.big), 68);
  if(m.unit) s+=tx(80, 200, m.unit, 28);
  (m.rows||[]).forEach((r,i)=>{
    const y=260+i*90;
    const w=clamp(r.v/r.max,0,1)*820;
    s+='<rect x="80" y="'+y+'" width="'+w.toFixed(1)+'" height="42" fill="'+COLS[i%4]+'"/>';
    s+=tx(90, y+32, r.label, 26);
  });
  return s;
}
function steps(m){
  const items=m.items||[];
  let s='';
  items.forEach((label,i)=>{
    const on=clamp(m.on-i,0,1);
    if(on<=0) return;
    const col=i%2? 150: 150;
    const x=80+(i%3)*380, y=150+Math.floor(i/3)*150;
    s+='<rect x="'+x+'" y="'+y+'" width="'+(40+on*280)+'" height="80" fill="none" stroke="'+COLS[i%4]+'" stroke-width="6"/>';
    s+=tx(x+16, y+50, label, 30);
  });
  s+=tx(80, 620, m.note||'', 32);
  const cursor=m.scan!=null?m.scan*Math.max(1,items.length-1):clamp(m.on,0,Math.max(1,items.length));
  s+='<circle cx="'+lerp(80,1100,m.scan!=null?m.scan:(cursor%3)/3).toFixed(1)+'" cy="'+(140+Math.floor(cursor/3)*40)+'" r="18" fill="'+HL+'"/>';
  return s;
}
function words(m){
  const ws=m.words||[];
  let s='';
  ws.forEach((w,i)=>{
    const x=80+i*200;
    s+='<rect x="'+x+'" y="220" width="170" height="80" fill="none" stroke="'+NAVY+'" stroke-width="4"/>';
    s+=tx(x+85, 270, w, 32, 'middle');
  });
  s+='<circle cx="'+lerp(80,1180,m.flow||0).toFixed(1)+'" cy="160" r="22" fill="'+HL+'"/>';
  (m.scores||[]).forEach((sc,i)=>{
    const w=clamp(sc.v,0,1)*500;
    s+='<rect x="80" y="'+(380+i*70)+'" width="'+w.toFixed(1)+'" height="28" fill="'+COLS[i%4]+'"/>';
    s+=tx(90, 450+i*70, sc.name+' '+(sc.v<=1?sc.v.toFixed(2):sc.v.toFixed(0)), 26);
  });
  return s;
}
function flow(m){
  const n=m.n||1;
  let s='';
  for(let i=0;i<n;i++){
    const x=60+(i%12)*100, y=160+Math.floor(i/12)*90;
    s+='<circle cx="'+x+'" cy="'+y+'" r="16" fill="'+COLS[i%4]+'"/>';
  }
  const f=m.flow==null? (n%12)/12 : m.flow;
  s+='<circle cx="'+lerp(60, 1160, f)+'" cy="520" r="22" fill="'+HL+'"/>';
  s+=tx(80, 600, m.label||'', 36);
  return s;
}
function grid(m){
  const cols=m.cols, rows=m.rows, n=cols*rows;
  const shown=Math.round(clamp(m.fill,0,1)*n);
  const cell=Math.min(36, Math.floor(520/cols));
  let s='';
  for(let i=0;i<shown;i++){
    const c=i%cols, r=Math.floor(i/cols);
    s+='<rect x="'+(80+c*cell)+'" y="'+(80+r*cell)+'" width="'+(cell-3)+'" height="'+(cell-3)+'" fill="'+COLS[(c+r)%4]+'"/>';
  }
  s+=tx(80, 660, (m.cap||'')+'  '+shown+' 块', 32);
  return s;
}
function crowd(m){
  const w=clamp(m.n/48,0,1)*1000;
  let s=tx(80, 90, '点越来越多', 32);
  s+='<rect x="80" y="120" width="'+w.toFixed(1)+'" height="36" fill="'+HL+'"/>';
  for(let i=0;i<m.n;i++){
    const x=80+(i*97)%1100, y=200+((i*53)%360);
    s+='<circle cx="'+x+'" cy="'+y+'" r="14" fill="'+COLS[i%4]+'"/>';
  }
  return s;
}
function frame(m){
  let body='';
  if(m.kind==='line') body=chart(m);
  else if(m.kind==='shares') body=shares(m);
  else if(m.kind==='tally') body=tally(m);
  else if(m.kind==='steps') body=steps(m);
  else if(m.kind==='words') body=words(m);
  else if(m.kind==='flow') body=flow(m);
  else if(m.kind==='grid') body=grid(m);
  else if(m.kind==='crowd') body=crowd(m);
  body+=tx(48, 700, m.cap, 28);
  document.getElementById('s').innerHTML='<rect width="1280" height="720" fill="'+CARD+'"/>'+body;
}
window.render=frame;
</script>`;

function parseVtt(vtt) {
  const cues = [];
  const re = /(\d+):(\d+):(\d+)[,.](\d+)\s+-->\s+(\d+):(\d+):(\d+)[,.](\d+)\s+([\s\S]*?)(?=\n\n|\n*$)/g;
  let m;
  while ((m = re.exec(vtt))) {
    const a = +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000;
    const b = +m[5] * 3600 + +m[6] * 60 + +m[7] + +m[8] / 1000;
    const text = m[9].replace(/\s+/g, '').trim();
    if (text) cues.push({ a, b, text });
  }
  return cues;
}
function tts(text, mp3) {
  const r = spawnSync('edge-tts', ['--voice', 'zh-CN-XiaoxiaoNeural', '--rate=+25%', '--text', text, '--write-media', mp3], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || 'edge-tts failed');
}
function duration(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  return Number(r.stdout.trim());
}
const GAP = 0.2;
function speak(beats, work) {
  const spans = [];
  const files = [];
  let t = 0;
  beats.forEach((b, i) => {
    if (i > 0) {
      const g = beats[i - 1].shot === b.shot ? GAP : 0.5;
      const sil = join(work, `g${i}.m4a`);
      const silR = spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-t', String(g), '-i', 'anullsrc=r=24000:cl=mono', '-c:a', 'aac', '-b:a', '64k', sil], { encoding: 'utf8' });
      if (silR.status !== 0) throw new Error('silence');
      files.push(sil);
      t += g;
    }
    const mp3 = join(work, `s${i}.mp3`);
    tts(b.say, mp3);
    const d = duration(mp3);
    spans.push({ ...b, a: t, b: t + d });
    files.push(mp3);
    t += d;
  });
  return { spans, files, total: t };
}
function concatAudio(files, out) {
  const args = ['-y'];
  files.forEach((f) => args.push('-i', f));
  const parts = files.map((_, i) => `[${i}:a]aresample=24000,aformat=sample_fmts=fltp:channel_layouts=mono[a${i}]`).join(';');
  const cat = files.map((_, i) => `[a${i}]`).join('');
  args.push('-filter_complex', `${parts};${cat}concat=n=${files.length}:v=0:a=1[a]`, '-map', '[a]', '-c:a', 'aac', '-b:a', '64k', out);
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error((r.stderr || '').split('\n').slice(-20).join('\n'));
}
function writeVtt(spans, path) {
  const fmt = (t) => {
    const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`;
  };
  const body = spans.map((s, i) => `${i + 1}\n${fmt(s.a)} --> ${fmt(s.b)}\n${s.say}\n`).join('\n');
  writeFileSync(path, `WEBVTT\n\n${body}`);
}
function motion(mp4) {
  const r = spawnSync('ffmpeg', ['-y', '-i', mp4, '-vf', 'fps=5,scale=160:90', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error('motion');
  const buf = r.stdout;
  const n = 160 * 90 * 3;
  const frames = Math.floor(buf.length / n);
  const diffs = [];
  for (let i = 1; i < frames; i++) {
    let changed = 0;
    const a = i * n, b = (i - 1) * n;
    for (let p = 0; p < n; p += 3) {
      const d = Math.abs(buf[a + p] - buf[b + p]) + Math.abs(buf[a + p + 1] - buf[b + p + 1]) + Math.abs(buf[a + p + 2] - buf[b + p + 2]);
      if (d > 24) changed++;
    }
    diffs.push(changed);
  }
  let still = 0, worst = 0;
  for (const d of diffs) { still = d < 12 ? still + 1 : 0; if (still > worst) worst = still; }
  const sorted = diffs.slice().sort((a, b) => a - b);
  return { frames, worstSec: worst / 5, median: sorted[Math.floor(sorted.length / 2)] || 0 };
}

const POS = { '0': 1, P: 2, '1': 3, '4': 6, '5': 7, '6': 8, '7': 9, '8a': 10, '8b': 11, '9': 12, E: 13, '10': 14, '11': 15, '12': 16, '13': 17, '14': 18, S: 19, '15a': 20, '15b': 21, A: 22, '16': 23 };
const args = process.argv.slice(2).filter((a) => a !== '--speech');
const speechOnly = process.argv.includes('--speech');
const keys = args.length ? args : Object.keys(BOARDS);

if (!speechOnly) {
  var browser = await chromium.launch({ channel: 'chrome', headless: true });
  var page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await page.setContent(html);
}
const fps = 30;
const report = [];
for (const key of keys) {
  const beats = BOARDS[key];
  if (!beats) throw new Error('no board ' + key);
  const work = join(tmpdir(), 'si-rest-' + key);
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  const spoken = speak(beats, work);
  console.log(key, 'speech', spoken.total.toFixed(1) + 's');
  if (speechOnly) {
    report.push({ key, station: POS[key], sec: +spoken.total.toFixed(1) });
    continue;
  }
  if (spoken.total < 40 || spoken.total > 60) throw new Error(key + ' duration ' + spoken.total.toFixed(1) + 's is outside 40–60');
  const spans = spoken.spans;
  writeFileSync(join(outDir, key + '.board.json'), JSON.stringify(spans.map((s) => ({ say: s.say, start: +s.a.toFixed(2), end: +s.b.toFixed(2), shot: s.shot })), null, 2));
  const mp3 = join(work, 'a.m4a');
  concatAudio(spoken.files, mp3);
  const dur = spans[spans.length - 1].b + 0.2;
  const n = Math.ceil(dur * fps);
  for (let i = 0; i < n; i++) {
    const time = i / fps;
    let beat = spans[0];
    for (const s of spans) if (time >= s.a) beat = s;
    const local = time >= beat.b ? 1 : beat.b > beat.a ? clamp((time - beat.a) / (beat.b - beat.a), 0, 1) : 0;
    const model = beat.at(local);
    model.cap = beat.say.replace(/。$/, '');
    await page.evaluate((m) => window.render(m), model);
    await page.locator('#s').screenshot({ path: join(work, String(i).padStart(4, '0') + '.png') });
    if (i % 200 === 0) console.log(key, 'frame', i, '/', n);
  }
  await page.locator('#s').screenshot({ path: join(outDir, key + '.jpg'), type: 'jpeg', quality: 72 });
  const mp4 = join(outDir, key + '.mp4');
  const ff = spawnSync('ffmpeg', ['-y', '-framerate', String(fps), '-i', join(work, '%04d.png'), '-i', mp3,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'baseline', '-level', '3.1',
    '-b:v', '520k', '-maxrate', '700k', '-bufsize', '1400k',
    '-c:a', 'aac', '-b:a', '64k', '-shortest', '-movflags', '+faststart', mp4], { encoding: 'utf8' });
  if (ff.status !== 0) throw new Error((ff.stderr || '').split('\n').slice(-20).join('\n'));
  writeVtt(spans, join(outDir, key + '.vtt'));
  const mot = motion(mp4);
  if (mot.worstSec >= 3) throw new Error(key + ' still ' + mot.worstSec.toFixed(1) + 's');
  const cues = parseVtt(readFileSync(join(outDir, key + '.vtt'), 'utf8'));
  let sync = 0;
  spans.forEach((s, i) => {
    if (!cues[i]) throw new Error(key + ' missing cue');
    sync = Math.max(sync, Math.abs(cues[i].a - s.a));
    if (Math.abs(cues[i].a - s.a) > 0.3) throw new Error(key + ' sync ' + s.shot);
  });
  const bytes = Number(spawnSync('stat', ['-c', '%s', mp4], { encoding: 'utf8' }).stdout.trim());
  if (bytes > 6 * 1048576) throw new Error(key + ' too big');
  const row = { station: POS[key], key, file: 'videos/zh/' + key + '.mp4', sec: +dur.toFixed(1), bytes, worstSec: +mot.worstSec.toFixed(2), sync: +sync.toFixed(3) };
  report.push(row);
  console.log(key, JSON.stringify(row));
}
if (!speechOnly) await browser.close();
writeFileSync('/tmp/clip-report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
