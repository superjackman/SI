/* R56 记忆 + 成就 (lazy chunk): #R/rv 今日复习 (3 questions, 1 / 3 / 7-day spacing + 错题本), #R/so1–5 阶段排序
   (put one pyramid layer's stations back in order), the badge wall on #R (earned from mastery, never from views),
   and the nameless 9:16 certificate with a challenge question + QR. All local; nothing is sent anywhere. */
import './mem.css';
import { UI, tx, type L } from '../l4/txt';
import { DV_KEY, DV_LV, DV_N, DV_NM, dvI } from '../dv/links';
import { layerMastery, masteredSt, seenSt } from '../dv/prog';
import { ROUTES } from '../dv/routes';
import { VF_Q, order, vfDone } from '../vf/ids';
import { QQ } from '../vf/data';
import { fillDvText } from '../dv/nums';
import * as RV from './rv';
import * as R from './rec';
import type { PxApi } from './view';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const stN = (k: string, l: L) => tx(DV_NM[dvI(k)] ?? [k, k], l);
/** which station a self-check question belongs to */
const ST_OF: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(VF_Q).filter(([p]) => p.startsWith('D/')).flatMap(([p, ids]) => ids.map((id) => [id, p.slice(2)])));
export const stOf = (id: string) => ST_OF[id] ?? '';
const lyKs = (n: number) => DV_KEY.filter((_, i) => DV_LV[i] === n);
const SO_KEY = 'si.so';
export const soAll = (): Record<string, 1> => { try { const v = JSON.parse(localStorage.getItem(SO_KEY) || '{}') as unknown; return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, 1>) : {}; } catch { return {}; } };
const soSet = (n: number) => { const a = soAll(); a[String(n)] = 1; try { localStorage.setItem(SO_KEY, JSON.stringify(a)); } catch { /* private mode */ } };
const fin = (A: PxApi, id: string) => { if (A.still()) A.root.dataset.px = `${id}.${A.l}`; };

export async function mem(id: string, A: PxApi) {
  if (id === 'R/rv') return review(A);
  const n = Number(id.slice(4)); if (/^R\/so[1-5]$/.test(id)) return sort(A, n);
  return review(A);
}

/** the line under each picked question: 上次错 / n 天前学 · 第 X 站 */
export function pickTag(p: RV.Pick, l: L) {
  const z = (a: string, b: string) => tx([a, b], l), k = stOf(p.id);
  const w = p.why === 'w' ? z('上次错', 'Missed last time') : p.ago <= 0 ? z('今天学', 'Learned today') : z(`${p.ago} 天前学`, `Learned ${p.ago} day${p.ago === 1 ? '' : 's'} ago`);
  return `${w}${k ? ` · ${z(`第 ${k} 站`, `stop ${k}`)}` : ''}`;
}

/* ---------- 今日复习 ---------- */
async function review(A: PxApi) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l);
  A.top(`<b class="l4-tt">${z('今日复习', 'Today’s review')}</b>`);
  A.crumb([[z('首页', 'Home'), '#home'], [z('学习记录', 'Record'), '#R'], [z('今日复习', 'Review'), null]]); A.step(null);
  const picks = RV.rvPick(3), nx = RV.rvNext(), wb = RV.wrongIds().length;
  const how = `<p class="mm-how">${z('凭记忆先做，再看答案：回想比重读记得牢。做对的题 1、3、7 天后再回来；做错的会先回来，直到在这里做对。', 'Answer from memory first, then check: recalling beats rereading. Right answers come back after 1, 3 and 7 days; wrong ones come back first until you get them right here.')}</p>`;
  if (!picks.length) {
    A.host.innerHTML = `<div class="px mm" lang="${l === 'en' ? 'en' : 'zh-CN'}"><section class="mm-card mm-done"><b>✓ ${z('今天没有要复习的题', 'Nothing to review today')}</b><p>${nx ? z(`下一批 ${nx} 天后回来。`, `The next ones come back in ${nx} day${nx === 1 ? '' : 's'}.`) : z('先去一站做几道小测，做过的题会按 1、3、7 天回来考你。', 'Answer a few questions at a stop first; they come back after 1, 3 and 7 days.')}</p></section>${how}
<div class="px-row"><button type="button" class="l4-b gold" data-go="#P">${z('去练习', 'Practice')} ›</button><button type="button" class="l4-b" data-go="#R">${z('学习记录', 'Record')}</button></div></div>`;
    A.host.scrollTop = 0; fin(A, 'R/rv'); return;
  }
  A.host.innerHTML = `<div class="px mm" lang="${l === 'en' ? 'en' : 'zh-CN'}"><section class="mm-card"><div class="mm-h"><b>${z(`今天回想 ${picks.length} 题`, `Recall ${picks.length} today`)}</b><span>${z(`错题本 ${wb} 题`, `Wrong book: ${wb}`)}</span></div>
<ol class="mm-tags">${picks.map((p) => `<li data-q="${p.id}"><span>${esc(pickTag(p, l))}</span><b>${esc(stN(stOf(p.id) || '0', l))}</b></li>`).join('')}</ol></section>${how}
<div class="mm-slot"></div><p class="mm-fin" role="status" aria-live="polite" hidden></p>
<div class="px-row"><button type="button" class="l4-b" data-go="#home">${z('回首页', 'Home')}</button><button type="button" class="l4-b" data-go="#R">${z('学习记录', 'Record')}</button></div></div>`;
  A.host.scrollTop = 0;
  const slot = A.host.querySelector<HTMLElement>('.mm-slot')!, finP = A.host.querySelector<HTMLElement>('.mm-fin')!, ok = new Set<string>();
  const ui = await import('../vf/ui'); if (!A.still()) return;
  ui.mount(slot, 'R/rv', l, undefined, undefined, { ids: picks.map((p) => p.id), rev: true, onJudge: (q, right) => {
    const li = A.host.querySelector<HTMLElement>(`.mm-tags li[data-q="${q}"]`); if (right) { ok.add(q); li?.classList.add('ok'); }
    if (ok.size === picks.length) { finP.hidden = false; finP.innerHTML = `<b>✓ ${z('今天复习完了', 'Done for today')}</b> ${z('这几题会隔更久再回来。', 'These come back after a longer gap.')}`; }
  } });
  fin(A, 'R/rv');
}

/* ---------- 阶段排序 ---------- */
async function sort(A: PxApi, n: number) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l), ks = lyKs(n), sn = seenSt(), read = ks.filter((k) => sn.has(k)).length;
  const lvN = tx(UI.lvN[n - 1]!, l);
  A.top(`<b class="l4-tt">${z(`阶段排序 · 第 ${n} 层`, `Put in order · layer ${n}`)}</b>`);
  A.crumb([[z('首页', 'Home'), '#home'], [z('学习记录', 'Record'), '#R'], [z('阶段排序', 'Order'), null]]); A.step(null);
  const lang = l === 'en' ? 'en' : 'zh-CN';
  if (read < ks.length) {
    const first = ks.find((k) => !sn.has(k))!;
    A.host.innerHTML = `<div class="px mm" lang="${lang}"><section class="mm-card"><b>🔒 ${z(`读完第 ${n} 层「${lvN}」的 ${ks.length} 站后解锁`, `Unlocks after the ${ks.length} stops of layer ${n}, “${lvN}”`)}</b><p>${z(`已读 ${read}/${ks.length} 站。`, `${read}/${ks.length} read.`)}</p></section>
<div class="px-row"><button type="button" class="l4-b gold" data-go="#D/${first}">${z(`去第 ${first} 站`, `Go to stop ${first}`)} ›</button></div></div>`;
    A.host.scrollTop = 0; fin(A, `R/so${n}`); return;
  }
  const mix = order('so' + n, ks.length).map((i) => ks[i]!), pick: string[] = [];
  A.host.innerHTML = `<div class="px mm" lang="${lang}"><div class="mm-sw"></div></div>`;
  const sw = A.host.querySelector<HTMLElement>('.mm-sw')!;
  const draw = () => {
    const full = pick.length === ks.length;
    sw.innerHTML = `<section class="mm-card"><div class="mm-h"><b>${z(`第 ${n} 层「${lvN}」：按推导顺序排好`, `Layer ${n}, “${lvN}”: put them in derivation order`)}</b><span>${soAll()[String(n)] ? z('排对过 ✓', 'done ✓') : ''}</span></div>
<p class="mm-how">${z('每一站都在解决上一站留下的问题。按顺序点：先发生的先点；点错了可以点上面的取消。', 'Each stop answers what the one before left open. Tap them in order, first one first; tap one above to take it back.')}</p>
<ol class="mm-seq">${pick.map((k, j) => `<li><button type="button" class="mm-c on" data-so="un:${j}"><i>${j + 1}</i><b>${esc(stN(k, l))}</b></button></li>`).join('')}${pick.length < ks.length ? `<li class="mm-gap"><span>${z(`第 ${pick.length + 1} 个是？`, `Number ${pick.length + 1}?`)}</span></li>` : ''}</ol>
<div class="mm-pool">${mix.filter((k) => !pick.includes(k)).map((k) => `<button type="button" class="mm-c" data-so="k:${k}"><b>${esc(stN(k, l))}</b></button>`).join('')}</div>
${full ? `<button type="button" class="l4-b gold mm-go" data-so="ck">${z('检查顺序', 'Check the order')}</button>` : ''}<div class="mm-res" role="status" aria-live="polite"></div></section>`;
  };
  const check = () => {
    const right = pick.every((k, j) => k === ks[j]), res = sw.querySelector<HTMLElement>('.mm-res')!;
    sw.querySelector('[data-so="ck"]')?.remove();
    sw.querySelectorAll<HTMLElement>('.mm-seq .mm-c').forEach((b, j) => b.classList.add(pick[j] === ks[j] ? 'ok' : 'bad'));
    if (right) { soSet(n); res.innerHTML = `<p class="mm-ok"><b>✓ ${z('排对了！', 'All in order!')}</b> ${z('这一层的推导你串起来了。', 'You have this layer’s chain.')}</p><ol class="mm-key">${ks.map((k) => `<li><button type="button" class="l4-b" data-go="#D/${k}">${z(`第 ${k} 站`, `Stop ${k}`)} · ${esc(stN(k, l))}</button></li>`).join('')}</ol>`; }
    else res.innerHTML = `<p class="mm-bad"><b>✗ ${z(`${pick.filter((k, j) => k !== ks[j]).length} 个位置不对`, `${pick.filter((k, j) => k !== ks[j]).length} out of place`)}</b> ${z('想一想：它要先有哪一站留下的问题？', 'Ask: which stop’s open question does it need first?')}</p><button type="button" class="l4-b mm-go" data-so="re">${z('再排一次', 'Try again')}</button>`;
  };
  draw(); A.host.scrollTop = 0;
  sw.addEventListener('click', (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>('[data-so]')?.dataset.so; if (!v) return; e.stopPropagation();
    if (v.startsWith('k:')) { pick.push(v.slice(2)); draw(); }
    else if (v.startsWith('un:')) { pick.splice(Number(v.slice(3))); draw(); }
    else if (v === 'ck') check();
    else if (v === 're') { pick.length = 0; draw(); }
  });
  fin(A, `R/so${n}`);
}

/* ---------- badges (mastery, never views) ---------- */
export interface Bdg { id: string; e: string; t: string; how: string; on: boolean }
export function badges(l: L): Bdg[] {
  const z = (a: string, b: string) => tx([a, b], l), m = masteredSt(vfDone()), lm = layerMastery(m), sk = R.streak(), so = soAll(), wr = RV.wrongIds().length, ew = RV.everWrong();
  const B: Bdg[] = [{ id: 'm1', e: '⭐', t: z('第一站掌握', 'First stop mastered'), how: z('任一站小测全对或小目标全点亮', 'All questions or all small goals of one stop'), on: m.size >= 1 }];
  lm.forEach(([s, t], i) => B.push({ id: `l${i + 1}`, e: ['🧭', '🛠', '🧠', '⚙', '📐'][i]!, t: z(`第 ${i + 1} 层通关`, `Layer ${i + 1} cleared`), how: z(`掌握第 ${i + 1} 层全部 ${t} 站（${s}/${t}）`, `Master all ${t} stops of layer ${i + 1} (${s}/${t})`), on: t > 0 && s === t }));
  for (const r of ROUTES) { const d = r.st.filter((k) => m.has(String(k))).length; B.push({ id: `r-${r.id}`, e: '🚇', t: z(`路线：${tx(r.n, 'zh')}`, `Route: ${tx(r.n, 'en')}`), how: z(`掌握这条路线的 ${r.st.length} 站（${d}/${r.st.length}）`, `Master its ${r.st.length} stops (${d}/${r.st.length})`), on: d === r.st.length }); }
  B.push({ id: 's3', e: '🔥', t: z('连续 3 天', '3 days in a row'), how: z(`连续 3 天都学一点（现在 ${sk} 天）`, `Learn a little 3 days running (now ${sk})`), on: sk >= 3 });
  B.push({ id: 's7', e: '🔥', t: z('连续 7 天', '7 days in a row'), how: z(`连续 7 天都学一点（现在 ${sk} 天）`, `Learn a little 7 days running (now ${sk})`), on: sk >= 7 });
  B.push({ id: 'w0', e: '🧹', t: z('错题清零', 'Wrong book cleared'), how: ew ? z(`在今日复习里把错题做对（还剩 ${wr}）`, `Get the wrong ones right in review (${wr} left)`) : z('有过错题，再在今日复习里全部做对', 'Miss some, then get them all right in review'), on: ew && wr === 0 });
  const sd = Object.keys(so).length; B.push({ id: 'so', e: '🧩', t: z('阶段排序', 'Put in order'), how: z(`把一层的站排对顺序（${sd}/5 层）`, `Put one layer’s stops in order (${sd}/5)`), on: sd > 0 });
  return B;
}
/** the certificate unlocks with a whole layer or a whole route mastered; returns what to write, or null */
export function certOf(l: L): { what: string; n: number } | null {
  const m = masteredSt(vfDone()), lm = layerMastery(m);
  const r = ROUTES.filter((x) => x.st.every((k) => m.has(String(k)))).sort((a, b) => b.st.length - a.st.length)[0];
  if (r) return { what: tx(r.n, l), n: m.size };
  const i = lm.findIndex(([s, t]) => t > 0 && s === t); if (i >= 0) return { what: tx(UI.lvN[i]!, l), n: m.size };
  return null;
}
/** the badge wall + certificate + stage-sort rows, drawn into the record page */
export function wall(slot: HTMLElement, A: PxApi) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l), B = badges(l), got = B.filter((b) => b.on).length, c = certOf(l), so = soAll(), sn = seenSt();
  const rows = [1, 2, 3, 4, 5].map((n) => { const ks = lyKs(n), rd = ks.filter((k) => sn.has(k)).length, ok = rd === ks.length;
    return `<button type="button" class="mm-so${so[String(n)] ? ' on' : ''}" data-go="#R/so${n}"><b>${z(`第 ${n} 层`, `Layer ${n}`)} · ${esc(tx(UI.lvN[n - 1]!, l))}</b><span>${so[String(n)] ? z('排对过 ✓', 'done ✓') : ok ? z(`${ks.length} 站 · 去排序 ›`, `${ks.length} stops · order them ›`) : z(`🔒 读完 ${rd}/${ks.length} 站解锁`, `🔒 read ${rd}/${ks.length} to unlock`)}</span></button>`; }).join('');
  slot.innerHTML = `<h3>${z(`成就徽章 · ${got}/${B.length}`, `Badges · ${got}/${B.length}`)}</h3><p class="px-f">${z('徽章只看掌握（做对、点亮），不看浏览。', 'Badges count mastery (answers right, goals lit), never page views.')}</p>
<ul class="mm-bdg">${B.map((b) => `<li class="${b.on ? 'on' : ''}"><i aria-hidden="true">${b.on ? b.e : '○'}</i><b>${esc(b.t)}</b><span>${b.on ? z('已获得', 'Earned') : esc(b.how)}</span></li>`).join('')}</ul>
<h3>${z('结业证书', 'Certificate')}</h3>
<div class="mm-cert">${c ? `<p>${z(`已解锁：「${esc(c.what)}」。证书不写名字，只写你真实做到的事，并附一道挑战题和二维码。`, `Unlocked: “${esc(c.what)}”. No name on it: only what you really did, plus a challenge question and a QR code.`)}</p><button type="button" class="l4-b gold" data-mm="cert">${z('生成 9:16 证书', 'Make the 9:16 certificate')}</button>` : `<p>${z('掌握一整层或一整条路线的全部站后解锁。证书不写名字，只写你真实做到的事。', 'Unlocks once you master every stop of one layer or one route. No name on it: only what you really did.')}</p>`}</div>
<h3>${z('阶段排序', 'Put each layer in order')}</h3><div class="mm-sos">${rows}</div>`;
  slot.querySelector('[data-mm="cert"]')?.addEventListener('click', () => { void cert(A); });
}

/** the friend link: the sharer's first-try accuracy and stops mastered ride in the URL (no server) */
export function certUrl(k: string, l: L, fa: number, fm: number) {
  const base = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
  return `${base}?lang=${l}&fa=${Math.round(fa)}&fm=${fm}#D/ch/${k}`;
}
async function cert(A: PxApi) {
  const l = A.l, z = (a: string, b: string) => tx([a, b], l), c = certOf(l); if (!c) return;
  const D = await import('../l4/share/draw'), { CH } = await import('../dv/ch');
  const m = masteredSt(vfDone()), ft = RV.firstTry(), vd = vfDone().size;
  const k = [...m].filter((x) => CH[x]).sort((a, b) => dvI(b) - dvI(a))[0] ?? '2', qid = CH[k]!, Q = QQ[qid]!;
  const url = certUrl(k, l, ft.p, c.n), qText = fillDvText(tx(Q.q, l), l).replace(/`/g, '');
  const d: import('../l4/share/draw').Data = {
    site: tx(D.SITE_N, l), url, lv: z('结业证书', 'Certificate'), lvC: '#c99a2e', path: '', icon: '🎓',
    name: z(`我从一道小学算术，亲手推到了「${c.what}」`, `From grade-school arithmetic, I worked my way to “${c.what}”`),
    idea: z(`掌握 ${c.n}/${DV_N} 站 · 答对 ${vd} 题${ft.n ? ` · 首答正确率 ${ft.p}%` : ''}`, `${c.n}/${DV_N} stops mastered · ${vd} right${ft.n ? ` · ${ft.p}% right first try` : ''}`),
    parts: [], co: '', why: '', head: z('每一题都是自己算出来的', 'Every answer worked out by hand'), badge: '🎓',
    scan: z('扫码接受挑战', 'Scan to take the challenge'), how: '', whyT: '',
    pts: [z(`挑战你：${qText}`, `Your challenge: ${qText}`).slice(0, 90), z('答对才揭晓讲解', 'The explanation unlocks when you get it right'), z('看看你的首答能不能比我高', 'See if your first try beats mine')],
    sub: z('一层层看懂 AI', 'AI, layer by layer'),
  };
  const box = document.createElement('div'); box.className = 'g-modal l4-shm'; A.root.appendChild(box);
  const { dlgHtml, download, shareOut, copyLink } = await import('../l4/share/modal');
  let blob: Blob | null = null, src = '';
  const keyH = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  function close() { box.remove(); removeEventListener('keydown', keyH); if (src) URL.revokeObjectURL(src); }
  box.innerHTML = dlgHtml({ l, k: 'm', title: z('结业证书', 'Certificate'), fmt: 'story', meta: z('导出 1080×1920 · 不写名字 · 扫码直达挑战题', 'Exports 1080×1920 · no name · the QR opens the challenge') });
  const seg = box.querySelector<HTMLElement>('.g-seg'); if (seg) seg.hidden = true;
  const cv = D.draw(d, 'story'); blob = await D.png(cv); if (!box.isConnected) return; src = URL.createObjectURL(blob);
  const pv = box.querySelector<HTMLElement>('.g-pv')!;
  Object.assign(pv.dataset, { w: String(cv.width), h: String(cv.height), bytes: String(blob.size), text: D.words(d), url, kind: 'cert' });
  pv.innerHTML = `<img alt="${z('结业证书', 'Certificate')}" src="${src}">`;
  box.addEventListener('click', (e) => {
    e.stopPropagation(); if (e.target === box) { close(); return; }
    const v = (e.target as HTMLElement).closest<HTMLElement>('[data-m]')?.dataset.m; if (!v) return;
    const st = box.querySelector<HTMLElement>('.g-st');
    if (v === 'close') close();
    else if (v === 'save' && blob) download(blob, src, 'si-certificate.png');
    else if (v === 'share' && blob) void shareOut(blob, 'si-certificate.png', url, d.name, st, l);
    else if (v === 'copy') void copyLink(url, st, l);
  });
  addEventListener('keydown', keyH);
}
