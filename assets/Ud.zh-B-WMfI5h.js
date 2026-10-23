const a="level",t=`
<div class="pagehead" id="phUd"><h1 class="pg-t"><span class="pg-n">6</span>用得好</h1><p class="pg-s">说清楚、管好上下文、自己验证。</p><details class="pg-more"><summary aria-label="展开本站说明" title="本站说明"><span aria-hidden="true">ⓘ</span> 说明</summary><div class="ph-one">同一个 Agent，交代得清不清楚、上下文干不干净，结果差很多：四件事说全、给相关的、先计划、再验证、守住安全习惯。</div><p class="ph-why"><b>为什么这样设计：</b>模型只看得到你给的东西；这些习惯都在帮它“看到对的东西”。</p></details><div class="ph-top"><span class="ph-lv">第 6 站 / 共 22 站</span><span>📍 应用全景 › 怎么用 Agent › 用得好</span></div><div class="ph-map" id="pmUd"><span>本页结构：</span><button class="" data-sj="c_Ud_0" data-sp="Ud">同一个 Agent，交代得好坏，</button><button class="" data-sj="c_Ud_1" data-sp="Ud">✍️ 说清楚四件事</button><button class="" data-sj="c_Ud_2" data-sp="Ud">🧹 管好上下文</button><button class="" data-sj="c_Ud_3" data-sp="Ud">🔍 结果要验证</button><button class="" data-sj="c_Ud_4" data-sp="Ud">🛡️ 安全习惯</button><button class="l3" data-sj="labPrompt" data-sp="Ud">🧪 四件事开关：同一个请求，交代</button></div><div class="zoomnote" id="znUd" style="display:none"></div></div><div class="m-stage"><div class="m-dg main"><div class="m-vbar"><span class="m-vh">👆 点方块看详情<br>🤏 双指 / 双击放大</span><button type="button" class="vz" data-vz="out" aria-label="缩小">−</button><span class="vp" aria-live="polite">100%</span><button type="button" class="vz" data-vz="in" aria-label="放大">＋</button><button type="button" class="vz" data-vz="reset" aria-label="复位" disabled="">⟲</button><button type="button" class="vz" data-vz="full" aria-label="全屏查看">⛶</button></div><div class="diagram m-vw"><svg id="svgUd" viewBox="0 0 380 328" xmlns="http://www.w3.org/2000/svg" data-m="1"><defs><marker id="ahsvgUd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"></path></marker></defs><g class="comp cat-io" data-id="user" data-train="no" tabindex="0" role="button" aria-label="用户的一句话"><rect class="main" x="95" y="6" width="190" height="52" rx="12"></rect><text class="t" style="font-size:15px" x="190" y="29.0">你的一句话</text><text class="s" x="190" y="47.0">它只看得到这些</text></g><path class="arrow" d="M190 58 V78" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#ahsvgUd)"></path><g class="comp cat-use" data-id="uPrompt" data-train="no" tabindex="0" role="button" aria-label="把任务说清楚"><rect class="main" x="40" y="82" width="300" height="60" rx="12"></rect><text class="t" style="font-size:15px" x="190" y="109.0">把任务说清楚</text><text class="s" x="190" y="127.0">目标 · 背景 · 约束 · 验收</text></g><path class="arrow" d="M190 142 V164" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#ahsvgUd)"></path><g class="comp cat-use" data-id="uCtx" data-train="no" tabindex="0" role="button" aria-label="管好上下文"><rect class="main" x="40" y="168" width="300" height="60" rx="12"></rect><text class="t" style="font-size:15px" x="190" y="195.0">管好上下文</text><text class="s" x="190" y="213.0">放相关的，拿走无关的</text></g><path class="arrow" d="M150 228 V244 H94 V258" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#ahsvgUd)"></path><path class="arrow" d="M230 228 V244 H286 V258" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#ahsvgUd)"></path><g class="comp cat-llm" data-id="ctxwin" data-train="no" tabindex="0" role="button" aria-label="上下文窗口"><rect class="main" x="3" y="262" width="182" height="60" rx="12"></rect><text class="t" style="font-size:15px" x="94" y="289.0">原理：上下文窗口</text><text class="s" x="94" y="307.0">能装多少</text></g><g class="comp cat-llm" data-id="think" data-train="no" tabindex="0" role="button" aria-label="③ 思考 / 决策（大模型）"><rect class="main" x="195" y="262" width="182" height="60" rx="12"></rect><text class="t" style="font-size:15px" x="286" y="289.0">原理：大模型思考</text><text class="s" x="286" y="307.0">只用你给的信息</text></g></svg></div></div><details class="m-leg"><summary>🎨 图例：颜色是什么意思</summary><div class="legend"><span><i style="--c:#15803d;--f:#dcfce7"></i>用法（怎么用）</span><span><i style="--c:#4338ca;--f:#e0e7ff"></i>大模型原理</span></div></details></div>
<div class="card has-meta" id="c_Ud_0" data-z="1" data-zl="② 结构图" data-nh="1" data-cc="1">
<div class="cc-meta"><span class="zl z2">② 结构图</span></div><h2><button type="button" class="cc-h" aria-expanded="true">同一个 Agent，交代得好坏，结果差很多</button></h2><div class="cc-body">

<p class="lead">模型只能看到你给它的东西，看不到你脑子里没说出来的要求。所以好用的关键在你这一侧：</p>
<ul class="pts">
<li><a data-open="uPrompt">把任务说清楚</a>：目标、背景、约束、验收标准，四件事说全。</li>
<li><a data-open="uCtx">管好上下文</a>：给相关的，拿走无关的。</li>
<li>先计划再动手、结果自己验证、守住安全习惯。</li>
</ul>
</div></div>
<div class="card has-meta" id="c_Ud_1" data-z="2" data-zl="③ 细节·为什么" data-nh="1" data-cc="1">
<div class="cc-meta"><span class="zl zm">③ 细节·为什么</span></div><h3><button type="button" class="cc-h" aria-expanded="true">✍️ 说清楚四件事</button></h3><div class="cc-body">

<table class="gl stack"><tbody><tr><th>要说的</th><th>意思</th></tr>
<tr><td>🎯 目标</td><td data-label="意思">要什么结果（而不是“弄好一点”）</td></tr>
<tr><td>📎 背景</td><td data-label="意思">材料在哪、给谁看、试过什么</td></tr>
<tr><td>🚫 约束</td><td data-label="意思">哪些不能碰、不能做</td></tr>
<tr><td>✅ 验收</td><td data-label="意思">怎样算完成、它自己怎么检查</td></tr>
</tbody></table>
<div class="u-cmp"><p class="u-bad">❌ “帮我把报告弄好一点。”</p>
<p class="u-good">✅ “把 docs/q3-report.md 改成给管理层看的一页摘要（目标）。读者没时间看细节，关心的是成本和风险（背景）。不要改任何数字（约束）。完成标准：不超过 300 字，开头三句话说清结论（验收）。”</p></div>
<p>再加一招：给一个例子，往往比多写三段要求更管用。复杂任务先让它写<b>计划</b>，你看过再让它动手——这正对应 <a data-open="think">③ 思考 / 决策（大模型）</a> 里“先想清楚再做”。</p>
</div></div>
<div class="card has-meta" id="c_Ud_2" data-z="2" data-zl="③ 细节·为什么" data-nh="1" data-cc="1">
<div class="cc-meta"><span class="zl zm">③ 细节·为什么</span></div><h3><button type="button" class="cc-h" aria-expanded="true">🧹 管好上下文</button></h3><div class="cc-body">

<p>模型每一步只能看到 <a data-open="ctxwin">上下文窗口</a> 里的东西，按 <a data-open="tokenizer">分词器</a> 切出来的词元计数。窗口有上限，而且装得越多，关键信息越容易被淹没：研究发现，很多模型对长上下文<b>中间</b>部分的信息利用得更差（开头和结尾更容易被用上）。这是一种普遍倾向，各模型程度不同。</p>
<ul class="pts">
<li><b>一个话题一个对话</b>：换话题就开新对话；聊太久就让它写个摘要，带到新对话里。</li>
<li><b>给路径，不贴全文</b>：告诉 Agent 文件在哪，让它自己读需要的部分。</li>
<li><b>去掉无关材料</b>：多贴的文档不只是浪费，还会把它带偏。</li>
</ul>
</div></div>
<div class="card has-meta" id="c_Ud_3" data-z="2" data-zl="③ 细节·为什么" data-nh="1" data-cc="1">
<div class="cc-meta"><span class="zl zm">③ 细节·为什么</span></div><h3><button type="button" class="cc-h" aria-expanded="true">🔍 结果要验证</button></h3><div class="cc-body">

<ul class="pts">
<li><b>让它自己先查一遍</b>：要求它跑测试、对照验收标准逐条检查，并说明哪里没把握。</li>
<li><b>你再抽查关键处</b>：数字、引用、日期、对外发出的内容。</li>
<li><b>“说完成了”不等于完成了</b>：模型可能很有把握地说错话，看证据（测试结果、diff、原文出处）。</li>
</ul>
</div></div>
<div class="card has-meta" id="c_Ud_4" data-z="2" data-zl="③ 细节·为什么" data-nh="1" data-cc="1">
<div class="cc-meta"><span class="zl zm">③ 细节·为什么</span></div><h3><button type="button" class="cc-h" aria-expanded="true">🛡️ 安全习惯</button></h3><div class="cc-body">

<ul class="pts">
<li>权限从小开始，够用就好；任务完了就收回。</li>
<li>发送、删除、付款这类不可逆的动作，坚持人工确认。</li>
<li>它读进来的网页、邮件、文件都可能藏着 <a data-open="inject">提示词注入</a>；读外部内容的 Agent，不要同时给它发送和删除的权限。</li>
<li>不要把密码、密钥直接贴进对话。</li>
</ul>
</div></div>
<div class="lab-divider" data-z="3"><span>🧪 动手实验室：用得好</span></div>
<div class="card lab has-meta" id="labPrompt" data-z="3" data-zl="🧪 动手实验" data-nh="1">
<div class="cc-meta"><span class="zl z3">🧪 动手实验</span><span class="tag demo tag-s" title="示意">示意</span></div><h3>🧪 四件事开关：同一个请求，交代得越清楚越好</h3><p class="tag-note">ⓘ “预计效果分”是示意的教学打分，不是真实模型的测量。</p>
<div class="lab-why bz"><div class="bz-h"><b>设计动机：</b></div><ul class="pts"><li>把“说清楚”拆成四个开关，一个个打开，看哪一项最关键。</li><li>多贴无关文档会扣分：上下文不是越多越好。</li></ul></div>
<p class="u-task">原始请求：“帮我把报告弄好一点。”</p>
<div class="u-checks" id="prFlags" role="group" aria-label="四件事"></div>
<div class="ctrls"><label>顺手多贴的无关文档 <input type="range" id="prDocs" min="0" max="3" value="0"><b id="prDocsV">0</b></label></div>
<div class="u-out" id="prOut" aria-live="polite"></div>
<p class="u-cap">这次请求放进上下文的内容：有用的交代 vs 无关文档（示意）</p>
<div class="u-bar" id="prBar" role="img"></div>
<div class="lab-obs bz"><div class="bz-h"><b>👀 试试：</b></div><ul class="pts"><li>只打开“目标”，再只打开“验收”，比一比哪个提升多</li><li>四个全开，再把无关文档拉到 3，看分数和下面的组成条怎么变</li></ul></div>
</div>
<div class="card quiz has-meta" id="quizUd" data-sec="Ud" data-z="3" data-zl="❓ 小测验" data-nh="1"></div>
<div class="ph-nav m-pn" data-sec="Ud"></div>
`,s={cls:a,html:t};export{a as cls,s as default,t as html};
