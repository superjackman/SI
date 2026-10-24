/* M11 (R23): "⚠️ 容易混淆" cards — each one puts two (or three) easily confused ideas side by side, right after the card
   that teaches them, plus labEmbOut on T4b (the front dictionary vs the back scoring table, on 我爱吃 → ?).
   Facts: GPT-2 small vocabulary 50257 × width 768 and tied input/output embeddings (Radford et al. 2019, the released
   code); Mixtral 8x7B 46.7 B total / 12.9 B per token (Mistral AI announcement, 2023-12-11); the rest is definitions.
   All lab numbers are made-up examples (src/m2/cfmath.ts). Every card has a plain opening in m2/plain/m11.ts. */
import type { Page } from '../../lib';
import { src, type Ext } from './kit';

const PRE = { zh: '⚠️ 容易混淆：', en: '⚠️ Easy to mix up: ' };
/** the card title: prefix + the pair */
const ti = (P: Page, zh: string, en: string) => P.t(PRE.zh + zh, PRE.en + en);
/** a comparison table; row[0] is the row label */
const tb = (head: string[], rows: string[][]) => `<div class="cf-tw"><table class="cmp cf-t"><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><th scope="row">${r[0]}</th>${r.slice(1).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
/** three-way comparisons stack as blocks (a 4-column table does not fit a phone) */
const tri = (cols: { h: string; li: [string, string][] }[]) => `<div class="cf-g">${cols.map((c) => `<div class="cf-c"><p class="cf-ch">${c.h}</p><ul class="pts">${c.li.map(([k, v]) => `<li><b>${k}</b>${v}</li>`).join('')}</ul></div>`).join('')}</div>`;
const one = (P: Page, s: string) => `<p class="cf-one"><b>${P.t('一句话分清：', 'In one line: ')}</b>${s}</p>`;
const mem = (P: Page, s: string) => `<p class="cf-mem">🧠 <b>${P.t('记住：', 'Remember: ')}</b>${s}</p>`;
const ul = (a: string[]) => `<ul class="pts">${a.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const ol = (a: string[]) => `<ol class="pts cf-ol">${a.map((x) => `<li>${x}</li>`).join('')}</ol>`;
const jump = (_P: Page, id: string, S: string, label: string, pri = false) => `<button type="button" class="btn${pri ? ' primary' : ''}" data-sj="${id}" data-sp="${S}">${label}</button>`;
const tryit = (P: Page, ...b: string[]) => `<p class="tryit cf-go"><b>${P.t('👉 接着看：', '👉 See also: ')}</b>${b.join(' ')}</p>`;
const C = { cls: 'cf', zl: ['zcf', { zh: '⚠️ 容易混淆', en: '⚠️ Mix-up' }] as [string, { zh: string; en: string }] };

/* ================= T4b: the front dictionary vs the back scoring table ================= */
function t4b(P: Page) {
  const t = P.t;
  P.card('cfEmbOut', 1, ti(P, '前面的字典 vs 后面的打分表', 'front dictionary vs back score table'),
    one(P, t('<b>前面的字典</b>（词嵌入表）把“词元”变成一串数；<b>后面的打分表</b>（输出层）把一串数变回“下一个词元是谁的可能性”。方向正好相反。',
      'the <b>front dictionary</b> (embedding table) turns a token into a list of numbers; the <b>back scoring table</b> (output layer) turns a list of numbers back into “how likely each token is to come next”. Opposite directions.'))
    + `<p><b>${t('用“我爱吃 → ？”走一遍：', 'Walk through “I love eating → ?”:')}</b></p>`
    + ol([
      t('<b>查字典（不计算）。</b>每个词元有一个编号，字典里每个编号对应一行数，像一张“名片”。“我”“爱”“吃”各取出自己那一行，再加上“排第几个”的位置信息。这张名片是<b>不看上下文的通用意思</b>：它是训练时在所有句子里综合出来的。比如“苹果”的名片里，水果和手机公司两种意思都混在一起。',
        '<b>Look it up (no computing).</b> Each token has an id number, and the dictionary has one row of numbers per id, like a “name card”. “I”, “love” and “eating” each take out their own row, then position information (“which place am I in”) is added. This card is the <b>general meaning, ignoring context</b>: training blends it from every sentence the word appeared in. The card for “apple” mixes the fruit and the phone company.'),
      t('<b>中间层改名片。</b>注意力层让每个位置去看别的位置、取回信息；前馈层让每个位置自己再加工。一层一层改下来，名片变成了“在这句话里的意思”。GPT 这类模型里，每个位置<b>只能看自己和前面的词</b>，看不到后面。',
        '<b>The middle layers rewrite the cards.</b> Attention lets each position look at other positions and take information from them; the feed-forward layer lets each position process it on its own. Layer by layer, the card becomes “what it means in this sentence”. In GPT-style models each position can <b>only see itself and the words before it</b>, never the ones after.'),
      t('<b>只拿最后一个位置去打分。</b>最后一个位置（“吃”）手里那串数，叫它“最后的想法”。它和打分表里<b>每一个</b>词元的那一行做点积（对应位置相乘，再全部加起来），得到每个词元一个分数。训练让这串数学会了表示“<b>下一个词应该长什么样</b>”，而不是“吃”本身的意思，所以“苹果”“米饭”的分数会高。',
        '<b>Only the last position is scored.</b> The numbers held by the last position (“eating”) are its “final thought”. It is dot-multiplied (multiply matching places, then add everything up) with the row of <b>every</b> token in the scoring table, giving every token a score. Training teaches these numbers to mean “<b>what the next word should look like</b>”, not the meaning of “eating” itself, so “apples” and “rice” score high.'),
      t('<b>分数 → 概率 → 抽一个。</b>这些分数叫 logits，softmax 把它们变成加起来是 100% 的概率，再按概率抽一个词元接到句子后面。<b>不一定选分最高的</b>：“温度”越低越爱选第一名，越高越随机。接上以后，整句再走一遍，猜下一个。',
        '<b>Scores → probabilities → pick one.</b> The scores are called logits; softmax turns them into probabilities that add up to 100%, and one token is drawn by those probabilities and appended. <b>The top score is not always chosen</b>: the lower the “temperature”, the more it sticks to first place; the higher, the more random. After appending, the whole sentence goes through again to guess the next one.'),
    ])
    + tb([t('对比', 'Compare'), t('前面的字典（词嵌入表）', 'Front dictionary (embedding table)'), t('后面的打分表（输出层）', 'Back scoring table (output layer)')], [
      [t('方向', 'Direction'), t('词元 → 一串数', 'token → numbers'), t('一串数 → 每个词元的分数', 'numbers → a score for every token')],
      [t('怎么用', 'How it is used'), t('按编号<b>查一行</b>，不计算', '<b>look up one row</b> by id, no computing'), t('和<b>所有行</b>都比一遍（点积）', 'compare with <b>every row</b> (dot product)')],
      [t('用在哪', 'Where'), t('输入的<b>每个</b>位置', '<b>every</b> input position'), t('生成时只用<b>最后一个</b>位置', 'when generating, only the <b>last</b> position')],
      [t('得到', 'Gives'), t('一张名片（通用意思）', 'a name card (general meaning)'), t('一排分数（还不是答案）', 'a row of scores (not the answer yet)')],
      [t('大小', 'Size'), t('每个词一行：词数 × 向量长度。GPT-2：50257 × 768', 'one row per token: vocabulary × width. GPT-2: 50257 × 768'), t('同样多的数（写成乘法时常写成转置 768 × 50257）', 'the same count (in the multiplication often written transposed, 768 × 50257)')],
    ])
    + ul([
      t('两张表<b>可以是同一张</b>（叫“权重绑定”，GPT-2 就是这样），也可以分开。', 'The two tables <b>can be the same one</b> (“weight tying”; GPT-2 does this) or separate.'),
      t('两张表都是<b>训练学出来的</b>，不是人写的。意思相近的词，名片也相近。', 'Both are <b>learned in training</b>, not written by people. Words with similar meanings get similar cards.'),
    ])
    + tryit(P, jump(P, 'labEmbOut', 'T4b', t('🧪 一步步算一遍', '🧪 Step through it'), true), jump(P, 'cfQkOut', 'T4b', t('注意力的 Q·K vs 打分', 'Attention Q·K vs scoring')), jump(P, 'tieCard', 'T4b', t('能共用一张吗', 'Can they be shared?'))),
    C);
  P.card('cfQkOut', 1, ti(P, '注意力的 Q·K vs 最后的打分', 'attention’s Q·K vs the final scoring'),
    one(P, t('两边用的是<b>同一种比较方法</b>：点积，算“像不像”。可以把“最后的想法”看成 Q（提问），把打分表的每一行看成 K（标签）。但比的对象、用途完全不同。',
      'both use <b>the same way of comparing</b>: the dot product, which measures “how alike”. You can see the “final thought” as a Q (question) and each row of the scoring table as a K (label). But what they compare against, and what for, are completely different.'))
    + tb([t('对比', 'Compare'), t('注意力：Q 对 K', 'Attention: Q vs K'), t('输出：想法对打分表', 'Output: thought vs table')], [
      [t('和谁比', 'Against whom'), t('句子里<b>已有的词</b>（几个到几千个，随句子变）', 'the <b>words already in the sentence</b> (a few to thousands, changes with the sentence)'), t('<b>整个词表</b>（几万个，固定）', 'the <b>whole vocabulary</b> (tens of thousands, fixed)')],
      [t('Q 和 K 哪来', 'Where Q and K come from'), t('每次现做：词的向量乘学来的表 W<sub>Q</sub>、W<sub>K</sub>（W 就是一张学出来的数字表）', 'made on the fly: each word’s vector times the learned tables W<sub>Q</sub>, W<sub>K</sub> (W is just a learned table of numbers)'), t('“想法”直接拿来用；打分表本身就是固定的 K', 'the “thought” is used directly; the table itself is a fixed set of K')],
      [t('有没有 V', 'Is there a V'), t('有：按分数把每个词的 V（内容）<b>都取一点</b>，混在一起', 'yes: take <b>a bit of every</b> word’s V (content) by the scores and blend'), t('没有：分数本身就是结果', 'no: the scores are the result')],
      [t('结果', 'Result'), t('一串新数，交给下一层继续改', 'new numbers, passed on to the next layer'), t('挑出一个词元，接到句子后面', 'one token is picked and appended')],
    ])
    + mem(P, t('注意力是<b>往回看</b>，从已有的词里<b>取信息</b>；打分表是<b>往前猜</b>，从词表里<b>挑一个词</b>接上。同一种“比像不像”，一个用来汇总，一个用来做选择。',
      'attention <b>looks back</b> and <b>takes information</b> from the words already there; the scoring table <b>guesses forward</b> and <b>picks one word</b> to append. The same “how alike” test: one gathers, one chooses.'))
    + tryit(P, jump(P, 'cfQKV', 'T4a', t('Q、K、V 各管什么', 'What Q, K and V each do')), jump(P, 'labEmbOut', 'T4b', t('🧪 一步步算一遍', '🧪 Step through it'))),
    C);
  P.lab('labEmbOut', t('我爱吃 → ？：从查字典到抽一个词', 'I love eating → ?: from dictionary lookup to drawing a word'),
    t('所有数字都是<b>举例用的玩具数字</b>：只有 5 个人起了名字的维度，好让你看懂；真实模型有成百上千个没有名字的维度，也有几万个词。步骤和真实模型一样。', 'All numbers are <b>made-up toy numbers</b>: only 5 dimensions, given names so you can read them; real models have hundreds or thousands of unnamed dimensions and tens of thousands of words. The steps are the real ones.'),
    [t('5 个维度：像食物、像动作、像人、像物品、位置。名片和打分表的每一行都是 5 个数。', '5 dimensions: food, action, person, object, position. Every card and every row of the scoring table has 5 numbers.'),
      t('“改名片”用两层玩具规则：先看自己和前面的词（注意力，按点积分配看多少），再按一条固定小规则加工（前馈），每次都是在原来的数上<b>加</b>改动。', '“Rewriting” uses two toy layers: first look at itself and the earlier words (attention, sharing out by dot product), then apply a fixed little rule (feed-forward); each time the change is <b>added</b> to the old numbers.'),
      t('点积：两串数对应位置相乘，再全部加起来。softmax：每个分数先除以温度 T，再算 e（约 2.718）的这么多次方，最后除以总和，所以加起来正好 100%。', 'Dot product: multiply matching places and add it all up. Softmax: divide each score by the temperature T, raise e (about 2.718) to that power, then divide by the total, so they add up to exactly 100%.')],
    `<div class="eo-steps" role="group" aria-label="${t('步骤', 'Steps')}">${[t('① 查名片', '① Look up'), t('② 改名片', '② Rewrite'), t('③ 打分', '③ Score'), t('④ 变概率', '④ Probabilities'), t('⑤ 抽一个', '⑤ Draw')].map((s, i) => `<button type="button" class="btn${i ? '' : ' on'}" data-eo="${i}" aria-pressed="${i ? 'false' : 'true'}">${s}</button>`).join('')}</div>
<div id="eoOut" class="k-out eo-out" aria-live="polite"></div>
<p class="bp-nav"><button type="button" class="btn" id="eoPrev">${t('◀ 上一步', '◀ Back')}</button><button type="button" class="btn primary" id="eoNext">${t('下一步 ▶', 'Next ▶')}</button></p>`,
    [t('第 ③ 步：拿“吃”<b>原来的名片</b>去打分，“跑步”会赢（因为它也像动作）；拿改过的“最后的想法”打分，食物才赢。这就是中间层的作用。', 'Step ③: scoring with the <b>original card</b> of “eating” makes “running” win (it is also an action); scoring with the rewritten final thought makes the foods win. That is what the middle layers are for.'),
      t('第 ④ 步：把温度拖到 0.2，第一名几乎拿走全部概率；拖到 2，分数接近的几种食物差不多一样多。', 'Step ④: drag the temperature to 0.2 and first place takes almost everything; drag it to 2 and the close foods become nearly equal.'),
      t('第 ⑤ 步：点“抽 20 次”，第一名也不是每次都中。', 'Step ⑤: tap “Draw 20 times”: even first place does not win every time.')]);
}
function t4bLogit(P: Page) {
  const t = P.t;
  P.card('cfLogitProb', 1, ti(P, '分数（logits）vs 概率', 'scores (logits) vs probabilities'),
    one(P, t('分数是打分表直接算出来的原始数字；概率是 softmax 把分数“换算”成的百分比。', 'scores are the raw numbers the scoring table produces; probabilities are the percentages softmax converts them into.'))
    + tb([t('对比', 'Compare'), t('分数 logits', 'Scores (logits)'), t('概率', 'Probabilities')], [
      [t('范围', 'Range'), t('任何数，可正可负', 'any number, positive or negative'), t('0 到 1（0% 到 100%）', '0 to 1 (0% to 100%)')],
      [t('加起来', 'Sum'), t('不等于任何固定值', 'nothing in particular'), t('正好 100%', 'exactly 100%')],
      [t('什么有意义', 'What matters'), t('只有<b>差距</b>有意义：所有分数一起加 5，概率一点不变', 'only the <b>gaps</b>: add 5 to every score and the probabilities do not change at all'), t('每个数就是“抽中它的机会”', 'each number is “the chance of drawing it”')],
      [t('谁算出来', 'Made by'), t('最后的想法和打分表做点积', 'the final thought dot the scoring table'), t('softmax（还会受温度影响）', 'softmax (also affected by temperature)')],
    ])
    + ul([t('例子：分数 2、1、0 → 概率约 67%、24%、9%。分数 2 是 1 的两倍，概率却差不多是 2.7 倍（e 的 1 次方），<b>不是两倍</b>。', 'Example: scores 2, 1, 0 → probabilities about 67%, 24%, 9%. A score of 2 is twice 1, yet its probability is about 2.7 times as big (e to the power 1), <b>not twice</b>.')])
    + tryit(P, jump(P, 'labEmbOut', 'T4b', t('🧪 自己拖温度看', '🧪 Drag the temperature yourself'))),
    C);
}

/* ================= T4a: Q, K, V ================= */
function t4a(P: Page) {
  const t = P.t;
  P.card('cfQKV', 1, ti(P, 'Q、K、V 各管什么', 'what Q, K and V each do'),
    one(P, t('每个词都同时做三张卡：Q 是“我在找什么”，K 是“我身上贴的标签”，V 是“被找到后我交出的内容”。Q 和 K 用来打分，V 用来交东西。', 'every word makes three cards at once: Q is “what am I looking for”, K is “the label on me”, V is “what I hand over when I am picked”. Q and K make the scores; V is what gets handed over.'))
    + tb([t('卡', 'Card'), t('它回答', 'It answers'), t('用在', 'Used for')], [
      [t('Q 提问卡', 'Q question'), t('“我想找什么样的词？”', '“What kind of word am I looking for?”'), t('和每个词的 K 做点积，打分', 'dot with every word’s K to score')],
      [t('K 标签卡', 'K label'), t('“我能回答什么样的问题？”', '“What questions can I answer?”'), t('被别人的 Q 拿来比', 'compared by others’ Q')],
      [t('V 内容卡', 'V content'), t('“被看中后我交出什么？”', '“What do I give when chosen?”'), t('按分数（换成百分比后）混在一起', 'blended by the scores (as percentages)')],
    ])
    + ul([
      t('三张卡都从<b>同一个词</b>的向量来：分别乘三张学出来的表 W<sub>Q</sub>、W<sub>K</sub>、W<sub>V</sub>（W 是一张数字表，训练学出来）。', 'All three come from <b>the same word’s</b> vector, times three learned tables W<sub>Q</sub>, W<sub>K</sub>, W<sub>V</sub> (W is a table of numbers learned in training).'),
      t('Q、K、V <b>不是三个不同的词</b>：每个词都有自己的一套 Q、K、V。', 'Q, K and V are <b>not three different words</b>: every word has its own Q, K and V.'),
      t('<b>K 和 V 不一样</b>：“对得上”（K）和“交出的内容”（V）是分开学的，好比书脊上的标题和书里的内容。', '<b>K is not V</b>: “matching” (K) and “what is handed over” (V) are learned separately, like the title on a book’s spine and what is inside.'),
      t('打分<b>只用 Q 和 K</b>，V 不参与打分。', 'Scoring uses <b>only Q and K</b>; V takes no part in it.'),
    ])
    + tryit(P, jump(P, 'labAttn', 'T4a', t('🧪 注意力游乐场', '🧪 Attention playground')), jump(P, 'cfQkOut', 'T4b', t('Q·K vs 最后的打分', 'Q·K vs the final scoring'))),
    C);
}

/* ================= T4: attention vs feed-forward ================= */
function t4(P: Page) {
  const t = P.t;
  P.card('cfAttnFfn', 1, ti(P, '注意力 vs 前馈网络', 'attention vs the feed-forward network'),
    one(P, t('注意力是词和词之间<b>互相传话</b>；前馈网络是每个词<b>自己埋头想</b>，不看别的词。', 'attention is words <b>passing notes to each other</b>; the feed-forward network is each word <b>thinking on its own</b>, without looking at others.'))
    + tb([t('对比', 'Compare'), t('注意力', 'Attention'), t('前馈网络（FFN）', 'Feed-forward (FFN)')], [
      [t('看别的词吗', 'Looks at other words?'), t('看（GPT 类只看前面）', 'yes (GPT-style: only earlier ones)'), t('不看，每个位置单独算', 'no, each position on its own')],
      [t('干什么', 'Job'), t('把相关词的信息搬过来', 'bring in information from related words'), t('对每个位置的数再加工', 'further process each position’s numbers')],
      [t('参数多少', 'Parameters'), t('常见设计里约占一块的 1/3', 'about 1/3 of a block in the common design'), t('常见设计里约占 2/3（中间层放大到 4 倍宽）', 'about 2/3 in the common design (the middle is 4× wider)')],
    ])
    + tryit(P, jump(P, 'c_T4a_0', 'T4a', t('注意力内部', 'Inside attention')), jump(P, 'c_T4b_0', 'T4b', t('前馈网络', 'Feed-forward'))),
    C);
}

/* ================= T3 ================= */
function t3Pipe(P: Page) {
  const t = P.t;
  P.card('cfEmbPos', 1, ti(P, '词嵌入 vs 位置信息', 'token embedding vs position'),
    one(P, t('词嵌入告诉模型“<b>这是什么词</b>”，位置信息告诉它“<b>排在第几个</b>”。', 'the embedding tells the model “<b>which word this is</b>”; position information tells it “<b>which place it is in</b>”.'))
    + tb([t('对比', 'Compare'), t('词嵌入', 'Embedding'), t('位置信息', 'Position')], [
      [t('取决于', 'Depends on'), t('词元的编号', 'the token’s id'), t('第几个位置', 'which place')],
      [t('同一个词换个位置', 'Same word, new place'), t('一样', 'the same'), t('不一样', 'different')],
      [t('怎么进模型', 'How it gets in'), t('查表取一行', 'look up one row'), t('原版 Transformer、GPT-2：加到词嵌入上；很多新模型用 RoPE：在注意力里转动 Q 和 K', 'original Transformer, GPT-2: added to the embedding; many newer models use RoPE: rotate Q and K inside attention')],
    ])
    + ul([t('为什么要位置：注意力本身不管顺序，没有位置信息，“狗咬人”和“人咬狗”在它眼里差不多。', 'Why position is needed: attention itself ignores order; without position, “dog bites man” and “man bites dog” look almost the same to it.')])
    + tryit(P, jump(P, 'cfEmbOut', 'T4b', t('前面的字典 vs 后面的打分表', 'Front dictionary vs back scoring table'), true), jump(P, 'xRope', 'T4a', 'RoPE')),
    C);
}
function t3Tok(P: Page) {
  const t = P.t;
  P.card('cfTok', 1, ti(P, '词元 vs 字和词', 'tokens vs characters and words'),
    one(P, t('模型读的不是“字”也不是“词”，而是<b>词元</b>（token）：分词器切出来的小块，可能是一个字、半个词、一整个词，甚至一个空格或标点。', 'a model reads neither “characters” nor “words” but <b>tokens</b>: chunks a tokenizer cuts out, which may be one character, half a word, a whole word, or even a space or punctuation mark.'))
    + tb([t('对比', 'Compare'), t('词元', 'Token'), t('字 / 词', 'Character / word')], [
      [t('谁定的', 'Who decides'), t('分词器：按训练文本里谁常一起出现统计出来', 'the tokenizer: counted from what often appears together in training text'), t('语言本身、字典', 'the language, the dictionary')],
      [t('大小', 'Size'), t('不固定：常见的一块，少见的拆成好几块', 'varies: common ones are one chunk, rare ones split into several'), t('一个字就是一个字', 'a character is a character')],
      [t('拿来算什么', 'Counts for'), t('上下文长度、收费、速度都按词元数算', 'context length, pricing and speed all count tokens'), t('—', '—')],
    ])
    + ul([t('同一句话，换一个模型（换一个分词器），词元数也会变。英文里常见的粗略估计是 1 个词元约等于 3/4 个单词。', 'The same sentence gives a different token count with a different model (tokenizer). For English a common rough guide is 1 token ≈ 3/4 of a word.')])
    + tryit(P, jump(P, 'labTok', 'T3', t('🧪 打一句话看切法', '🧪 Type a sentence, see the cuts'), true)),
    C);
}
function t3Ctx(P: Page) {
  const t = P.t;
  P.card('cfParamTok', 1, ti(P, '参数量（7B）vs 上下文长度（128K）', 'parameters (7B) vs context (128K)'),
    one(P, t('“7B”说的是模型里有多少个学出来的数（70 亿个参数），像一本书有多厚；“128K”说的是一次最多能读进多少个词元，像桌面一次能摊开多少页。两件事无关。', '“7B” is how many learned numbers the model holds (7 billion parameters), like how thick a book is; “128K” is the most tokens it can read in at once, like how many pages fit open on the desk. Two unrelated things.'))
    + tb([t('对比', 'Compare'), t('参数量', 'Parameters'), t('上下文长度', 'Context length')], [
      [t('单位', 'Unit'), t('B = 十亿个数（不是字节）', 'B = billion numbers (not bytes)'), t('K ≈ 千个词元（128K 约 13 万）', 'K ≈ thousand tokens (128K ≈ 130,000)')],
      [t('什么时候定', 'Fixed when'), t('训练时；用的时候不变', 'in training; unchanged in use'), t('上限由模型定，每次实际用多少不一样', 'the limit is set by the model; each request uses a different amount')],
      [t('占显存', 'Memory'), t('权重：7B 个数 × 每个 2 字节 ≈ 14 GB', 'weights: 7B numbers × 2 bytes ≈ 14 GB'), t('KV 缓存：读得越长占得越多', 'KV cache: the longer the input, the more')],
      [t('影响', 'Affects'), t('能力、知识', 'skill and knowledge'), t('能一次看多长的材料', 'how long a text it can see at once')],
    ])
    + tryit(P, jump(P, 'labKv', 'T5', t('🧪 显存计算器', '🧪 Memory calculator'))),
    C);
}
function t3Train(P: Page) {
  const t = P.t;
  P.card('cfTrainUse', 1, ti(P, '训练 vs 使用（推理）', 'training vs using it (inference)'),
    one(P, t('训练是<b>改参数</b>，让模型学会；使用（推理）是<b>参数不动</b>，只拿它来接龙。你和它聊天时，它的参数不会变。', 'training <b>changes the parameters</b> so the model learns; using it (inference) <b>leaves the parameters alone</b> and just plays the word chain. While you chat with it, its parameters do not change.'))
    + tb([t('对比', 'Compare'), t('训练', 'Training'), t('使用（推理）', 'Use (inference)')], [
      [t('参数', 'Parameters'), t('每一步都在改', 'change every step'), t('只读，不改', 'read only')],
      [t('一步做什么', 'One step'), t('猜下一个词 → 对答案 → 往对的方向改参数', 'guess the next word → check the answer → nudge the parameters'), t('猜下一个词 → 接上 → 再猜', 'guess the next word → append → guess again')],
      [t('多久做一次', 'How often'), t('很少，很贵：大模型要很多 GPU 跑很久', 'rarely, expensively: big models need many GPUs for a long time'), t('你每问一次都在发生', 'every time you ask')],
    ])
    + ul([
      t('在提示词里给几个例子（上下文学习）、写系统提示，都属于<b>使用</b>，不是训练。', 'Putting examples in the prompt (in-context learning) or writing a system prompt is <b>use</b>, not training.'),
      t('聊天产品的“记忆”功能，通常是把信息存在模型外面，下次放进上下文，也不是改参数。', 'A chat product’s “memory” usually stores information outside the model and puts it back into the context next time; that does not change parameters either.'),
    ])
    + tryit(P, jump(P, 'cfStages', 'T7', t('预训练 vs 微调 vs 偏好对齐', 'Pretraining vs fine-tuning vs preference tuning'))),
    C);
}
function t3Dec(P: Page) {
  const t = P.t;
  P.card('cfTempTopP', 1, ti(P, '温度 vs top-p', 'temperature vs top-p'),
    one(P, t('温度改的是概率的<b>形状</b>（拉开还是压平）；top-p 改的是<b>候选名单</b>（把排在后面的词划掉）。', 'temperature changes the <b>shape</b> of the probabilities (spread out or flattened); top-p changes the <b>candidate list</b> (crossing out the words at the back).'))
    + tb([t('对比', 'Compare'), t('温度 T', 'Temperature T'), 'top-p'], [
      [t('怎么做', 'How'), t('每个分数先除以 T，再变成概率', 'divide every score by T, then turn into probabilities'), t('从高到低把概率加起来，加到 p（比如 0.9）就停，只在这些词里抽', 'add probabilities from the top down until they reach p (say 0.9), and draw only among those')],
      [t('调小', 'Smaller'), t('第一名越来越占优；接近 0 时几乎总选第一', 'first place dominates more; near 0 it almost always picks first'), t('名单越短，越保守', 'shorter list, more conservative')],
      [t('调大', 'Larger'), t('越平均，越随机', 'flatter, more random'), t('p = 1 时一个都不划掉', 'p = 1 crosses out nothing')],
    ])
    + ul([t('top-k 是另一种划名单：只留前 k 个。很多实现是先用温度调概率，再做 top-k / top-p 截断。', 'top-k is another way to cut the list: keep only the first k. Many implementations apply temperature first, then the top-k / top-p cut.')])
    + tryit(P, jump(P, 'labNext', 'T3', t('🧪 接龙大师：自己调', '🧪 Word-chain master: try it'), true)),
    C);
}

/* ================= T7 ================= */
function t7(P: Page) {
  const t = P.t;
  P.card('cfStages', 1, ti(P, '预训练 vs 微调 vs 偏好对齐', 'pretraining vs fine-tuning vs RLHF'),
    one(P, t('三步<b>都是训练</b>（都会改参数），只是用的材料和目的不同：先读遍图书馆，再跟老师做例题，最后照老师的打分改进。', 'all three <b>are training</b> (all change parameters); they differ in material and goal: first read the whole library, then do worked examples with a teacher, then improve by the teacher’s grades.'))
    + tri([
      { h: t('① 预训练', '① Pretraining'), li: [[t('材料：', 'Data: '), t('海量普通文本（网页、书、代码）', 'huge amounts of ordinary text (web, books, code)')], [t('学会：', 'Learns: '), t('语言和知识，会接龙', 'language and knowledge; can continue text')], [t('成本：', 'Cost: '), t('最贵、最久', 'the most expensive and longest')]] },
      { h: t('② 监督微调（SFT）', '② Supervised fine-tuning (SFT)'), li: [[t('材料：', 'Data: '), t('人写的“问题 + 好回答”示范', 'human-written “question + good answer” examples')], [t('学会：', 'Learns: '), t('按指令回答的格式和习惯', 'the format and habits of following instructions')], [t('成本：', 'Cost: '), t('数据少得多', 'far less data')]] },
      { h: t('③ 偏好对齐（RLHF 等）', '③ Preference tuning (RLHF etc.)'), li: [[t('材料：', 'Data: '), t('对几个回答排好坏，或能自动判对错的题', 'rankings of several answers, or problems whose answers can be checked')], [t('学会：', 'Learns: '), t('更有用、更安全、更合人意', 'more helpful, safer, closer to what people prefer')], [t('方法：', 'Methods: '), t('RLHF 用奖励模型 + 强化学习；DPO 不需要单独的奖励模型', 'RLHF uses a reward model + reinforcement learning; DPO needs no separate reward model')]] },
    ])
    + ul([t('不是每个模型都三步全做，顺序和做法各家不同。', 'Not every model does all three, and the order and methods vary.')])
    + tryit(P, jump(P, 'labDpo', 'T7', t('🧪 DPO 怎么算', '🧪 How DPO is computed'))),
    C);
}

/* ================= T2 ================= */
function t2Tool(P: Page) {
  const t = P.t;
  P.card('cfAgentLlm', 1, ti(P, '大模型 vs Agent', 'the model vs the agent'),
    one(P, t('大模型只会“输入文字 → 输出文字”；Agent 是包在它外面的<b>程序</b>，一圈一圈地问模型、照它写的去调用工具、再把结果喂回去。', 'the model only does “text in → text out”; the agent is the <b>program</b> around it that asks the model again and again, calls tools as the model wrote, and feeds the results back.'))
    + tb([t('对比', 'Compare'), t('大模型', 'Model'), 'Agent'], [
      [t('是什么', 'What'), t('一个猜下一个词的网络', 'a network that guesses the next word'), t('一段循环调用模型的程序', 'a program that calls the model in a loop')],
      [t('能上网、跑代码吗', 'Can it browse, run code?'), t('自己不能：只能写出“想调用哪个工具、参数是什么”', 'not by itself: it can only write “which tool, with what arguments”'), t('能：真正执行工具的是它', 'yes: it is what actually runs the tools')],
      [t('会自己停吗', 'When does it stop?'), t('写完一段回复就停', 'when one reply is written'), t('按程序规则：任务完成或到步数上限', 'by its rules: task done or step limit hit')],
    ])
    + tryit(P, jump(P, 'labAgent', 'T2', t('🧪 Agent 沙盒', '🧪 Agent sandbox'))),
    C);
}
function t2Rag(P: Page) {
  const t = P.t;
  P.card('cfCtxMem', 1, ti(P, '上下文 vs 记忆/RAG vs 微调', 'context vs memory/RAG vs fine-tuning'),
    one(P, t('模型<b>只看得见上下文里的字</b>。记忆和 RAG 是把资料存在外面，用的时候查出来<b>放进上下文</b>；只有微调才真正<b>改参数</b>。', 'the model <b>only sees the text in its context</b>. Memory and RAG keep material outside and, when needed, <b>put it into the context</b>; only fine-tuning actually <b>changes parameters</b>.'))
    + tri([
      { h: t('上下文窗口', 'Context window'), li: [[t('是什么：', 'What: '), t('这一次请求里模型能看到的全部文字', 'all the text the model sees in this one request')], [t('能存多久：', 'Lasts: '), t('这次结束、或被挤出窗口就没了', 'gone when the request ends or it scrolls out')]] },
      { h: t('记忆 / RAG', 'Memory / RAG'), li: [[t('是什么：', 'What: '), t('模型外面的资料库，按需要查', 'a store outside the model, searched as needed')], [t('能存多久：', 'Lasts: '), t('一直在，直到被删', 'until deleted')], [t('改参数吗：', 'Changes parameters? '), t('不改', 'no')]] },
      { h: t('微调', 'Fine-tuning'), li: [[t('是什么：', 'What: '), t('再训练一下，把东西学进参数', 'more training, learning it into the parameters')], [t('改参数吗：', 'Changes parameters? '), t('改', 'yes')], [t('适合：', 'Good for: '), t('学习惯和风格；常变的事实更适合 RAG', 'habits and style; facts that change are better served by RAG')]] },
    ])
    + tryit(P, jump(P, 'labRag', 'T2', t('🧪 RAG 小游乐场', '🧪 RAG playground')), jump(P, 'c_T3_4', 'T3', t('上下文窗口', 'Context window'))),
    C);
}

/* ================= N ================= */
function nParts(P: Page) {
  const t = P.t;
  P.card('cfParamAct', 1, ti(P, '参数、权重、激活值、激活函数', 'parameters vs weights vs activations'),
    one(P, t('参数和权重是模型<b>学来并存下</b>的数；激活值是每次输入<b>算到半路</b>的临时结果；激活函数是一条<b>固定的规则</b>（比如负数变 0）。', 'parameters and weights are the numbers the model <b>learned and keeps</b>; activations are the <b>temporary results halfway</b> through each input; an activation function is a <b>fixed rule</b> (such as “negatives become 0”).'))
    + tb([t('名字', 'Name'), t('是什么', 'What it is'), t('会变吗', 'Does it change?')], [
      [t('参数', 'Parameters'), t('模型里所有学出来的数（权重 + 偏置等）', 'every learned number in the model (weights + biases etc.)'), t('训练时改，用的时候不变', 'changed in training, fixed in use')],
      [t('权重', 'Weights'), t('参数里最主要的一种：连线上的乘数。平时常拿来当“参数”的同义词（如“开源权重”）', 'the main kind of parameter: the multipliers on connections. Often used to mean “parameters” (as in “open weights”)'), t('同参数', 'same as parameters')],
      [t('激活值', 'Activations'), t('某次输入在网络里算出的中间结果', 'the in-between results one input produces inside the network'), t('每次输入都不同，算完就丢（训练时暂存，反向传播要用）', 'different for every input, thrown away after (kept during training for backprop)')],
      [t('激活函数', 'Activation function'), t('一条固定的弯曲规则，如 ReLU：负数变 0', 'a fixed bending rule, e.g. ReLU: negatives become 0'), t('通常不学，不变', 'usually not learned, fixed')],
    ])
    + tryit(P, jump(P, 'labNeuron', 'N', t('🧪 一个神经元', '🧪 One neuron')), jump(P, 'labAct', 'N', t('🧪 激活函数对比', '🧪 Activation functions'))),
    C);
}

/* ================= T5 ================= */
function t5(P: Page) {
  const t = P.t;
  P.card('cfMoeParams', 1, ti(P, 'MoE 的总参数 vs 每次用到的参数', 'MoE total vs active parameters'),
    one(P, t('MoE 模型的参数要<b>全部装下</b>，但每个词元只<b>叫醒其中几个专家</b>来算。所以“总参数”管显存，“激活参数”管计算量。', 'an MoE model must <b>store all</b> its parameters, but each token only <b>wakes a few experts</b> to compute. So “total parameters” sets the memory and “active parameters” sets the compute.'))
    + tb([t('对比', 'Compare'), t('总参数', 'Total'), t('激活参数（每个词元）', 'Active (per token)')], [
      [t('决定', 'Decides'), t('要多少显存来装', 'how much memory to hold it'), t('每个词元算多少、多快', 'how much compute per token, how fast')],
      [t('Mixtral 8x7B', 'Mixtral 8x7B'), t('约 467 亿', 'about 46.7 B'), t('约 129 亿', 'about 12.9 B')],
    ])
    + ul([t('“8x7B”不等于 560 亿：8 个专家只是前馈部分，注意力等部分大家共用。', '“8x7B” is not 56 B: the 8 experts are only the feed-forward parts; attention and the rest are shared.')])
    + src(P, [['https://mistral.ai/news/mixtral-of-experts', 'Mistral AI, Mixtral of experts (2023)']])
    + tryit(P, jump(P, 'labMoe', 'T5', t('🧪 MoE 派单模拟', '🧪 MoE routing sim'))),
    C);
}

export const M11: Ext = {
  parts: {},
  cards: {},
  near: {
    T4b: [{ after: 'dotCard', f: t4b }, { after: 'c_T4b_4', f: t4bLogit }],
    T4a: [{ after: 'c_T4a_3', f: t4a }],
    T4: [{ after: 'c_T4_1', f: t4 }],
    T3: [{ after: 'c_T3_2', f: t3Pipe }, { after: 'c_T3_3', f: t3Tok }, { after: 'c_T3_4', f: t3Ctx }, { after: 'c_T3_5', f: t3Train }, { after: 'xDecode', f: t3Dec }],
    T7: [{ after: 'rlhfCard', f: t7 }],
    T2: [{ after: 'toolCard', f: t2Tool }, { after: 'ragCard', f: t2Rag }],
    N: [{ after: 'c_N_1', f: nParts }],
    T5: [{ after: 'moeCard', f: t5 }],
  },
  quiz: () => ({}),
};
/** every card / lab id M11 adds, by station (tests and the audit list read this) */
export const CF_IDS: Record<string, string[]> = {
  T4b: ['cfEmbOut', 'cfQkOut', 'labEmbOut', 'cfLogitProb'], T4a: ['cfQKV'], T4: ['cfAttnFfn'],
  T3: ['cfEmbPos', 'cfTok', 'cfParamTok', 'cfTrainUse', 'cfTempTopP'], T7: ['cfStages'], T2: ['cfAgentLlm', 'cfCtxMem'], N: ['cfParamAct'], T5: ['cfMoeParams'],
};
