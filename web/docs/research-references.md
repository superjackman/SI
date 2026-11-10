# 教学参考（2026-11-10 核对）

数字只记这次实际读到的。GitHub 星标来自当天的 GitHub REST API（`gh api repos/…` 的 `stargazers_count`）。YouTube 播放量没有从 YouTube 官方接口读到，第三方计数互相不一致，所以下面不写一个“确定的播放量”。只借用教法，不复制页面、不从外网加载脚本。能用的代码只考虑 MIT / Apache-2.0，并且要带上出处；星标栏写 `NOASSERTION` 的仓库只学做法，不搬代码。

## 对照

| 资源 | 这次读到的数 | 许可证 | 哪一招管用 | 我们采用 |
| --- | --- | --- | --- | --- |
| [poloclub/transformer-explainer](https://github.com/poloclub/transformer-explainer) | 9112 星，1062 fork，2026-06-06 仍有推送 | MIT | 同一句话走完嵌入、注意力、前馈，点一块，旁边的数字跟着变 | 注意力热力图和用户刚打的字绑在一起，不另开一套例子 |
| [poloclub/cnn-explainer](https://github.com/poloclub/cnn-explainer) | 9109 星，1349 fork，2023-10-14 | MIT | 一张图逐层揭开，每层只多一个动作 | 旋钮台先只有两个旋钮，后面的站再加 |
| [tensorflow/playground](https://github.com/tensorflow/playground) | 13091 星，2773 fork，2026-06-10 | Apache-2.0 | 手拧结构和学习率，损失曲线当场变 | 「自动拧」就是在旋钮上走梯度下降，损失数字一起变小 |
| [bbycroft/llm-viz](https://github.com/bbycroft/llm-viz)（页面在 bbycroft.net/llm） | 5591 星，678 fork，2026-08-10 | MIT | 把一次前向摊成可以跟着走的结构，而不是一张总图 | 热力图只画当前这句话的注意力，不搬它的三维场景 |
| [karpathy/micrograd](https://github.com/karpathy/micrograd) | 18807 星，2993 fork，2026-08-03 | MIT | 一个标量就把“坡怎么传回去”说完 | 反向那一站用三个旋钮的连乘，自动拧从最后一格往前转 |
| [karpathy/nanoGPT](https://github.com/karpathy/nanoGPT) | 64600 星，11112 fork，2025-11-12 | MIT | 字符级、小到能在笔记本上跑完，损失下降就是学会了 | 页内小 Transformer：一层、很小的宽度、几句公开的短句，Worker 里训练 |
| [karpathy/minGPT](https://github.com/karpathy/minGPT) | 25014 星，3328 fork，2024-08-15 | MIT | 一块注意力写清楚，再叠层 | 实验模型只做一层、一个头，生成时能指出每个字在看谁 |
| [karpathy/nn-zero-to-hero](https://github.com/karpathy/nn-zero-to-hero) | 25433 星，3697 fork，2024-08-18 | MIT | 从下一个字的预测搭起，每集只加一个零件 | 课文顺序不变：旋钮 → 坡 → 注意力 → 预训练 → 自己训一个小的 |
| [3Blue1Brown 神经网络](https://www.3blue1brown.com/lessons/neural-networks) 与 [注意力](https://www.youtube.com/watch?v=eMlx5fFNoYc) | 播放量未从 YouTube 官方接口核对，不记整数 | 动画库 manim 另有仓库；片子本身不整段搬 | 先给一个日常画面（认数字、猜下一个词），再揭开结构；神经元先说成“装着一个数的格子” | 正文先讲旋钮和纸条，术语放在这个画面之后 |
| [Jay Alammar《图解 Transformer》](https://jalammar.github.io/illustrated-transformer/)（仓库 [jalammar/jalammar.github.io](https://github.com/jalammar/jalammar.github.io) 885 星，391 fork） | 仓库 885 星；文章阅读量未核对 | MIT（仓库） | 同一句话配一张图，Q/K/V 用“查询 / 钥匙 / 值”而不是先甩矩阵 | 热力图下面用一句话：这个字在看前面的哪个字 |
| [Distill](https://distill.pub/) | 没有单一仓库星标可记 | 文章各自授权，这里只学做法 | 正文、图、公式联动，读者拖一个量，三处一起动 | 旋钮、损失、预测点画在同一张卡片里 |
| [microsoft/generative-ai-for-beginners](https://github.com/microsoft/generative-ai-for-beginners) | 123287 星，66232 fork，2026-11-05 | MIT | 一课一件事，结尾才是动手 | 情景题放在该站末尾，先读懂再做 |
| [microsoft/ML-For-Beginners](https://github.com/microsoft/ML-For-Beginners) | 92100 星，22895 fork，2026-11-07 | MIT | 每周一个经典题目，先直觉后公式 | 符号段仍在“用符号写下来”，不进开篇 |
| [microsoft/ai-agents-for-beginners](https://github.com/microsoft/ai-agents-for-beginners) | 79343 星，25985 fork，2026-11-07 | MIT | 智能体用“想一步、用一个工具、看结果”的回合，而不是框架名 | 情景题让人自己排这几步，排对才通过 |
| [datawhalechina/happy-llm](https://github.com/datawhalechina/happy-llm) | 34858 星，3294 fork，2026-08-08 | 接口返回的许可证名是 Other（spdx `NOASSERTION`），不搬代码 | 中文、从零搭，每章能跑 | 训练语料用公有领域的短句，界面中文 |
| [datawhalechina/hello-agents](https://github.com/datawhalechina/hello-agents) | 86602 星，10806 fork，2026-10-13 | 同上，Other / `NOASSERTION`，不搬代码 | 先原理后一个能点的例子 | 安全和检索各给一个能判定对错的情景 |
| [d2l-ai/d2l-zh](https://github.com/d2l-ai/d2l-zh) | 82434 星，12487 fork，2024-07-30 | Apache-2.0 | 公式旁边立刻有可运行的同一件事 | “写成程序”留在每课最后，给想看写法的人 |
| [d2l-ai/d2l-en](https://github.com/d2l-ai/d2l-en) | 30023 星，5156 fork，2024-08-18 | 接口返回 Other / `NOASSERTION` | 同一结构的英文 | 英文课文跟着中文的生活比喻走，不另起一套行话 |
| [mlabonne/llm-course](https://github.com/mlabonne/llm-course) | 85025 星，9894 fork，2026-02-05 | Apache-2.0 | 路线图：基础模型 → 微调 → 检索 → 智能体 | 站 12–22 的情景题按这条顺序，每站只练这一站的一件事 |
| [seeingtheory/Seeing-Theory](https://github.com/seeingtheory/Seeing-Theory) | 2200 星，347 fork，2023-09-25 | Apache-2.0 | 概率用可以拨的图，而不是先定义 | 损失用“差多少”的距离，拨旋钮就能看见点挪近 |
| [vicapow/explained-visually](https://github.com/vicapow/explained-visually)（站在 setosa.io/ev） | 882 星，61 fork，2023-08-22 | MIT | 一个概念一个可拖的图，拖的时候公式上的数一起变 | 温度旋钮和抽样句子绑在同一个实验里 |
| [Better Explained](https://betterexplained.com/) | 无对应 GitHub 星标。站点自己写“每年触达数百万”，这是它的原话，不是我们测到的计数 | 只学做法 | 先给“啊哈”的画面，再补细节（作者称为 ADEPT） | 开篇禁止先出现只有程序员才懂的词 |

## 不怎么搬

三维大模型全景（Bycroft）好看，但一上来就是整网，高度和加载都压过课文。我们只取“跟着这一次计算走”。nanoGPT 的训练循环是对的，但页内模型必须小到笔记本 CPU 一两分钟能看出损失下降，所以宽度、层数、语料都砍到能背下来的几句。
