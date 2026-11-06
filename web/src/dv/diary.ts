/* One sourced line per station. Years, names and links are the papers already cited on the station
   or the standard primary source. No invented papers. */
import { tx, type L } from '../l4/txt';

export interface Diary { year: string; who: readonly [string, string]; why: readonly [string, string]; url: string }
export const DIARY: Record<string, Diary> = {
  '0': { year: '1805', who: ['勒让德', 'Legendre'], why: ['用最小二乘把一串观测收成一条能调的曲线。', 'Least squares turns a string of observations into one curve you can tune.'], url: 'https://en.wikipedia.org/wiki/Least_squares' },
  P: { year: '1763', who: ['贝叶斯', 'Bayes'], why: ['在已经知道前文时，再谈下一件事的概率。', 'Probability of the next event once the context is known.'], url: 'https://en.wikipedia.org/wiki/Bayes%27_theorem' },
  '1': { year: '1948', who: ['香农', 'Shannon'], why: ['用 −ln p 给“猜错的概率”一个罚分。', '−ln p is a penalty for the probability of the miss.'], url: 'https://doi.org/10.1002/j.1538-7305.1948.tb01338.x' },
  '2': { year: '1847', who: ['柯西', 'Cauchy'], why: ['只顺着脚下的坡走一小步，去找最低点。', 'Take a small step along the slope underfoot to find the low point.'], url: 'https://en.wikipedia.org/wiki/Gradient_descent' },
  '3': { year: '1969', who: ['明斯基与帕珀特', 'Minsky and Papert'], why: ['一层线性单元算不出异或，于是需要多层和非线性。', 'One linear layer cannot compute XOR, so layers and a bend are needed.'], url: 'https://en.wikipedia.org/wiki/Perceptrons_(book)' },
  '4': { year: '1986', who: ['鲁梅尔哈特、辛顿、威廉姆斯', 'Rumelhart, Hinton and Williams'], why: ['把每一层的坡乘回去，深层网络才训得动。', 'Multiply each layer’s slope back, so a deep net can train.'], url: 'https://doi.org/10.1038/323533a0' },
  '5': { year: '2014', who: ['金马与巴', 'Kingma and Ba'], why: ['Adam 让每个参数自己有步长。', 'Adam gives each parameter its own step size.'], url: 'https://arxiv.org/abs/1412.6980' },
  '6': { year: '2013', who: ['米科洛夫等', 'Mikolov et al.'], why: ['词用向量表示，方向接近的词点积更大。', 'Words as vectors: a larger dot product when directions agree.'], url: 'https://arxiv.org/abs/1301.3781' },
  '7': { year: '2014', who: ['巴赫达瑙、曹、本吉奥', 'Bahdanau, Cho and Bengio'], why: ['生成每个词时回看所有位置，不再只靠一张往下传的纸条。', 'Each new word looks back at every position, not only a note passed forward.'], url: 'https://arxiv.org/abs/1409.0473' },
  '8a': { year: '2017', who: ['瓦斯瓦尼等', 'Vaswani et al.'], why: ['缩放点积注意力：先除以 √d，再变成权重。', 'Scaled dot-product attention: divide by √d, then turn that into weights.'], url: 'https://arxiv.org/abs/1706.03762' },
  '8b': { year: '2021', who: ['苏剑林等', 'Su et al.'], why: ['RoPE 用旋转把相对位置写进 q 和 k。块本身来自 2017 年的 Transformer。', 'RoPE writes relative position into q and k by a rotation. The block itself is the 2017 Transformer.'], url: 'https://arxiv.org/abs/2104.09864' },
  '9': { year: '2018', who: ['拉德福德等', 'Radford et al.'], why: ['先在大量文本上猜下一个词，再拿去做事。', 'First learn to guess the next word on a lot of text, then use that.'], url: 'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf' },
  E: { year: '2018', who: ['王等', 'Wang et al.'], why: ['GLUE 用同一套题比较模型；题泄漏进训练集，分数会虚高。', 'GLUE compares models on one exam. Questions that leaked into training inflate the score.'], url: 'https://arxiv.org/abs/1804.07461' },
  '10': { year: '2022', who: ['欧阳等', 'Ouyang et al.'], why: ['InstructGPT：人比较两份回答，再用这个偏好改模型。', 'InstructGPT: people compare two answers, then the model is changed toward that preference.'], url: 'https://arxiv.org/abs/2203.02155' },
  '11': { year: '2021', who: ['胡等', 'Hu et al.'], why: ['LoRA 冻住大矩阵，只训练旁边一条低秩支路。', 'LoRA freezes the big matrix and trains only a low-rank path beside it.'], url: 'https://arxiv.org/abs/2106.09685' },
  '12': { year: '2022', who: ['波普等', 'Pope et al.'], why: ['前面词元的 K、V 可以存下来，生成时不必重算。', 'K and V of earlier tokens can be stored, so generation does not recompute them.'], url: 'https://arxiv.org/abs/2211.05102' },
  '13': { year: '2020', who: ['刘易斯等', 'Lewis et al.'], why: ['先检索资料再生成，参数一个都不用改。', 'Retrieve passages first, then generate. No parameter has to change.'], url: 'https://arxiv.org/abs/2005.11401' },
  '14': { year: '2022', who: ['姚等', 'Yao et al.'], why: ['ReAct：模型写下下一步，调用工具，再看结果。', 'ReAct: the model writes the next step, calls a tool, then reads the result.'], url: 'https://arxiv.org/abs/2210.03629' },
  S: { year: '2023', who: ['格雷沙克等', 'Greshake et al.'], why: ['网页里的句子可以冒充指令。指令和数据要分开。', 'A sentence in a web page can pretend to be an instruction. Keep instructions apart from data.'], url: 'https://arxiv.org/abs/2302.12173' },
  '15a': { year: '2020', who: ['多索维茨基等', 'Dosovitskiy et al.'], why: ['把图切成小块，每块当成一个词。', 'Cut an image into patches and treat each patch as a word.'], url: 'https://arxiv.org/abs/2010.11929' },
  '15b': { year: '2022', who: ['魏等', 'Wei et al.'], why: ['先把过程写出来，难题的正确率会上去。', 'Writing the steps out first raises accuracy on hard questions.'], url: 'https://arxiv.org/abs/2201.11903' },
  A: { year: '2021', who: ['陈等', 'Chen et al.'], why: ['Codex 说明编程助手仍是在补下一个词，只是词来自代码。', 'Codex shows a coding assistant is still guessing the next token, now from code.'], url: 'https://arxiv.org/abs/2107.03374' },
  '16': { year: '2017', who: ['瓦斯瓦尼等', 'Vaswani et al.'], why: ['这一站是整条链的回顾。那些零件汇合在 Transformer 里。', 'This stop looks back over the chain. The parts meet in the Transformer.'], url: 'https://arxiv.org/abs/1706.03762' },
};

export function diaryLine(key: string, l: L): { year: string; who: string; why: string; url: string } | null {
  const d = DIARY[key]; if (!d) return null;
  return { year: d.year, who: tx(d.who, l), why: tx(d.why, l), url: d.url };
}
