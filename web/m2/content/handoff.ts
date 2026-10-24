/* R11: the hand-off block at the end of every station — where to go deeper, where this sits one level up, which concepts
   used on this page are explained elsewhere (popups), and every lab on this page. build.ts injects it before the
   prev/next bar (between <!--m2h--> markers) so the whole site can be walked from T1 to K5 without the side menu. */
import type { Bi } from '../lib';

type Hop = [string, Bi];
/** xlabs: labs on other stations worth a direct jump from here ([station, lab id]) */
export interface Hand { dn: Hop[]; up: Hop[]; use?: string[]; xlabs?: [string, string][] }
const b = (zh: string, en: string): Bi => ({ zh, en });

export const HAND: Record<string, Hand> = {
  T1: { dn: [['U', b('先学会怎么用 Agent，再拆开看', 'Learn to use an agent first, then take it apart')], ['T2', b('直接拆：一句话背后的 Agent 层', 'Straight in: the agent layer behind one request')], ['Api', b('用代码调模型：API', 'Call a model from code: APIs')], ['Loc', b('在自己电脑上跑模型', 'Run a model on your own computer')], ['Job', b('让 AI 替你干活：按事情挑 Agent', 'Let AI do tasks: pick an agent by job')], ['Skl', b('给 AI 装技能：MCP 和技能包', 'Add skills: MCP and skill packs')], ['Bld', b('自己搭一个 Agent', 'Build your own agent')]], up: [], use: ['attn'], xlabs: [['T7', 'labChin'], ['T3', 'labBpe']] },
  U: { dn: [['Ua', b('第一种用法：你和它一起干', 'Mode one: you work alongside it')], ['Up', b('按用法找具体产品', 'Find real products by mode')]], up: [['T1', b('回到应用全景', 'Back to the big picture')]], use: ['sample', 'kProb'] },
  Ua: { dn: [['Ub', b('第二种用法：放手让它自己干', 'Mode two: let it work on its own')], ['T2', b('它为什么能读文件、跑命令：Agent 循环', 'Why it can read files and run commands: the agent loop')]], up: [['U', b('四种用法总览', 'All four modes')]] },
  Ub: { dn: [['Uc', b('给它装上工具和技能', 'Give it tools and skills')], ['T2', b('自动跑的背后：规划与工具调用', 'Behind autonomy: planning and tool calls')]], up: [['U', b('四种用法总览', 'All four modes')]] },
  Uc: { dn: [['Ud', b('怎么用得好：上下文、检查与安全', 'Using it well: context, checks, safety')], ['T2', b('MCP 和工具调用在 Agent 里的位置', 'Where MCP and tool calls sit in an agent')]], up: [['U', b('四种用法总览', 'All four modes')]] },
  Ud: { dn: [['Up', b('按用法找具体产品', 'Find real products by mode')], ['T3', b('为什么上下文这么重要：模型的上下文窗口', 'Why context matters: the model’s context window')]], up: [['U', b('四种用法总览', 'All four modes')]] },
  Up: { dn: [['Api', b('想把模型接进自己的程序：API 调模型', 'Put a model in your own program: model APIs')], ['T2', b('打开 Agent：里面有哪些部件', 'Open the agent: what parts are inside')]], up: [['U', b('四种用法总览', 'All four modes')]] },
  Api: { dn: [['Loc', b('不想联网调？在自己电脑上跑模型', 'Rather not call the cloud? Run a model on your own computer')], ['T3', b('词元和上下文窗口：钱是怎么算出来的', 'Tokens and the context window: where the bill comes from')]], up: [['T1', b('回到应用全景', 'Back to the big picture')]], use: ['tokenizer', 'ctxwin', 'llm'] },
  Loc: { dn: [['Job', b('模型有了，让 AI 替你干活', 'You have a model; now let AI do tasks')], ['T2', b('模型装好了，Agent 是怎么用它干活的', 'The model runs; how an agent puts it to work')], ['T5', b('量化和 KV 缓存的原理', 'How quantization and the KV cache work')]], up: [['T1', b('回到应用全景', 'Back to the big picture')], ['Api', b('换成云端 API 调用', 'Use a cloud API instead')]], use: ['quant', 'kvcache', 'serve'] },
  Job: { dn: [['Skl', b('想让它多会一件事：装技能', 'Teach it one more thing: add skills')], ['T2', b('打开 Agent：它是怎么动手的', 'Open the agent: how it acts')]], up: [['T1', b('回到应用全景', 'Back to the big picture')], ['U', b('八种用法总览', 'All the modes')]], use: ['uWith', 'uSolo', 'uChat', 'uIde'] },
  Skl: { dn: [['Bld', b('自己搭一个 Agent', 'Build your own agent')], ['T2', b('工具调用的原理', 'How tool calling works')]], up: [['Job', b('先选对帮手', 'Pick the right helper first')], ['Uc', b('工具 vs MCP vs Skills', 'Tools vs MCP vs Skills')]], use: ['uMcp', 'uSkill', 'uTool', 'uPrompt'] },
  Bld: { dn: [['T2', b('拆开 Agent：循环里每个部件', 'Take the agent apart: every part of the loop')], ['T3', b('词元和上下文：钱从哪来', 'Tokens and context: where the cost comes from')]], up: [['Skl', b('给 AI 装技能', 'Add skills to an AI')], ['Api', b('用代码调模型', 'Call a model from code')]], use: ['loop', 'tools', 'toolres'] },
  T2: { dn: [['T3', b('Agent 的大脑是大模型：它怎么一个词一个词地生成', 'The agent’s brain is an LLM: how it generates word by word')]], up: [['T1', b('回到应用全景', 'Back to the big picture')], ['U', b('从使用者角度看 Agent', 'Agents from the user’s side')]], use: ['tokenizer', 'embed', 'prob', 'kVec', 'kProb'] },
  T3: { dn: [['N', b('大模型是神经网络：先看一个神经元和训练循环', 'An LLM is a neural network: one neuron and the training loop')], ['T4', b('流水线中间那摞 Transformer 块', 'The stack of Transformer blocks in the middle')]], up: [['T2', b('谁在调用大模型：Agent', 'Who calls the model: the agent')]], use: ['attn', 'kSoft', 'kEnt'] },
  N: { dn: [['T4', b('把神经元搭成 Transformer 块', 'Neurons assembled into a Transformer block')], ['K1', b('梯度到底怎么算：微积分', 'How gradients are computed: calculus')]], up: [['T3', b('回到大模型全流程', 'Back to the whole LLM pipeline')]], use: ['kGrad', 'kVec'] },
  T4: { dn: [['T4a', b('块里第一步：注意力', 'Step one in the block: attention')], ['T4b', b('块里第二步：前馈与输出', 'Step two: feed-forward and output')]], up: [['T3', b('块在大模型流水线中的位置', 'Where the block sits in the LLM pipeline')]], use: ['embed', 'kVec', 'kSoft', 'kProb'] },
  T4a: { dn: [['T4b', b('注意力之后：前馈层和输出概率', 'After attention: feed-forward and output probabilities')], ['K2', b('Q·K 打分背后：向量与矩阵', 'Behind Q·K scores: vectors and matrices')]], up: [['T4', b('回到一个 Transformer 块', 'Back to one Transformer block')]], use: ['kVec', 'kSoft', 'kProb'] },
  T4b: { dn: [['T5', b('让它更快更省：MoE 与高效架构', 'Make it faster and cheaper: MoE and efficient designs')], ['K3', b('softmax 和交叉熵背后：概率与信息', 'Behind softmax and cross-entropy: probability and information')]], up: [['T4', b('回到一个 Transformer 块', 'Back to one Transformer block')]], use: ['attn', 'kVec', 'kSoft', 'embed'] },
  T5: { dn: [['T6', b('不只文字：图像、语音进来以后', 'Beyond text: when images and audio come in')], ['T7', b('这些模型是怎么训练出来的', 'How these models are trained')]], up: [['T4', b('被替换或加速的是块里的哪一部分', 'Which part of the block is replaced or sped up')]], use: ['tokenizer', 'attn', 'kGrad', 'nLoss', 'kVec', 'kProb'] },
  T6: { dn: [['T7', b('多模态模型同样要训练：训练与强化学习', 'Multimodal models are trained too: training and RL')]], up: [['T3', b('回到大模型全流程', 'Back to the whole LLM pipeline')]], use: ['embed', 'kVec', 'attn', 'kGrad', 'nLoss'] },
  T7: { dn: [['K4', b('梯度下降为什么能收敛：优化', 'Why gradient descent converges: optimisation')], ['T8', b('任何零件都能在这里查到，还有全景图', 'Look up any part here, plus the full map')]], up: [['N', b('一个神经元的训练循环', 'The training loop of one neuron')], ['T3', b('训练出的模型怎么生成', 'How the trained model generates')]], use: ['kSoft', 'kEnt', 'kProb'] },
  T8: { dn: [['K1', b('想看公式？从微积分开始', 'Want the maths? Start with calculus')]], up: [['T1', b('回到应用全景', 'Back to the big picture')]] },
  K1: { dn: [['K2', b('下一块数学：向量与矩阵', 'Next maths: vectors and matrices')]], up: [['N', b('梯度在训练循环里怎么用', 'How gradients are used in training')]], use: ['kSoft', 'kEnt', 'kVec'] },
  K2: { dn: [['K3', b('下一块数学：概率与信息', 'Next maths: probability and information')]], up: [['T4a', b('点积在注意力里怎么用', 'How dot products are used in attention')]], use: ['attn', 'nLoss'] },
  K3: { dn: [['K4', b('下一块数学：优化', 'Next maths: optimisation')]], up: [['T4b', b('softmax 在输出层怎么用', 'How softmax is used at the output')]], use: ['attn'] },
  K4: { dn: [['K5', b('把前面的数学串起来：推导与证明', 'Tie the maths together: derivations and proofs')]], up: [['T7', b('优化在真实训练里怎么用', 'How optimisation is used in real training')]], use: ['kProb'] },
  K5: { dn: [], up: [['K4', b('回到优化', 'Back to optimisation')], ['T7', b('回到训练与强化学习', 'Back to training and RL')], ['T1', b('从头再走一遍', 'Start the tour again')]], use: ['kGrad', 'kVec', 'attn', 'nLoss', 'kProb'] },
};
