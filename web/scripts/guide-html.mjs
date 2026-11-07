/** Task guide HTML shared by the app and the static pages. Facts live in guide.json. */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const bi = (pair, L) => (L === 'en' ? pair[1] : pair[0]);
const LAB = {
  zh: {
    fit: '适合', unfit: '不适合', first: '最小的一步', out: '文档里的结果', lic: '许可',
    repo: '仓库', docs: '文档', deploy: '部署要什么', fail: '文档里写过的失败', src: '来源',
    checked: '核对', diff: '同一件事，真实的差别', reach: '中国大陆能不能打开', pick: '按同一件事来选',
  },
  en: {
    fit: 'Suits', unfit: 'Not for', first: 'Smallest first step', out: 'What the docs say you see', lic: 'License',
    repo: 'Repository', docs: 'Docs', deploy: 'What it takes to run', fail: 'A failure the docs name', src: 'Sources',
    checked: 'Checked', diff: 'Same job, real differences', reach: 'Mainland China', pick: 'Pick by the job',
  },
};
const links = (xs) => `<ul class="hb-src">${xs.map((u) => `<li><a href="${esc(u)}">${esc(u)}</a></li>`).join('')}</ul>`;
function groupOf(guide, id) {
  return (guide.groups || []).find((g) => g.ids.includes(id)) || null;
}
function diffBlock(g, L) {
  const t = LAB[L];
  const items = g.diffs.map((d) => `<li>${esc(bi([d.zh, d.en], L))}${links(d.src)}</li>`).join('');
  return `<section class="hb-diff" data-guide-diff="${esc(g.id)}"><h3>${esc(t.diff)}</h3><p>${esc(bi(g.task, L))}</p><ol>${items}</ol></section>`;
}
/** the short block at the top of the tool list */
export function guideLead(guide, L) {
  const t = LAB[L];
  const blocks = (guide.groups || []).map((g) => diffBlock(g, L)).join('');
  return `<section class="hb-lead" data-guide-lead="1"><h2>${esc(t.pick)}</h2><p>${esc(bi(guide.reach, L))}</p>${blocks}<p class="hb-meta">${esc(t.checked)} ${esc(guide.checked)}</p></section>`;
}
/** one tool's decision page. Empty string when this id is not in the first batch. */
export function guideDetail(guide, id, L) {
  const it = guide.items?.[id];
  if (!it) return '';
  const t = LAB[L];
  const g = groupOf(guide, id);
  const row = (k, html) => `<section><h3>${esc(t[k])}</h3>${html}</section>`;
  return `<article class="hb-g" data-guide="${esc(id)}">
${row('fit', `<p>${esc(bi(it.fit, L))}</p>`)}
${row('unfit', `<p>${esc(bi(it.unfit, L))}</p>`)}
${row('first', `<p>${esc(bi(it.first, L))}</p>`)}
${row('out', `<p>${esc(bi(it.out, L))}</p>`)}
${row('lic', `<p>${esc(bi(it.lic, L))}</p><p><a href="${esc(it.licUrl)}">${esc(it.licUrl)}</a></p>`)}
${row('repo', `<p><a href="${esc(it.repo)}">${esc(it.repo)}</a></p>`)}
${row('docs', `<p><a href="${esc(it.docs)}">${esc(it.docs)}</a></p>`)}
${row('deploy', `<p>${esc(bi(it.deploy, L))}</p>`)}
${row('fail', `<p>${esc(bi(it.fail, L))}</p>`)}
${row('reach', `<p>${esc(bi(guide.reach, L))}</p>`)}
${g ? diffBlock(g, L) : ''}
${row('src', links(it.src))}
<p class="hb-meta">${esc(t.checked)} ${esc(guide.checked)}</p>
</article>`;
}
