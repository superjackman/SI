/* Station K2 · Math · Linear algebra: vectors and the dot product, matrix multiplication, determinant, transpose and Jacobian */
import type { Page, StationOut } from '../../lib';
import { M, m } from '../../tex';
import { KCAT } from './K1';
import { ex, kDiagram, kLegend, proof } from './kit';

const r = String.raw;

export default function K2(P: Page): StationOut {
  const { t } = P;
  const svg = kDiagram(P, 'svgK2', [
    { h: 52, boxes: [{ id: 'kVec', col: 'c', t: t('向量与点积', 'Dot product'), s: [t('一串数字', 'A list of numbers')] }] },
    { h: 56, boxes: [{ id: 'kMat', col: 'l', t: t('矩阵乘法', 'Matrix product'), s: [t('很多个点积', 'Many dot products')] }, { id: 'score', col: 'r', t: t('用在：注意力打分', 'Used: attention'), s: ['q · k'] }] },
    { h: 56, boxes: [{ id: 'kDet', col: 'l', t: t('行列式', 'Determinant'), s: [t('面积缩放', 'Area scaling')] }, { id: 'kJac', col: 'r', t: t('转置与雅可比', 'Jacobian'), s: [t('梯度往回传', 'Gradients flow back')] }] },
    { h: 52, boxes: [{ id: 'nBp', col: 'r', t: t('用在：反向传播', 'Used: backprop'), s: [t('Wᵀ 乘梯度', 'Wᵀ times gradient')] }] },
  ], [['kVec', 'kMat'], ['kVec', 'score'], ['kMat', 'kDet'], ['kMat', 'kJac'], ['kJac', 'nBp']], KCAT);

  P.card('c_K2_0', 1, t('神经网络里的大部分计算，都是向量和矩阵', 'Most of a neural network’s computation is vectors and matrices'), `
<p class="lead">${t(`一个词在模型里是一个${P.open('kVec')}；一层网络是一次${P.open('kMat')}；${P.open('nBp')}时梯度往回传，乘的是矩阵的转置。本站把这几件事讲清楚，并逐步证明关键公式。`, `Inside a model a word is a ${P.open('kVec')}; a layer is a ${P.open('kMat')}; when ${P.open('nBp')} sends gradients back, it multiplies by the transpose. This stop explains each and proves the key formulas step by step.`)}</p>
<ul class="pts">
<li>${P.open('kVec')}${t(`：衡量两个方向有多一致——${P.open('score')}就是点积。`, `: how much two directions agree; an ${P.open('score')} is a dot product.`)}</li>
<li>${P.open('kDet')}${t('：一个矩阵把面积放大或压扁多少。', ': how much a matrix stretches or squashes area.')}</li>
<li>${P.open('kJac')}${t('：多输入多输出时的导数，以及为什么梯度要乘转置。', ': the derivative for many inputs and outputs, and why gradients get multiplied by the transpose.')}</li>
</ul>`, { h2: true });

  P.card('c_K2_1', 2, t('➡️ 向量与点积：两个方向有多一致', '➡️ Vectors and the dot product: how much two directions agree'), `
<p>${t(`${m('n')} 维向量就是 ${m('n')} 个数：${m(r`a=(a_1,\dots,a_n)`)}。两个向量的点积是对应位置相乘再相加，长度（范数）由点积定义：`, `An ${m('n')}-dimensional vector is ${m('n')} numbers, ${m(r`a=(a_1,\dots,a_n)`)}. The dot product multiplies matching entries and adds them up, and the length (norm) is defined from it:`)}</p>
${M(r`a\cdot b=\sum_{i=1}^{n} a_i b_i,\qquad \|a\|=\sqrt{a\cdot a}`)}
<p>${t('点积满足对称性 ' + m(r`a\cdot b=b\cdot a`) + ' 和双线性 ' + m(r`(a+c)\cdot b=a\cdot b+c\cdot b`) + '、' + m(r`(ta)\cdot b=t\,(a\cdot b)`) + '，直接由定义按分量验证即可。', 'It is symmetric, ' + m(r`a\cdot b=b\cdot a`) + ', and bilinear, ' + m(r`(a+c)\cdot b=a\cdot b+c\cdot b`) + ' and ' + m(r`(ta)\cdot b=t\,(a\cdot b)`) + '; each follows entry by entry from the definition.')}</p>
${proof(P, t(`几何意义：${m(r`a\cdot b=\|a\|\,\|b\|\cos\theta`)}（二维、三维）`, `Geometric meaning: ${m(r`a\cdot b=\|a\|\,\|b\|\cos\theta`)} (in 2-D and 3-D)`), [
    [t(`把 ${m('a')}、${m('b')} 画成从同一点出发的两条边，第三条边就是 ${m('a-b')}，夹角为 ${m(r`\theta`)}。`, `Draw ${m('a')} and ${m('b')} from the same point; the third side of the triangle is ${m('a-b')}, and the angle between them is ${m(r`\theta`)}.`), t('三角形的三条边。', 'The three sides of a triangle.')],
    [M(r`\|a-b\|^2=\|a\|^2+\|b\|^2-2\|a\|\,\|b\|\cos\theta`), t('余弦定理。', 'Law of cosines.')],
    [M(r`\|a-b\|^2=(a-b)\cdot(a-b)=\|a\|^2-2\,a\cdot b+\|b\|^2`), t('范数的定义，再用双线性和对称性展开。', 'Definition of the norm, expanded with bilinearity and symmetry.')],
    [M(r`a\cdot b=\|a\|\,\|b\|\cos\theta`), t('两式右边相等，消去相同的项后两边同除以 −2。', 'The right-hand sides are equal; cancel the common terms and divide by −2.')],
  ])}
<p>${t(`在更高维里，人们反过来用 ${m(r`\cos\theta=\frac{a\cdot b}{\|a\|\|b\|}`)} 定义夹角（柯西–施瓦茨不等式保证它在 −1 到 1 之间，证明见`, `In higher dimensions this is turned around and ${m(r`\cos\theta=\frac{a\cdot b}{\|a\|\|b\|}`)} defines the angle (the Cauchy–Schwarz inequality keeps it between −1 and 1; proof in`)} ${P.go('K4', t('优化站', 'the Optimization stop'))}${t('）。这就是“余弦相似度”：两个词向量方向越一致，值越接近 1。', '). This is “cosine similarity”: the more two word vectors point the same way, the closer it is to 1.')}</p>`);

  P.card('c_K2_2', 2, t('🧮 矩阵乘法：一次算很多个点积', '🧮 Matrix multiplication: many dot products at once'), `
<p>${t(`${m(r`m\times n`)} 的矩阵 ${m('A')} 乘 ${m(r`n\times p`)} 的矩阵 ${m('B')}，结果是 ${m(r`m\times p`)}；第 ${m('i')} 行第 ${m('j')} 列等于 ${m('A')} 的第 ${m('i')} 行与 ${m('B')} 的第 ${m('j')} 列的点积：`, `An ${m(r`m\times n`)} matrix ${m('A')} times an ${m(r`n\times p`)} matrix ${m('B')} gives an ${m(r`m\times p`)} matrix whose row ${m('i')}, column ${m('j')} entry is the dot product of row ${m('i')} of ${m('A')} with column ${m('j')} of ${m('B')}:`)}</p>
${M(r`(AB)_{ij}=\sum_{k=1}^{n} A_{ik}B_{kj}`)}
<p>${t(`共 ${m('mp')} 个点积，每个 ${m('n')} 次乘法，总计 ${m('mnp')} 次乘加——这就是大模型的算力主要花在哪里。一层全连接网络 ${m('y=Wx+b')} 就是矩阵乘向量；${P.open('wq')}把每个词向量乘成查询向量；注意力的打分矩阵是`, `That is ${m('mp')} dot products of ${m('n')} multiplications each, ${m('mnp')} multiply-adds in total, which is where most of a large model’s compute goes. A fully connected layer ${m('y=Wx+b')} is a matrix times a vector; ${P.open('wq')} turns each word vector into a query; the attention score matrix is`)}</p>
${M(r`S=\frac{QK^{\mathsf T}}{\sqrt{d_k}},\qquad S_{ij}=\frac{q_i\cdot k_j}{\sqrt{d_k}}`)}
<p>${t(`矩阵乘法一般不交换：${m(r`AB\neq BA`)}。例如`, `Matrix multiplication does not commute in general, ${m(r`AB\neq BA`)}. For example`)}</p>
${M(r`\begin{pmatrix}0&1\\0&0\end{pmatrix}\begin{pmatrix}0&0\\1&0\end{pmatrix}=\begin{pmatrix}1&0\\0&0\end{pmatrix},\quad \begin{pmatrix}0&0\\1&0\end{pmatrix}\begin{pmatrix}0&1\\0&0\end{pmatrix}=\begin{pmatrix}0&0\\0&1\end{pmatrix}`)}
${proof(P, t(`转置的乘法：${m(r`(AB)^{\mathsf T}=B^{\mathsf T}A^{\mathsf T}`)}`, `Transpose of a product: ${m(r`(AB)^{\mathsf T}=B^{\mathsf T}A^{\mathsf T}`)}`), [
    [M(r`\big((AB)^{\mathsf T}\big)_{ij}=(AB)_{ji}`), t(`转置的定义：${m(r`(X^{\mathsf T})_{ij}=X_{ji}`)}。`, `Definition of the transpose, ${m(r`(X^{\mathsf T})_{ij}=X_{ji}`)}.`)],
    [M(r`(AB)_{ji}=\sum_k A_{jk}B_{ki}`), t('矩阵乘法的定义。', 'Definition of the matrix product.')],
    [M(r`\sum_k A_{jk}B_{ki}=\sum_k (B^{\mathsf T})_{ik}(A^{\mathsf T})_{kj}=(B^{\mathsf T}A^{\mathsf T})_{ij}`), t('数的乘法可交换，再按转置和矩阵乘法的定义改写。', 'Multiplication of numbers commutes; rewrite with the definitions of transpose and product.')],
    [t('每个位置都相等，所以两个矩阵相等。', 'Every entry agrees, so the matrices are equal.'), ''],
  ])}`);

  P.card('c_K2_3', 2, t('🔲 线性变换与行列式：面积放大了多少', '🔲 Linear maps and the determinant: how much area scales'), `
<p>${t(`2×2 矩阵把平面上的每个点 ${m('x')} 变到 ${m('Ax')}。它的两列正是两个单位向量的去处：${m(r`Ae_1=(a,c)`)}，${m(r`Ae_2=(b,d)`)}，所以单位正方形变成以这两列为边的平行四边形。`, `A 2×2 matrix sends every point ${m('x')} of the plane to ${m('Ax')}. Its two columns are where the unit vectors go, ${m(r`Ae_1=(a,c)`)} and ${m(r`Ae_2=(b,d)`)}, so the unit square becomes the parallelogram with those columns as sides.`)}</p>
${M(r`A=\begin{pmatrix}a&b\\c&d\end{pmatrix},\qquad \det A=ad-bc`)}
${proof(P, t(`平行四边形面积 ${m(r`=|\det A|`)}`, `Parallelogram area ${m(r`=|\det A|`)}`), [
    [t(`设两边 ${m('u=(a,c)')}、${m('v=(b,d)')}，夹角 ${m(r`\theta\in[0,\pi]`)}。面积 = 底 × 高 = ${m(r`\|u\|\,\|v\|\sin\theta`)}。`, `Let the sides be ${m('u=(a,c)')} and ${m('v=(b,d)')} with angle ${m(r`\theta\in[0,\pi]`)}. Area = base × height = ${m(r`\|u\|\,\|v\|\sin\theta`)}.`), t(`高是 ${m(r`\|v\|\sin\theta`)}，且 ${m(r`\sin\theta\ge 0`)}。`, `The height is ${m(r`\|v\|\sin\theta`)}, and ${m(r`\sin\theta\ge 0`)}.`)],
    [M(r`\text{Area}^2=\|u\|^2\|v\|^2(1-\cos^2\theta)=\|u\|^2\|v\|^2-(u\cdot v)^2`), t(`${m(r`\sin^2=1-\cos^2`)}，再用上一张卡的 ${m(r`u\cdot v=\|u\|\|v\|\cos\theta`)}。`, `${m(r`\sin^2=1-\cos^2`)}, then ${m(r`u\cdot v=\|u\|\|v\|\cos\theta`)} from the previous card.`)],
    [M(r`=(a^2+c^2)(b^2+d^2)-(ab+cd)^2`), t('代入分量。', 'Substitute the entries.')],
    [M(r`=a^2b^2+a^2d^2+b^2c^2+c^2d^2-a^2b^2-2abcd-c^2d^2=(ad-bc)^2`), t('展开后抵消。', 'Expand and cancel.')],
    [M(r`\text{Area}=|ad-bc|=|\det A|`), t('面积非负，两边开方。', 'Area is non-negative; take square roots.')],
  ])}
<p>${t(`符号表示方向：${m(r`\det A<0`)} 时图形被翻转了。${m(r`\det A=0`)} 时平面被压成一条线（或一个点），不同的输入会变成同一个输出，信息丢失，矩阵不可逆。`, `The sign records orientation: ${m(r`\det A<0`)} means the shape was flipped. When ${m(r`\det A=0`)} the plane is squashed onto a line (or a point), different inputs land on the same output, information is lost, and the matrix has no inverse.`)}</p>`);

  P.lab('labMat', t('拉动一个 2×2 矩阵，看单位正方形怎么变', 'Drag a 2×2 matrix and watch the unit square'),
    t('矩阵的四个数由你设定，面积和行列式是精确计算的。', 'You set the four entries; area and determinant are computed exactly.'),
    [t('行列式的定义很抽象，看着图形被拉伸、翻转、压扁，就记住了。', 'The determinant’s formula is abstract; watching the square stretch, flip and collapse makes it stick.')],
    `<div class="k-ctl">
<label>a = <b id="matAv">1.5</b><input type="range" id="matA" min="-2" max="2" step="0.5" value="1.5"></label>
<label>b = <b id="matBv">0.5</b><input type="range" id="matB" min="-2" max="2" step="0.5" value="0.5"></label>
<label>c = <b id="matCv">0</b><input type="range" id="matC" min="-2" max="2" step="0.5" value="0"></label>
<label>d = <b id="matDv">1</b><input type="range" id="matD" min="-2" max="2" step="0.5" value="1"></label></div>
<svg id="matPlot" class="k-plot" viewBox="0 0 320 240" role="img" aria-label="${t('单位正方形和变换后的平行四边形', 'The unit square and its image')}"></svg>
<div id="matOut" class="k-out" aria-live="polite"></div>`,
    [t('令 b=c=0：正方形只被横向拉 a 倍、纵向拉 d 倍，面积 = ad。', 'Set b = c = 0: the square is stretched a times across and d times up, area = ad.'),
      t('令 a=1,b=2,c=0.5,d=1：行列式 = 0，平行四边形压成一条线。', 'Set a = 1, b = 2, c = 0.5, d = 1: the determinant is 0 and the parallelogram collapses onto a line.'),
      t('交换两列（a↔b, c↔d）：面积不变，行列式变号，图形翻转。', 'Swap the columns (a↔b, c↔d): the area stays, the determinant changes sign, the shape flips.')]);

  P.card('c_K2_4', 2, t('↩️ 雅可比矩阵：为什么梯度往回传要乘 Wᵀ', '↩️ The Jacobian: why gradients flow back through Wᵀ'), `
<p>${t(`函数 ${m(r`y=f(x)`)} 有 ${m('n')} 个输入、${m('m')} 个输出时，它的导数是一个 ${m(r`m\times n`)} 的矩阵，叫雅可比矩阵：`, `When ${m(r`y=f(x)`)} has ${m('n')} inputs and ${m('m')} outputs, its derivative is an ${m(r`m\times n`)} matrix, the Jacobian:`)}</p>
${M(r`J_{ij}=\frac{\partial y_i}{\partial x_j}`)}
${proof(P, t(`标量损失 ${m('L')} 的梯度：${m(r`\nabla_x L=J^{\mathsf T}\,\nabla_y L`)}`, `Gradient of a scalar loss ${m('L')}: ${m(r`\nabla_x L=J^{\mathsf T}\,\nabla_y L`)}`), [
    [M(r`\frac{\partial L}{\partial x_j}=\sum_{i=1}^{m}\frac{\partial L}{\partial y_i}\,\frac{\partial y_i}{\partial x_j}`), t(`多元链式法则：${m('x_j')} 通过每个 ${m('y_i')} 影响 ${m('L')}，各条路径相加（见微积分站）。`, `Multivariable chain rule: ${m('x_j')} affects ${m('L')} through every ${m('y_i')}; add over the paths (see the Calculus stop).`)],
    [M(r`=\sum_{i}(J^{\mathsf T})_{ji}\,(\nabla_y L)_i=\big(J^{\mathsf T}\nabla_y L\big)_j`), t(`${m(r`J_{ij}=(J^{\mathsf T})_{ji}`)}，这正是矩阵乘向量的第 ${m('j')} 个分量。`, `${m(r`J_{ij}=(J^{\mathsf T})_{ji}`)}, and this is entry ${m('j')} of a matrix-vector product.`)],
  ])}
${ex(P, t(`一层线性网络 ${m('y=Wx')}`, `A linear layer ${m('y=Wx')}`), `<p>${t(`${m(r`y_i=\sum_k W_{ik}x_k`)}，所以 ${m(r`J_{ij}=\partial y_i/\partial x_j=W_{ij}`)}，即 ${m('J=W')}：`, `${m(r`y_i=\sum_k W_{ik}x_k`)}, so ${m(r`J_{ij}=\partial y_i/\partial x_j=W_{ij}`)}, i.e. ${m('J=W')}:`)}</p>
${M(r`\nabla_x L=W^{\mathsf T}\,\nabla_y L,\qquad \frac{\partial L}{\partial W_{ij}}=\frac{\partial L}{\partial y_i}\,x_j\ \Longrightarrow\ \nabla_W L=(\nabla_y L)\,x^{\mathsf T}`)}
<p>${t(`第二个式子的理由：${m(r`W_{ij}`)} 只出现在 ${m(r`y_i`)} 里，且 ${m(r`\partial y_i/\partial W_{ij}=x_j`)}。这两行就是线性层${P.open('nBp')}的全部内容，完整的多层推导见`, `The reason for the second formula: ${m(r`W_{ij}`)} appears only in ${m(r`y_i`)}, with ${m(r`\partial y_i/\partial W_{ij}=x_j`)}. These two lines are all of ${P.open('nBp')} for a linear layer; the full multi-layer derivation is in`)} ${P.go('K5', t('推导与证明站', 'the Derivations stop'))}${t('。', '.')}</p>`)}`);

  P.quiz();
  return {
    sub: t('向量 → 矩阵 → 行列式 → 雅可比：模型里“一层”到底算了什么。', 'Vectors → matrices → determinant → Jacobian: what one “layer” actually computes.'),
    one: t('本站讲神经网络用到的线性代数，并逐步证明点积的几何意义、转置法则、面积公式和梯度的转置规则。', 'The linear algebra a neural network uses, with step-by-step proofs of the dot product’s geometry, the transpose rule, the area formula and the transpose rule for gradients.'),
    why: t('读懂一层网络和注意力的公式，靠的就是这几条规则。', 'These few rules are what you need to read the formulas for a layer and for attention.'),
    svg, legend: kLegend(t),
  };
}
