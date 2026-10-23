const t="level",a=`
<div class="pagehead" id="phUc"><h1 class="pg-t"><span class="pg-n">5</span>Extend it</h1><p class="pg-s">Tools, MCP, skills: new abilities without a new model.</p><details class="pg-more"><summary aria-label="Expand notes for this stop" title="Notes for this stop"><span aria-hidden="true">ⓘ</span> Notes</summary><div class="ph-one">Tools give it new actions, MCP plugs in tools others built, and skills give it know-how loaded on demand. All their descriptions take context.</div><p class="ph-why"><b>Why it’s designed this way: </b>Changing the model is slow and costly; manuals and hands from outside work the same day.</p></details><div class="ph-top"><span class="ph-lv">Stop 5 of 16 </span><span>📍 App overview › Using agents › Extend it</span></div><div class="ph-map" id="pmUc"><span>On this page: </span><button class="" data-sj="c_Uc_0" data-sp="Uc">Teach it more with</button><button class="" data-sj="c_Uc_1" data-sp="Uc">🔧 Tools: a manual </button><button class="" data-sj="c_Uc_2" data-sp="Uc">🔌 MCP: a universal</button><button class="" data-sj="c_Uc_3" data-sp="Uc">📦 Skills: know-how</button><button class="l3" data-sj="labCtxLoad" data-sp="Uc">🧪 How much context</button></div><div class="zoomnote" id="znUc" style="display:none"></div></div><div class="m-stage"><div class="m-dg main"><div class="m-vbar"><span class="m-vh">👆 Tap a box for details<br>🤏 Pinch or double-tap</span><button type="button" class="vz" data-vz="out" aria-label="Zoom out">−</button><span class="vp" aria-live="polite">100%</span><button type="button" class="vz" data-vz="in" aria-label="Zoom in">＋</button><button type="button" class="vz" data-vz="reset" aria-label="Reset" disabled="">⟲</button><button type="button" class="vz" data-vz="full" aria-label="View full screen">⛶</button></div><div class="diagram m-vw"><svg id="svgUc" viewBox="0 0 380 288" xmlns="http://www.w3.org/2000/svg" data-m="1"><defs><marker id="ahsvgUc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"></path></marker></defs><g class="comp cat-use" data-id="uTool" data-train="no" tabindex="0" role="button" aria-label="Tools (function calling)"><rect class="main" x="3" y="6" width="118" height="76" rx="12"></rect><text class="t" style="font-size:15px" x="62" y="33.0">Tools</text><text class="s" x="62" y="51.0">One more</text><text class="s" x="62" y="67.0">action</text></g><g class="comp cat-use" data-id="uMcp" data-train="no" tabindex="0" role="button" aria-label="MCP (Model Context Protocol)"><rect class="main" x="131" y="6" width="118" height="76" rx="12"></rect><text class="t" style="font-size:15px" x="190" y="33.0">MCP</text><text class="s" x="190" y="51.0">Plug in tools</text><text class="s" x="190" y="67.0">others built</text></g><g class="comp cat-use" data-id="uSkill" data-train="no" tabindex="0" role="button" aria-label="Skills (skill packs)"><rect class="main" x="259" y="6" width="118" height="76" rx="12"></rect><text class="t" style="font-size:15px" x="318" y="33.0">Skills</text><text class="s" x="318" y="51.0">A pack of</text><text class="s" x="318" y="67.0">know-how</text></g><path class="arrow" d="M62 82 V128" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#ahsvgUc)"></path><path class="arrow" d="M190 82 V128" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#ahsvgUc)"></path><path class="arrow" d="M318 82 V128" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#ahsvgUc)"></path><g class="comp cat-llm" data-id="ctxwin" data-train="no" tabindex="0" role="button" aria-label="Context window"><rect class="main" x="3" y="132" width="374" height="60" rx="12"></rect><text class="t" style="font-size:15px" x="190" y="159.0">How: the context window</text><text class="s" x="190" y="177.0">Their descriptions must fit in here first</text></g><path class="arrow" d="M190 192 V216" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#ahsvgUc)"></path><g class="comp cat-llm" data-id="think" data-train="no" tabindex="0" role="button" aria-label="③ Think / decide (LLM)"><rect class="main" x="65" y="220" width="250" height="62" rx="12"></rect><text class="t" style="font-size:15px" x="190" y="248.0">How: the LLM decides</text><text class="s" x="190" y="266.0">Reads them, picks one</text></g></svg></div></div><details class="m-leg"><summary>🎨 Legend: what the colours mean</summary><div class="legend"><span><i style="--c:#15803d;--f:#dcfce7"></i>Usage (how to use)</span><span><i style="--c:#4338ca;--f:#e0e7ff"></i>LLM internals</span></div></details></div>
<div class="card has-meta" id="c_Uc_0" data-z="1" data-zl="② Diagram" data-nh="1" data-cc="1">
<div class="cc-meta"><span class="zl z2">② Diagram</span></div><h2><button type="button" class="cc-h" aria-expanded="true">Teach it more without changing the model</button></h2><div class="cc-body">

<p class="lead">What a model knows is fixed at training time. The cheapest way to make it do new things is to hand it manuals and hands from outside. Three ways:</p>
<ul class="pts">
<li><a data-open="uTool">Tools (function calling)</a>: give it a new action (check stock, send a message).</li>
<li><a data-open="uMcp">MCP (Model Context Protocol)</a>: plug in whole sets of tools and data others have built, through one open protocol.</li>
<li><a data-open="uSkill">Skills (skill packs)</a>: hand it a pack of “how to do this kind of task” instructions (scripts optional), read only when needed.</li>
</ul>
<p>All three share one cost: their descriptions must go into the <a data-open="ctxwin">Context window</a> before the model knows they exist.</p>
</div></div>
<div class="card has-meta" id="c_Uc_1" data-z="2" data-zl="③ Details · why" data-nh="1" data-cc="1">
<div class="cc-meta"><span class="zl zm">③ Details · why</span></div><h3><button type="button" class="cc-h" aria-expanded="true">🔧 Tools: a manual plus a program</button></h3><div class="cc-body">

<p>A tool is two things a developer writes: a <b>manual</b> for the model (name, purpose, parameter format) and the <b>program</b> that does the work. For example: <span class="tag demo tag-s" title="Illustrative">Illustrative</span></p>
<pre class="json u-code">{
  "name": "check_stock",
  "description": "Look up the stock count of a product",
  "parameters": {
    "type": "object",
    "properties": { "sku": { "type": "string" } },
    "required": ["sku"]
  }
}</pre>
<p>When needed, the model writes text like <code>{"name":"check_stock","arguments":{"sku":"A-102"}}</code>; the program checks the arguments, calls the real system and sends the result back as text. Details in <a data-open="schema">Tool manual (function description)</a> and <a data-open="toolres">⑤ Tool result</a>.</p>
<p>Good tools: obvious names, a description that says when to use it, few parameters; keep read-only tools apart from ones that change things, and add confirmation to the latter.</p>
</div></div>
<div class="card has-meta" id="c_Uc_2" data-z="2" data-zl="③ Details · why" data-nh="1" data-cc="1">
<div class="cc-meta"><span class="zl zm">③ Details · why</span></div><h3><button type="button" class="cc-h" aria-expanded="true">🔌 MCP: a universal socket for tools</button></h3><div class="cc-body">

<p>MCP (Model Context Protocol) is an open protocol proposed in late 2024. Before it, each AI app had to integrate each tool separately (N apps × M tools); with one protocol, each side implements it once and they connect (N + M).</p>
<ul class="pts">
<li><b>Three roles</b>: the <a data-open="mcphost">AI app (host)</a> (the AI app you use) opens one <a data-open="mcpclient">MCP client</a> per server, connected to an <a data-open="mcpserver">MCP server</a>.</li>
<li><b>A server offers three kinds of things</b>: tools (actions), resources (data to read) and prompts (ready-made templates).</li>
<li><b>Two ways to connect</b>: standard input/output (stdio) when the server runs locally; HTTP when it is remote.</li>
</ul>
<p><b>Safety</b>: installing a server means trusting its code and everything it can reach, and what it returns may carry a <a data-open="inject">Prompt injection</a>. Install only trusted ones, and check the access they ask for.</p>
</div></div>
<div class="card has-meta" id="c_Uc_3" data-z="2" data-zl="③ Details · why" data-nh="1" data-cc="1">
<div class="cc-meta"><span class="zl zm">③ Details · why</span></div><h3><button type="button" class="cc-h" aria-expanded="true">📦 Skills: know-how loaded on demand</button></h3><div class="cc-body">

<p>A skill is a folder: a SKILL.md file says how to do a kind of task, starting with a name and a one-line description; it may also hold scripts and templates.</p>
<ol class="pts">
<li><b>Normally</b>: only each skill’s name and description sit in the context, a few dozen tokens each.</li>
<li><b>When relevant</b>: the agent decides a skill fits the task, then reads the full instructions and runs its scripts if needed.</li>
</ol>
<table class="gl stack"><tbody><tr><th></th><th>Tool</th><th>Skill</th></tr>
<tr><td>What it adds</td><td data-label="Tool">An action (hands)</td><td data-label="Skill">A way of working (know-how)</td></tr>
<tr><td>Context when idle</td><td data-label="Tool">The full manual</td><td data-label="Skill">Name + description only</td></tr>
<tr><td>Who runs it</td><td data-label="Tool">The app</td><td data-label="Skill">The agent follows it, using existing tools</td></tr>
</tbody></table>
</div></div>
<div class="lab-divider" data-z="3"><span>🧪 Hands-on lab: Extend it</span></div>
<div class="card lab has-meta" id="labCtxLoad" data-z="3" data-zl="🧪 Lab" data-nh="1">
<div class="cc-meta"><span class="zl z3">🧪 Lab</span><span class="tag demo tag-s" title="Illustrative">Illustrative</span></div><h3>🧪 How much context do the manuals take?</h3><p class="tag-note">ⓘ All token counts are illustrative round numbers; real ones depend on the model and how descriptions are written.</p>
<div class="lab-why bz"><div class="bz-h"><b>Why it’s built this way:</b></div><ul class="pts"><li>Every extension must introduce itself first, in the context; the more you install, the more crowded it gets.</li><li>Loading on demand (name and one line first, full text when used) is how skills and many tool systems save room.</li></ul></div>
<div class="ctrls">
<label>Extensions installed <select id="clN"><option value="3">3</option><option value="10" selected>10</option><option value="30">30</option></select></label>
<label>Loading <select id="clMode"><option value="all">Put everything in</option><option value="lazy">Load on demand</option></select></label>
</div>
<div class="u-bar" id="clBar" role="img"></div>
<div class="u-legend" id="clLeg"></div>
<p class="u-stat" id="clStat" aria-live="polite"></p>
<div class="row" style="gap:6px;margin:6px 0"><button class="btn primary" id="clCall">Call a tool once</button><button class="btn" id="clReset">Reset</button></div>
<pre class="json u-code" id="clOut" hidden></pre>
<div class="lab-obs bz"><div class="bz-h"><b>👀 Try this:</b></div><ul class="pts"><li>Pick 30, put everything in, and see how much the manuals take</li><li>Switch to “load on demand” and compare</li><li>With on-demand loading, tap “Call a tool once” and see when the full manual comes in</li></ul></div>
</div>
<div class="card quiz has-meta" id="quizUc" data-sec="Uc" data-z="3" data-zl="❓ Quiz" data-nh="1"></div>
<div class="ph-nav m-pn" data-sec="Uc"></div>
`,e={cls:t,html:a};export{t as cls,e as default,a as html};
