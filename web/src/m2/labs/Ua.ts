/* Station Ua labs: labSession — a scripted coding session; the permission level decides which steps wait for you. labClick — see ../labClick. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { CLICK_IDS, clickLab } from '../labClick';
import { needsAsk, sessionSteps, type Perm, type Step } from '../logic';

export const LABS = [{ ids: ['labSession', 'ssPerm', 'ssTest', 'ssNext', 'ssAuto', 'ssReset', 'ssLog'], hooks: [] as string[] }, { ids: CLICK_IDS, hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const TXT: Record<string, [string, string]> = {
    readSrc: [t('② 读文件 src/order.ts：找到下单时没检查数量的地方', '② Read src/order.ts: find where the quantity is never checked'), t('读取 src/order.ts', 'read src/order.ts')],
    readTest: [t('② 读文件 tests/order.test.ts：看现有测试怎么写', '② Read tests/order.test.ts: see how the tests are written'), t('读取 tests/order.test.ts', 'read tests/order.test.ts')],
    editSrc: [t('③ 改文件 src/order.ts：数量 ≤ 0 时返回 400 和错误说明', '③ Edit src/order.ts: return 400 with a message when quantity ≤ 0'), t('修改 src/order.ts', 'edit src/order.ts')],
    addTest: [t('③ 改文件 tests/order.test.ts：新增“数量为 0 返回 400”', '③ Edit tests/order.test.ts: add “quantity 0 returns 400”'), t('修改 tests/order.test.ts', 'edit tests/order.test.ts')],
    runTest: [t('④ 跑命令 npm test → ⑤ 结果：13 个测试全部通过（示意）', '④ Run npm test → ⑤ result: all 13 tests pass (illustrative)'), t('运行命令 npm test', 'run the command npm test')],
    doneOk: [t('⑥ 完成：改了 2 个文件，测试通过，等你审查 diff', '⑥ Done: 2 files changed, tests pass; waiting for you to review the diff'), ''],
    doneUnverified: [t('⑥ 它说“完成了”——但没跑测试，没有证据证明 bug 真修好了', '⑥ It says “done”, but it ran no tests: there is no evidence the bug is fixed'), ''],
  };
  const st = { steps: [] as Step[], i: 0, asks: 0, waiting: false, over: false, auto: false, timer: 0 as unknown as ReturnType<typeof setTimeout> };
  const el = {
    perm: () => byId<HTMLSelectElement>(env, 'ssPerm'), test: () => byId<HTMLInputElement>(env, 'ssTest'),
    log: () => byId(env, 'ssLog'), ask: () => byId(env, 'ssAsk'), askT: () => byId(env, 'ssAskT'), stat: () => byId(env, 'ssStat'), warn: () => byId(env, 'ssWarn'),
  };
  const perm = () => (el.perm()?.value ?? 'edit') as Perm;
  const add = (html: string, cls = '') => { const li = env.document.createElement('li'); if (cls) li.className = cls; li.innerHTML = html; el.log()?.appendChild(li); };
  const stat = () => {
    const s = el.stat(); if (!s) return;
    s.textContent = st.over ? t(`共 ${st.i} 步，停下来问了你 ${st.asks} 次。`, `${st.i} steps; it stopped to ask you ${st.asks} time(s).`) : t(`第 ${st.i} / ${st.steps.length} 步 · 已问你 ${st.asks} 次`, `Step ${st.i} / ${st.steps.length} · asked you ${st.asks} time(s)`);
  };
  const stopAuto = () => { if (st.timer) { env.clearInterval(st.timer); st.timer = 0 as unknown as ReturnType<typeof setTimeout>; } };
  const finish = () => { st.over = true; stopAuto(); stat(); };
  const exec = (s: Step) => {
    const [txt] = TXT[s.key] as [string, string];
    add(txt, s.kind === 'done' ? (s.key === 'doneOk' ? 'ok' : 'bad') : s.kind);
    st.i++;
    if (s.kind === 'done') finish(); else stat();
  };
  const next = () => {
    if (st.over || st.waiting) return;
    const s = st.steps[st.i]; if (!s) { finish(); return; }
    if (needsAsk(perm(), s.kind)) {
      st.waiting = true; st.asks++; stopAuto();
      const a = el.ask(), at = el.askT();
      if (at) at.textContent = t('它想要：', 'It wants to: ') + (TXT[s.key] as [string, string])[1] + t('。允许吗？', '. Allow?');
      if (a) a.hidden = false;
      stat(); return;
    }
    exec(s);
  };
  const answer = (yes: boolean) => {
    if (!st.waiting) return;
    st.waiting = false; const a = el.ask(); if (a) a.hidden = true;
    const s = st.steps[st.i] as Step;
    if (yes) { exec(s); if (st.auto && !st.over) st.timer = env.setInterval(next, 450); return; }
    add(t(`✋ 你拒绝了“${(TXT[s.key] as [string, string])[1]}”：它停下来，说明改到了哪一步，等你决定下一步。`, `✋ You rejected “${(TXT[s.key] as [string, string])[1]}”: it stops, reports how far it got, and waits for your decision.`), 'bad');
    finish();
  };
  const reset = () => {
    stopAuto();
    st.steps = sessionSteps(el.test()?.checked ?? true); st.i = 0; st.asks = 0; st.waiting = false; st.over = false; st.auto = false;
    const l = el.log(); if (l) l.innerHTML = '';
    const a = el.ask(); if (a) a.hidden = true;
    const w = el.warn(); if (w) w.hidden = perm() !== 'auto';
    add(t('① 收到任务，开始干活', '① Task received; starting'), 'start');
    stat();
  };
  const session = () => {
    reset();
    const on = (id: string, ev: string, f: () => void) => byId(env, id)?.addEventListener(ev, f);
    on('ssNext', 'click', () => { st.auto = false; next(); });
    on('ssAuto', 'click', () => { if (st.over || st.waiting || st.timer) return; st.auto = true; next(); if (!st.over && !st.waiting) st.timer = env.setInterval(next, 450); });
    on('ssReset', 'click', reset);
    on('ssYes', 'click', () => answer(true));
    on('ssNo', 'click', () => answer(false));
    on('ssPerm', 'change', reset);
    on('ssTest', 'change', reset);
  };
  return { labs: [session, clickLab(env)], eager: () => {} };
}
