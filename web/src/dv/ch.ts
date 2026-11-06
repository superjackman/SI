/* R52 challenge share (#D/ch/<station>): one shareable quiz question with a QR that opens this answer page.
   Lazy chunk. Pilot: step 2 (gradient descent) and step 8a (attention). Reuses vf questions + share draw. */
import { tx, type L } from '../l4/txt';
import { QQ } from '../vf/data';
import { fillDvText } from './nums';
import { vfAdd, vfDone } from '../vf/ids';
import { dvI } from './links';
import type { PxApi } from '../px/view';

/** which station → which vf question id (pilot set) */
export const CH: Readonly<Record<string, string>> = { '2': 's2a', '8a': 's8a' };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function chUrl(k: string, l: L) {
  const base = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
  return `${base}?lang=${l}#D/ch/${k}`;
}

export async function challenge(id: string, A: PxApi) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l);
  const key = id === 'D/ch' ? '2' : id.slice('D/ch/'.length);
  const qid = CH[key];
  if (!qid || !(qid in QQ) || dvI(key) < 0) {
    A.top(`<b class="l4-tt">${z('挑战', 'Challenge')}</b>`);
    A.crumb([[z('首页', 'Home'), '#home'], [z('挑战', 'Challenge'), null]]);
    A.host.innerHTML = `<div class="px dv"><p class="px-sub">${z('这道挑战还没上线。', 'This challenge is not live yet.')}</p>
<button type="button" class="l4-b g-jump" data-go="#D/2">${z('去第 2 步', 'Go to step 2')}</button></div>`;
    A.step(null); if (A.still()) A.root.dataset.px = `D/ch.${l}`;
    return;
  }
  const Q = QQ[qid]!, done = vfDone().has(qid);
  const qText = fillDvText(tx(Q.q, l), l);
  A.top(`<b class="l4-tt">${z(`挑战 · 第 ${key} 步`, `Challenge · step ${key}`)}</b>`);
  A.crumb([[z('首页', 'Home'), '#home'], [z('推导之路', 'Derivation path'), '#D'], [z('挑战', 'Challenge'), null]]);
  A.step(null);
  const unit = Q.u ? tx(Q.u, l) : '';
  A.host.innerHTML = `<div class="px dv dv-chq" lang="${l === 'en' ? 'en' : 'zh-CN'}">
<p class="px-sub">${z('朋友出的挑战题 · 答对才揭晓讲解', 'A challenge from a friend · the explain unlocks when you get it right')}</p>
<section class="l4-ks"><h3 class="l4-kh c1">${z('题目', 'Question')}</h3><div class="l4-kbd"><p>${esc(qText)}</p>
${Q.o ? `<div class="vf-opts" role="list">${Q.o.map((o, i) => `<button type="button" class="l4-b vf-op" data-a="${i}">${esc(fillDvText(tx(o, l), l))}</button>`).join('')}</div>`
  : `<div class="vf-row"><input type="number" class="vf-in" inputmode="decimal" step="any" aria-label="${z('你的答案', 'Your answer')}" ${done ? 'disabled' : ''}><span class="vf-u">${esc(unit)}</span><button type="button" class="l4-b gold vf-go"${done ? ' disabled' : ''}>${z('提交', 'Submit')}</button></div>`}
<p class="vf-fb" aria-live="polite">${done ? z('✓ 你已经答对过这道题', '✓ You already got this right') : ''}</p>
</div></section>
<div class="vf-why" hidden>
<section class="l4-ks"><h3 class="l4-kh c2">${z('解答', 'Answer')}</h3><div class="l4-kbd"><p>${esc(fillDvText(tx(Q.w, l), l))}</p></div></section>
<div class="px-row l"><button type="button" class="l4-b g-jump" data-go="#D/${key}">${z(`看第 ${key} 步讲解 ›`, `Read step ${key} ›`)}</button>
<button type="button" class="l4-b" data-go="#D/routes">${z('选一条学习路线 ›', 'Pick a learning route ›')}</button></div>
</div>
<div class="px-row"><button type="button" class="l4-b g-act" data-a="share">${z('⤴ 分享这道挑战', '⤴ Share this challenge')}</button></div>
</div>`;
  A.host.scrollTop = 0;
  const fb = A.host.querySelector<HTMLElement>('.vf-fb')!, why = A.host.querySelector<HTMLElement>('.vf-why')!;
  if (done) why.hidden = false;
  const ok = (right: boolean) => {
    if (right) { vfAdd(qid); fb.textContent = z('✓ 答对了', '✓ Correct'); fb.className = 'vf-fb ok'; why.hidden = false; }
    else { fb.textContent = z('✗ 再试试：', '✗ Try again: ') + fillDvText(tx(Q.h, l), l); fb.className = 'vf-fb miss'; }
  };
  A.host.querySelectorAll<HTMLElement>('.vf-op').forEach((b) => b.addEventListener('click', () => {
    if (vfDone().has(qid)) return; ok(Number(b.dataset.a) === Q.a);
  }));
  A.host.querySelector('.vf-go')?.addEventListener('click', () => {
    if (vfDone().has(qid)) return;
    const raw = A.host.querySelector<HTMLInputElement>('.vf-in')?.value ?? '';
    const n = Number(raw), tol = Q.tol ?? 0.5 * 10 ** -Q.d;
    if (!Number.isFinite(n)) { fb.textContent = z('请输入一个数', 'Enter a number'); return; }
    ok(Math.abs(n - Q.a) <= tol);
  });
  A.host.querySelector('[data-a="share"]')?.addEventListener('click', () => { void shareCh(A, key, qText); });
  if (A.still()) A.root.dataset.px = `D/ch/${key}.${l}`;
}

async function shareCh(A: PxApi, key: string, qText: string) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l);
  const D = await import('../l4/share/draw');
  const url = chUrl(key, l);
  const d: import('../l4/share/draw').Data = {
    site: tx(D.SITE_N, l), url,
    lv: z('挑战题', 'Challenge'), lvC: '#c99a2e',
    path: z(`第 ${key} 步 · 自测`, `Step ${key} · self-check`),
    icon: '✎', name: z('敢不敢算一下？', 'Can you work this out?'),
    idea: qText.slice(0, 120),
    parts: [], co: '', why: '',
    head: z('扫码答题 · 答对揭晓', 'Scan to answer · unlock the explain'),
    badge: '✎', scan: z('扫码直接答题', 'Scan to answer'),
    how: '', whyT: '',
    pts: [z('不用会编程', 'No coding needed'), z('答对才看讲解', 'Explain unlocks when right'), z('再选一条学习路线', 'Then pick a learning route')],
    sub: z('一层层看懂 AI', 'AI, layer by layer'),
  };
  const m = document.createElement('div'); m.className = 'g-modal l4-shm'; A.root.appendChild(m);
  const { dlgHtml, download, shareOut, copyLink } = await import('../l4/share/modal');
  let fmt: 'story' | 'post' = 'story', blob: Blob | null = null, src = '', tok = 0;
  const keyH = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  function close() { m.remove(); removeEventListener('keydown', keyH); if (src) URL.revokeObjectURL(src); }
  const draw = async () => {
    const t = ++tok, [w, h] = fmt === 'story' ? [1080, 1920] : [1080, 1350];
    m.innerHTML = dlgHtml({ l, k: 'm', title: z('分享挑战', 'Share the challenge'), fmt,
      meta: z(`导出 ${w}×${h} · 扫码直达答题页`, `Exports ${w}×${h} · QR opens the answer page`) });
    const cv = D.draw(d, fmt), b = await D.png(cv); if (t !== tok || !m.isConnected) return;
    blob = b; if (src) URL.revokeObjectURL(src); src = URL.createObjectURL(b);
    const pv = m.querySelector<HTMLElement>('.g-pv')!;
    Object.assign(pv.dataset, { w: String(cv.width), h: String(cv.height), bytes: String(b.size), text: D.words(d), url, kind: 'ch' });
    pv.innerHTML = `<img alt="challenge" src="${src}">`;
  };
  m.addEventListener('click', (e) => {
    e.stopPropagation(); if (e.target === m) { close(); return; }
    const v = (e.target as HTMLElement).closest<HTMLElement>('[data-m]')?.dataset.m; if (!v) return;
    const st = m.querySelector<HTMLElement>('.g-st');
    if (v === 'close') close();
    else if (v.startsWith('fmt:')) { const f = v.slice(4) as 'story' | 'post'; if (f !== fmt) { fmt = f; void draw(); } }
    else if (v === 'save' && blob) download(blob, src, `si-challenge-${key}-${fmt}.png`);
    else if (v === 'share' && blob) void shareOut(blob, `si-challenge-${key}.png`, url, d.name + ': ' + d.idea, st, l);
    else if (v === 'copy') void copyLink(url, st, l);
  });
  addEventListener('keydown', keyH); await draw();
}
