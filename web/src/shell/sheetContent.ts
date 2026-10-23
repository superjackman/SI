/* More-sheet content (lazy since R17: loaded when the sheet first opens): the phase banners copied 1:1 from the live page,
   and the icon guide drawn with the same line-icon set the buttons use. */
import { IC } from './common';
import { IC2 } from '../ui/ic2';
export const BANNERS = [
  { cls: "use", id: "useBanner", zh: "▶ <b>使用模式</b>：模型参数全部<b>冻结、只读</b>，系统只是按流程算一遍。点底部“⋯ 更多”里的“🔥 训练时”看看哪些零件里有会被训练调整的参数。", en: "▶ <b>In-use mode</b>: all model parameters are <b>frozen and read-only</b>; the system just runs the computation step by step. Choose “🔥 Training” under “⋯ More” at the bottom to see which parts contain parameters that training adjusts." },
  { cls: "train", id: "trainBanner", zh: "🔥 <b>训练模式</b>：<span style=\"color:#ea580c;font-weight:700\">橙色发光</span> 的零件里有“可学习的数字”（参数）或本身就是训练阶段；变灰的是固定程序、固定公式或现场算出的结果，没有要学的东西。注意：Agent 应用层的大部分是普通程序，不靠梯度训练。", en: "🔥 <b>Training mode</b>: parts that <span style=\"color:#ea580c;font-weight:700\">glow orange</span> contain “learnable numbers” (parameters) or are themselves a training stage; greyed-out parts are fixed programs, fixed formulas or values computed on the fly — nothing to learn. Note: most of the Agent app layer is ordinary code and is not trained with gradients." },
] as const;
const LEG: [string, string, string][] = [
  [IC.prev + IC.next, '上一站 / 下一站', 'Previous / next stop'],
  ['● ● ●', '站点进度（实心 = 当前）', 'Stop progress (filled = current)'],
  [IC.search, '搜索', 'Search'],
  [IC.share, '分享本页', 'Share this page'],
  [IC.menu, '侧栏：全部站点', 'Side menu: all stops'],
  ['🎬', '导览', 'Tour'],
  [IC.drill, '下钻一层', 'Drill down a level'],
  [IC.back, '返回下钻前', 'Back to before the drill'],
  ['ⓘ', '本站说明', 'About this stop'],
  [IC.minus + IC.plus, '缩小 / 放大', 'Zoom out / in'],
  [IC.reset, '复位 / 重来', 'Reset / restart'],
  [IC2.undo, '撤销', 'Undo'],
  [IC.fs, '全屏看图', 'Full-screen diagram'],
  [IC2.chev, '展开卡片', 'Expand card'],
];
const leg = (k: 1 | 2) => LEG.map((r) => `<span><b>${r[0]}</b>${r[k]}</span>`).join('');
export const LEGEND = { zh: leg(1), en: leg(2) };
