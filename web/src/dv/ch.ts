/* R52 challenge share (#D/ch/<station>): one shareable quiz question with a QR that opens this answer page.
   Lazy chunk. Pilot: step 2 (gradient descent) and step 8a (attention). Reuses vf questions + share draw. */
import { tx, type L } from '../l4/txt';
import { QQ } from '../vf/data';
import { fillDvText } from './nums';
import { VF_Q, order, vfAdd, vfDone } from '../vf/ids';
import { DV_KEY, dvI } from './links';
import type { PxApi } from '../px/view';
import { firstTry } from '../px/rv';
import { masteredSt } from './prog';

/** which station → which vf question id: the R52 pilot (2, 8a), and (R53) every other station with a choice
    question gets its first one, so the home page's 今天的挑战 can be shared as the very same question */
const PILOT: Readonly<Record<string, string>> = { '2': 's2a', '8a': 's8a' };
export const CH: Readonly<Record<string, string>> = { ...Object.fromEntries(DV_KEY.flatMap((k) => { const id = (VF_Q['D/' + k] ?? []).find((q) => QQ[q]?.o); return id ? [[k, id]] : []; })), ...PILOT };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** R56: the link carries the sharer's first-try accuracy (fa, %) and stops mastered (fm) once they have answered
    something — the friend's page shows them; nothing is stored on any server */
export function chUrl(k: string, l: L) {
  const base = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`, ft = firstTry();
  return `${base}?lang=${l}${ft.n ? `&fa=${ft.p}&fm=${masteredSt().size}` : ''}#D/ch/${k}`;
}
/** the sharer's numbers from the URL, validated (fa 0–100, fm 0–DV_N), or null */
export function sharer(search = location.search): { fa: number; fm: number } | null {
  const p = new URLSearchParams(search), a = p.get('fa'), m = p.get('fm');
  if (a == null || m == null || !/^\d{1,3}$/.test(a) || !/^\d{1,2}$/.test(m)) return null;
  const fa = Number(a), fm = Number(m); return fa <= 100 && fm <= DV_KEY.length ? { fa, fm } : null;
}

export async function challenge(id: string, A: PxApi) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l);
  const key = id === 'D/ch' ? '2' : id.slice('D/ch/'.length);
  const qid = CH[key];
  if (!qid || !(qid in QQ) || dvI(key) < 0) {
    A.top(`<b class="l4-tt">${z('挑战', 'Challenge')}</b>`);
    A.crumb([[z('首页', 'Home'), '#home'], [z('挑战', 'Challenge'), null]]);
    A.host.innerHTML = `<div class="px dv"><p class="px-sub">${z('这道挑战还没上线。', 'This challenge is not live yet.')}</p>
<button type="button" class="l4-b g-jump" data-go="#D/2">${z('去第 2 站', 'Go to stop 2')}</button></div>`;
    A.step(null); if (A.still()) A.root.dataset.px = `D/ch.${l}`;
    return;
  }
  const Q = QQ[qid]!, done = vfDone().has(qid);
  const qText = fillDvText(tx(Q.q, l), l).replace(/`/g, '');
  A.top(`<b class="l4-tt">${z(`挑战 · 第 ${key} 站`, `Challenge · stop ${key}`)}</b>`);
  const sh = sharer();
  const ban = sh ? `<section class="dv-fr"><b>${z(`分享者首答正确率 ${sh.fa}%，掌握 ${sh.fm} 站`, `The sharer: ${sh.fa}% right at the first try, ${sh.fm} stops mastered`)}</b><span>${z('你的首答呢？只算第一次作答。', 'And your first try? Only the first answer counts.')}</span></section>` : '';
  A.crumb([[z('首页', 'Home'), '#home'], [z('推导之路', 'Derivation path'), '#D'], [z('挑战', 'Challenge'), null]]);
  A.step(null);
  const unit = Q.u ? tx(Q.u, l) : '';
  A.host.innerHTML = `<div class="px dv dv-chq" lang="${l === 'en' ? 'en' : 'zh-CN'}">
${ban}<p class="px-sub">${z('朋友出的挑战题 · 答对才揭晓讲解', 'A challenge from a friend · the explain unlocks when you get it right')}</p>
<p class="dv-fy" aria-live="polite" hidden></p>
<section class="l4-ks"><h3 class="l4-kh c1">${z('题目', 'Question')}</h3><div class="l4-kbd"><p>${esc(qText)}</p>
${Q.o ? `<div class="vf-opts" role="list">${order(qid, Q.o.length).map((i) => `<button type="button" class="l4-b vf-op" data-a="${i}">${esc(fillDvText(tx(Q.o![i]!, l), l).replace(/`/g, ''))}</button>`).join('')}</div>`
  : `<div class="vf-row"><input type="number" class="vf-in" inputmode="decimal" step="any" aria-label="${z('你的答案', 'Your answer')}" ${done ? 'disabled' : ''}><span class="vf-u">${esc(unit)}</span><button type="button" class="l4-b gold vf-go"${done ? ' disabled' : ''}>${z('提交', 'Submit')}</button></div>`}
<p class="vf-fb" aria-live="polite">${done ? z('✓ 你已经答对过这道题', '✓ You already got this right') : ''}</p>
</div></section>
<div class="vf-why" hidden>
<section class="l4-ks"><h3 class="l4-kh c2">${z('解答', 'Answer')}</h3><div class="l4-kbd"><p>${esc(fillDvText(tx(Q.w, l), l).replace(/`/g, '').replace(/\*\*/g, ''))}</p></div></section>
<div class="px-row l"><button type="button" class="l4-b gold" data-go="#D/${key}">${z(`从这一站开始学：第 ${key} 站 ›`, `Start learning here: stop ${key} ›`)}</button>
<button type="button" class="l4-b" data-go="#D/routes">${z('选一条学习路线 ›', 'Pick a learning route ›')}</button></div>
</div>
<div class="px-row"><button type="button" class="l4-b g-act" data-a="share">${z('⤴ 分享这道挑战', '⤴ Share this challenge')}</button></div>
</div>`;
  A.host.scrollTop = 0;
  const fb = A.host.querySelector<HTMLElement>('.vf-fb')!, why = A.host.querySelector<HTMLElement>('.vf-why')!;
  if (done) why.hidden = false;
  const fy = A.host.querySelector<HTMLElement>('.dv-fy')!; let first: boolean | null = done ? true : null;
  const ok = (right: boolean) => {
    if (first === null) { first = right; fy.hidden = false; fy.className = `dv-fy ${right ? 'ok' : 'bad'}`;
      fy.textContent = right ? z(`你答对了 1/1（首答）${sh ? ` · 分享者首答正确率 ${sh.fa}%` : ''}`, `You got 1/1 at the first try${sh ? ` · the sharer: ${sh.fa}%` : ''}`) : z(`首答 0/1，再算一次也能解锁讲解${sh ? ` · 分享者首答正确率 ${sh.fa}%` : ''}`, `First try 0/1; get it right to unlock the explanation${sh ? ` · the sharer: ${sh.fa}%` : ''}`); }
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
    path: z(`第 ${key} 站 · 自测`, `Stop ${key} · self-check`),
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
