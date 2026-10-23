/* Station Uc lab: labCtxLoad — how much of the context window the extensions' manuals take (illustrative tokens). */
import type { Env } from '../../legacy/runtime';
import { bar, byId, fmt, tr } from '../kit';
import { CTX, ctxLoad } from '../logic';

export const LABS = [{ ids: ['labCtxLoad', 'clN', 'clMode', 'clBar', 'clCall'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  let called = false;
  const L = { sys: t('系统提示', 'System prompt'), tools: t('扩展说明', 'Extension manuals'), loaded: t('刚读入的完整说明', 'Full manual just loaded'), chat: t('对话', 'Conversation'), free: t('剩余空间', 'Free space') };
  const render = () => {
    const n = +(byId<HTMLSelectElement>(env, 'clN')?.value ?? 10), mode = (byId<HTMLSelectElement>(env, 'clMode')?.value ?? 'all') as 'all' | 'lazy';
    const r = ctxLoad(n, mode, called);
    const b = byId(env, 'clBar'), lg = byId(env, 'clLeg'), s = byId(env, 'clStat'); if (!b || !lg || !s) return;
    const segs: [string, number, string][] = [['sys', r.sys, L.sys], ['tools', r.tools, L.tools], ['loaded', r.loaded, L.loaded], ['chat', r.chat, L.chat], ['free', r.free, L.free]];
    bar(b, segs, CTX.window);
    lg.innerHTML = segs.filter((x) => x[1] > 0).map(([c, v, l]) => `<span><i class="${c}"></i>${l} ${fmt(env, v)}</span>`).join('');
    s.dataset.pct = String(r.pct);
    s.innerHTML = t(`上下文窗口 ${fmt(env, CTX.window)} 词元（示意）；扩展说明占 <b>${fmt(env, r.manual)}</b>，即 <b>${r.pct}%</b>。`, `Context window ${fmt(env, CTX.window)} tokens (illustrative); the manuals take <b>${fmt(env, r.manual)}</b>, i.e. <b>${r.pct}%</b>.`)
      + (r.warn ? `<br><span class="u-warn-t">⚠️ ${t('说明书占了四分之一以上：留给对话和资料的地方变少，相似的工具也更容易选错。', 'Manuals take over a quarter: less room for the conversation and material, and similar tools get mixed up more often.')}</span>` : '');
    s.classList.toggle('warn', r.warn);
  };
  const call = () => {
    const mode = byId<HTMLSelectElement>(env, 'clMode')?.value ?? 'all', out = byId(env, 'clOut');
    called = true;
    if (out) {
      out.hidden = false;
      out.textContent = (mode === 'lazy' ? t('// 用到了才读入这个扩展的完整说明（+400 词元，示意）\n', '// only now is this extension’s full manual read in (+400 tokens, illustrative)\n') : t('// 完整说明早就在上下文里了\n', '// the full manual was already in the context\n'))
        + '{ "name": "search_docs", "arguments": { "query": "refund policy" } }';
    }
    render();
  };
  const lab = () => {
    const on = (id: string, ev: string, f: () => void) => byId(env, id)?.addEventListener(ev, f);
    on('clN', 'change', () => { called = false; const o = byId(env, 'clOut'); if (o) o.hidden = true; render(); });
    on('clMode', 'change', () => { called = false; const o = byId(env, 'clOut'); if (o) o.hidden = true; render(); });
    on('clCall', 'click', call);
    on('clReset', 'click', () => {
      const n = byId<HTMLSelectElement>(env, 'clN'), m = byId<HTMLSelectElement>(env, 'clMode'), o = byId(env, 'clOut');
      if (n) n.value = '10'; if (m) m.value = 'all'; if (o) o.hidden = true; called = false; render();
    });
    render();
  };
  return { labs: [lab], eager: () => {} };
}
