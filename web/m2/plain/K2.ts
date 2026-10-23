/* R15 plain-language layer for K2 (linear algebra: vectors, dot products, matrices, determinants, Jacobians). */
import type { PStation } from './types';
import { B } from './types';

const K2: PStation = {
  cards: {
    c_K2_0: {
      zh: `<p>电脑不认识字，只认识数。所以 AI 会把每个词变成<b>一串数</b>，就像用“身高、体重、年龄”三个数来描述一个人。这样的一串数叫<b>向量</b>。</p>
<p>神经网络的一层，基本上就是拿一张<b>数表</b>（矩阵）去乘这一串数，得到新的一串数。所以这一站讲的“向量”和“矩阵”，是 AI 每时每刻都在做的计算。</p>`,
      en: `<p>Computers don’t understand words, only numbers. So an AI turns each word into <b>a list of numbers</b>, like describing a person by three numbers: height, weight and age. Such a list is called a <b>vector</b>.</p>
<p>One layer of a neural network mostly multiplies that list by a <b>table of numbers</b> (a matrix) to get a new list. So the vectors and matrices on this stop are what an AI computes all the time.</p>`,
      more: B(`一层神经网络通常不只是“表乘一串数”：还要再加上一串偏置数（y = Wx + b），然后经过一个激活函数（比如 ReLU）。`,
        `A neural-network layer usually does a bit more than “table times list”: it also adds a list of bias numbers (y = Wx + b) and then applies an activation function (such as ReLU).`),
    },
    c_K2_1: {
      zh: `<p>一串数可以画成一支<b>箭头</b>：(3, 4) 就是“往右走 3、往上走 4”。</p>
<p><b>点积</b>：两串数对应位置相乘，再全部加起来。比如 (3, 4) 和 (1, 2)：3×1 + 4×2 = 11。两支箭头方向越一致，点积越大；互相垂直时正好是 0。</p>
<p>箭头的<b>长度</b>：(3, 4) 的长度是 5，因为 3×3 + 4×4 = 25，而 5×5 = 25。</p>`,
      en: `<p>A list of numbers can be drawn as an <b>arrow</b>: (3, 4) means “go 3 right and 4 up”.</p>
<p>The <b>dot product</b>: multiply the matching numbers of two lists, then add everything up. For (3, 4) and (1, 2): 3×1 + 4×2 = 11. The more two arrows point the same way, the bigger the dot product; at right angles it is exactly 0.</p>
<p>An arrow’s <b>length</b>: (3, 4) has length 5, because 3×3 + 4×4 = 25, and 5×5 = 25.</p>`,
      more: B(`点积大小同时受“方向”和“长度”影响：箭头越长，点积也越大。只想比较方向时，要除以两支箭头的长度，得到 cos θ（在 −1 和 1 之间），这就是“余弦相似度”。`,
        `The size of a dot product depends on both direction and length: longer arrows give bigger dot products. To compare direction only, divide by both arrows’ lengths to get cos θ (between −1 and 1): the “cosine similarity”.`),
    },
    c_K2_2: {
      zh: `<p><b>矩阵</b>就是排成几行几列的一张数表。两张表相乘时，结果里的每一格，都是“左边表的一行”和“右边表的一列”做一次点积（对应相乘再加起来）。</p>
<p>要注意：换个顺序乘，结果一般<b>不一样</b>（AB 通常不等于 BA），这和普通的 2×3 = 3×2 不同。</p>
<p>AI 的“注意力”就用到它：把所有词的“提问”表和“钥匙”表相乘，一下子算出每个词对每个词有多“关心”的一整张分数表。</p>`,
      en: `<p>A <b>matrix</b> is a table of numbers in rows and columns. When two tables are multiplied, each cell of the answer is one dot product: a row of the left table with a column of the right table (multiply matching numbers, then add).</p>
<p>Watch out: multiplying in the other order usually gives a <b>different</b> answer (AB is usually not BA), unlike ordinary numbers where 2×3 = 3×2.</p>
<p>AI “attention” uses this: multiply the table of every word’s “question” by the table of every word’s “key”, and you get, in one go, a whole table of how much each word “cares about” each other word.</p>`,
      more: B(`两张表能相乘的条件是：左边表的列数等于右边表的行数。注意力分数还要再除以 √dₖ（让数字不至于太大），然后用 softmax 变成每行加起来是 1 的权重。`,
        `Two tables can only be multiplied when the left one has as many columns as the right one has rows. Attention scores are also divided by √dₖ (to keep the numbers from getting too big) and then turned by softmax into weights that add up to 1 in each row.`),
    },
    c_K2_3: {
      zh: `<p>一个 2×2 的矩阵就是一条“<b>搬家规则</b>”：平面上的每个点都按它搬到新位置。一个边长为 1 的小正方形，搬完会变成一个平行四边形。</p>
<p><b>行列式</b>（det）告诉你面积变成了原来的几倍：是 2 就是面积变成 2 倍；是负数，说明图形还被<b>翻了个面</b>（像照镜子）；是 0，说明被<b>压扁</b>成一条线或一个点，这样的搬家就没法再搬回去了。</p>`,
      en: `<p>A 2×2 matrix is a “<b>moving rule</b>”: every point on a flat sheet moves to a new place by it. A little square with sides of 1 turns into a slanted box (a parallelogram).</p>
<p>The <b>determinant</b> (det) tells you how many times bigger the area got: 2 means twice the area; a negative number means the shape was also <b>flipped over</b> (like in a mirror); 0 means it was <b>squashed flat</b> onto a line or a point, and such a move can’t be undone.</p>`,
      more: B(`面积的倍数其实是行列式的“绝对值” |det A|，正负号只表示有没有翻面。det A = 0 时矩阵没有逆矩阵：好几个不同的点会被搬到同一个地方，所以分不清原来是哪个。`,
        `The area factor is really the absolute value |det A|; the sign only says whether the shape was flipped. When det A = 0 the matrix has no inverse: different points land on the same spot, so you can’t tell which one it came from.`),
    },
    labMat: {
      zh: `<p>拖动 a、b、c、d 四个数，看小正方形被拉长、歪斜、翻面或压扁，面积的倍数（行列式）也跟着变。</p>`,
      en: `<p>Drag the four numbers a, b, c and d and watch the little square stretch, lean, flip over or get squashed, while the area factor (the determinant) changes with it.</p>`,
    },
    c_K2_4: {
      zh: `<p>一层网络有很多输入、很多输出。把“<b>每个输出对每个输入有多敏感</b>”全部填进一张表，这张表叫<b>雅可比矩阵</b>：第 i 行第 j 列写的是“第 j 个输入动一点点，第 i 个输出变多快”。</p>
<p>训练时要把“错误”从输出往回分给输入，看每个输入该负多少责任。做法就是把这张表<b>沿对角线翻过来</b>（转置），再去乘输出那边的“责任”。</p>`,
      en: `<p>A network layer has many inputs and many outputs. Write down “<b>how sensitive each output is to each input</b>” in one table: that is the <b>Jacobian matrix</b>. Row i, column j says “when input j moves a tiny bit, how fast does output i change?”</p>
<p>In training, the “mistake” has to be passed back from the outputs to the inputs, to see how much each input is to blame. The way to do it: <b>flip the table over its diagonal</b> (transpose it) and multiply it by the blame on the output side.</p>`,
      more: B(`这里的“责任”就是损失对每个输出的偏导数 ∇ᵧL；结果 ∇ₓL = Jᵀ∇ᵧL 是损失对每个输入的偏导数。它就是多输入、多输出时的链式法则，每一层都这样往回传，就是反向传播。`,
        `The “blame” is the loss’s partial derivative for each output, ∇ᵧL; the result ∇ₓL = Jᵀ∇ᵧL is the loss’s partial derivative for each input. This is the chain rule with many inputs and outputs, and repeating it layer by layer is backpropagation.`),
    },
  },
  ctx: {
    '*': {
      'v:a': B('一个向量（一串数，可以画成一支箭头）', 'a vector (a list of numbers, drawn as an arrow)'),
      'v:b': B('另一个向量', 'another vector'),
      'v:n': B('一串数里有几个数', 'how many numbers are in the list'),
      'v:i': B('编号：第几个', 'a label: which one'),
    },
    c_K2_1: {
      'v:c': B('第三个向量', 'a third vector'),
      'v:t': B('一个普通的数：把箭头拉长几倍', 'an ordinary number: how many times longer the arrow gets'),
      theta: B('两支箭头之间的夹角', 'the angle between the two arrows'),
      sub: B('a₁、aᵢ：向量 a 里的第 1 个数、第 i 个数', 'a₁, aᵢ: the 1st number and the i-th number in vector a'),
      cdot: B('点积：对应位置相乘，再全部加起来', 'dot product: multiply matching numbers, then add them all up'),
    },
    c_K2_2: {
      'v:m': B('A 有几行', 'how many rows A has'),
      'v:n': B('A 的列数，也就是 B 的行数', 'the number of columns of A, which is the number of rows of B'),
      'v:p': B('B 有几列', 'how many columns B has'),
      'v:A': B('第一张数表（矩阵）', 'the first table of numbers (matrix)'),
      'v:B': B('第二张数表（矩阵）', 'the second table of numbers (matrix)'),
      'v:i': B('第几行', 'which row'),
      'v:j': B('第几列', 'which column'),
      'v:k': B('求和时的编号，把 A 的那一行和 B 的那一列一个个对上；注意力公式里 kⱼ 是第 j 个词的“钥匙”向量', 'the counting label in the sum, pairing up A’s row with B’s column; in the attention formula kⱼ is word j’s “key” vector'),
      'v:y': B('输出的一串数', 'the output list'),
      'v:W': B('权重矩阵：一张要学出来的数表', 'the weight matrix: a table of numbers that gets learned'),
      'v:x': B('输入的一串数', 'the input list'),
      'v:b': B('偏置：最后再加上的一串数', 'the bias: a list added at the end'),
      'v:S': B('注意力分数表：第 i 个词对第 j 个词有多“关心”', 'the attention score table: how much word i “cares about” word j'),
      'v:Q': B('所有词的“提问”向量排成的表', 'the table of every word’s “question” vector'),
      'v:K': B('所有词的“钥匙”向量排成的表', 'the table of every word’s “key” vector'),
      'v:d': B('dₖ：每个钥匙向量里有几个数', 'dₖ: how many numbers each key vector has'),
      'v:q': B('qᵢ：第 i 个词的“提问”向量', 'qᵢ: word i’s “question” vector'),
      'v:X': B('任意一张数表', 'any table of numbers'),
      sub: B('Aᵢⱼ 这样的下标：表里第 i 行、第 j 列的那个数', 'a label like Aᵢⱼ: the number in row i, column j of the table'),
      times: B('m×n：m 行、n 列的表', 'm×n: a table with m rows and n columns'),
      cdot: B('点积：对应位置相乘，再全部加起来', 'dot product: multiply matching numbers, then add them all up'),
    },
    c_K2_3: {
      'v:x': B('平面上的一个点（一支箭头）', 'a point on the sheet (an arrow)'),
      'v:A': B('一个 2×2 矩阵：把每个点搬到新位置的规则', 'a 2×2 matrix: the rule that moves every point'),
      'v:e': B('e₁、e₂：沿横向、竖向，长度为 1 的两支小箭头', 'e₁, e₂: the two arrows of length 1 pointing across and up'),
      'v:a': B('矩阵左上角的数', 'the top-left number of the matrix'),
      'v:b': B('矩阵右上角的数', 'the top-right number of the matrix'),
      'v:c': B('矩阵左下角的数', 'the bottom-left number of the matrix'),
      'v:d': B('矩阵右下角的数', 'the bottom-right number of the matrix'),
      'v:u': B('平行四边形的一条边', 'one side of the parallelogram'),
      'v:u@v:a,v:c': B('平行四边形的一条边：u = (a, c)', 'one side of the parallelogram: u = (a, c)'),
      'v:v': B('平行四边形的另一条边', 'the other side of the parallelogram'),
      'v:v@v:b,v:d': B('平行四边形的另一条边：v = (b, d)', 'the other side of the parallelogram: v = (b, d)'),
      theta: B('两条边之间的夹角', 'the angle between the two sides'),
      'w:Area': B('平行四边形的面积', 'the area of the parallelogram'),
      sub: B('e₁、e₂ 的编号：第 1 支、第 2 支', 'the label on e₁, e₂: the 1st and the 2nd arrow'),
      cdot: B('点积：对应位置相乘，再全部加起来', 'dot product: multiply matching numbers, then add them all up'),
      pi: B('这里表示半圈，也就是 180°', 'here, half a turn: 180°'),
    },
    c_K2_4: {
      'v:y': B('这一层输出的一串数', 'the layer’s output list'),
      'v:f': B('这一层：把输入变成输出的函数', 'the layer: the function turning inputs into outputs'),
      'v:x': B('这一层输入的一串数', 'the layer’s input list'),
      'v:n': B('输入有几个数', 'how many input numbers'),
      'v:m': B('输出有几个数', 'how many output numbers'),
      'v:J': B('雅可比矩阵：“每个输出对每个输入有多敏感”的表', 'the Jacobian: the table of how sensitive each output is to each input'),
      'v:i': B('第几个输出', 'which output'),
      'v:j': B('第几个输入', 'which input'),
      'v:L': B('损失：模型错了多少', 'the loss: how wrong the model is'),
      'v:W': B('权重矩阵：一张要学出来的数表', 'the weight matrix: a table of numbers that gets learned'),
      'v:k': B('求和时的编号', 'the counting label in the sum'),
      sub: B('右下角的小字是编号：第几个（输入、输出，或者表里的第几行、第几列）', 'the lowered label is a number: which one (input, output, or row and column of the table)'),
      'sub@nabla': B('右下角的小字是编号：第几个；∇ 下面的小字写着对谁求梯度', 'the lowered label is a number: which one; under ∇ it says what we take the gradient for'),
      'sub@nabla,v:W': B('下标：第几个（xⱼ 是第 j 个输入，Wᵢⱼ 是第 i 行第 j 列）；∇ 下面的小字写着对谁求', 'labels: which one (xⱼ is input j, Wᵢⱼ is row i, column j); under ∇ it says what we take the gradient for'),
      nabla: B('梯度：损失对每个输入（或每个权重）有多敏感，排成一串', 'the gradient: how sensitive the loss is to each input (or weight), as a list'),
    },
    /* popups */
    kVec: { theta: B('两支箭头之间的夹角', 'the angle between the two arrows') },
    kMat: {
      'v:A': B('第一张数表（矩阵）', 'the first table of numbers (matrix)'), 'v:B': B('第二张数表（矩阵）', 'the second table of numbers (matrix)'),
      'v:i': B('第几行', 'which row'), 'v:j': B('第几列', 'which column'),
      'v:k': B('求和时的编号：把 A 的这一行和 B 的这一列，一个一个对上', 'the counting label in the sum: pairs up A’s row with B’s column, one by one'),
      'v:y': B('输出的一串数', 'the output list'), 'v:W': B('权重矩阵：一张要学出来的数表', 'the weight matrix: a table of numbers that gets learned'),
      'v:x': B('输入的一串数', 'the input list'), 'v:b': B('偏置：最后再加上的一串数', 'the bias: a list added at the end'),
    },
    kDet: {
      'v:A': B('一个 2×2 矩阵：把平面上每个点搬到新位置的规则', 'a 2×2 matrix: the rule that moves every point on the sheet'),
      'v:a': B('矩阵左上角的数', 'the top-left number of the matrix'), 'v:b': B('矩阵右上角的数', 'the top-right number of the matrix'),
      'v:c': B('矩阵左下角的数', 'the bottom-left number of the matrix'), 'v:d': B('矩阵右下角的数', 'the bottom-right number of the matrix'),
    },
    kJac: {
      'v:J': B('雅可比矩阵：“每个输出对每个输入有多敏感”的表', 'the Jacobian: the table of how sensitive each output is to each input'),
      'v:i': B('第几个输出', 'which output'), 'v:j': B('第几个输入', 'which input'),
      'v:y': B('这一层输出的一串数', 'the layer’s output list'), 'v:x': B('这一层输入的一串数', 'the layer’s input list'),
      'v:W': B('权重矩阵：一张要学出来的数表', 'the weight matrix: a table of numbers that gets learned'), 'v:L': B('损失：模型错了多少', 'the loss: how wrong the model is'),
      nabla: B('梯度：损失对每个输入（或每个权重）有多敏感，排成一串', 'the gradient: how sensitive the loss is to each input (or weight), as a list'),
    },
  },
};
export default K2;
