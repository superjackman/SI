/* Api lab (R31): lab3dApi — the ordering window in 3D. One button 「发送请求」: each press is one sample request
   (w3d2.apiOne, real deepseek-flash prices from calc.ts); the 3D view plays it once, the 2D figure just counts. */
import type { Env } from '../../legacy/runtime';
import { byId, tr } from '../kit';
import { mount3d } from '../s3d';
import { API_DUR, API_IN, API_OUT, API_P, API_SEND, apiOne, apiSay, apiTotal, yuan } from '../w3d2';
import type { ApiApi } from '../../three3d/api';

export const LABS = [{ ids: ['lab3dApi', 'apBox', 'apSay', 'apGo', 'apOut'], hooks: [] as string[] }];

export function mount(env: Env) {
  const t = tr(env);
  const go = () => {
    const box = byId(env, 'apBox'), say = byId(env, 'apSay'), btn = byId<HTMLButtonElement>(env, 'apGo'), out = byId(env, 'apOut'), svg = box?.querySelector('svg');
    if (!box || !say || !btn || !svg) return;
    const L = env.lang === 'en' ? 'en' : 'zh';
    let n = 0;
    function draw2d() {
      const coins = Array.from({ length: Math.min(n, 10) }, (_, i) => `<ellipse cx="150" cy="${222 - i * 7}" rx="20" ry="7" fill="#f5b83d" stroke="#d48806" stroke-width="1"/>`).join('');
      svg!.innerHTML = `<rect x="18" y="168" width="118" height="22" rx="8" fill="#ecd0a6"/><rect x="30" y="98" width="94" height="62" rx="6" fill="#2b2d52"/><rect x="22" y="158" width="110" height="10" rx="4" fill="#d8dae6"/>`
        + `<text x="77" y="118" text-anchor="middle" style="fill:#fff">${t('你的程序', 'Your program')}</text><rect x="44" y="126" width="66" height="26" rx="5" fill="#fff"/><text x="77" y="144" text-anchor="middle" style="font-size:14px">${t('菜单', 'Menu')}</text>`
        + `<path d="M126 118 C170 86 190 86 214 96" fill="none" stroke="#c4b5fd" stroke-width="12" stroke-linecap="round" opacity=".6"/><path d="M126 118 C170 86 190 86 214 96" fill="none" stroke="#8b5cf6" stroke-width="5" stroke-linecap="round"/>`
        + `<circle cx="150" cy="100" r="7" fill="none" stroke="#f5b83d" stroke-width="4"/>`
        + `<ellipse cx="258" cy="34" rx="40" ry="16" fill="#fff"/><rect x="208" y="52" width="100" height="78" rx="10" fill="#f3f0fd" stroke="#ddd5fb"/><rect x="224" y="58" width="68" height="22" rx="6" fill="#2e2a6b"/><text x="258" y="74" text-anchor="middle" style="fill:#fff;font-weight:700">${t('模型', 'Model')}</text><rect x="222" y="88" width="72" height="34" rx="5" fill="#6b5aa6"/>`
        + `<ellipse cx="150" cy="226" rx="34" ry="10" fill="#e6defc"/>${coins}<rect x="104" y="${n ? 180 - Math.min(n, 10) * 7 : 190}" width="92" height="24" rx="12" fill="#fff"/><text x="150" y="${n ? 197 - Math.min(n, 10) * 7 : 207}" text-anchor="middle" style="fill:#4338ca;font-weight:700">${t('账单', 'Bill')} ${yuan(apiTotal(n))}</text>`
        + `<ellipse cx="256" cy="246" rx="56" ry="20" fill="#ddd5fb"/><rect x="214" y="226" width="84" height="18" rx="6" fill="#3b3a5c"/>`
        + (n ? `<rect x="222" y="196" width="70" height="34" rx="6" fill="#fff" stroke="#ddd6fe"/><text x="257" y="218" text-anchor="middle" style="font-size:14px;font-weight:700">${t('答案', 'Answer')} ✓</text>` : '');
    }
    let t0 = -1; // start of the request now on its way (ms), -1 when none
    const now = () => env.window.performance.now();
    const prog = () => (t0 < 0 ? 1 : Math.min(0.999, (now() - t0) / (API_DUR * 1000)));
    function text(phase?: 'send' | 'think') {
      say!.innerHTML = apiSay(n, L, phase);
      if (out) out.innerHTML = `<p>${t(`每次：输入 ${API_IN} 词元 × ${API_P.inP} 元/百万 + 输出 ${API_OUT} 词元 × ${API_P.outP} 元/百万 = <b>${yuan(apiOne())} 元</b>。已发 <b data-k="n">${n}</b> 次，共 <b data-k="sum">${yuan(apiTotal(n))} 元</b>。`, `Each: ${API_IN} tokens in × ${API_P.inP} yuan/M + ${API_OUT} tokens out × ${API_P.outP} yuan/M = <b>${yuan(apiOne())} yuan</b>. Sent <b data-k="n">${n}</b>, total <b data-k="sum">${yuan(apiTotal(n))} yuan</b>.`)}</p>`;
    }
    let h3: ReturnType<typeof mount3d> | null = null;
    /* without the 3D view (no WebGL, reduced motion, still loading) the request lands at once; with it, the sentence, the bill
       and the coin follow the animation: 「请求发出…」 while the card flies, 「模型在想…」 at the model, the total once the answer is on the tray.
       The button is off meanwhile so one tap is one request. */
    const land = () => { t0 = -1; n++; btn.disabled = false; btn.removeAttribute('aria-busy'); draw2d(); text(); h3?.refresh(); };
    const send = () => {
      if (t0 >= 0) return;
      if (!h3?.on()) { land(); return; }
      t0 = now(); btn.disabled = true; btn.setAttribute('aria-busy', 'true'); text('send'); h3.refresh();
      env.setTimeout(() => { if (t0 >= 0) text('think'); }, API_SEND * API_DUR * 1000);
      env.setTimeout(land, API_DUR * 1000 + 30);
    };
    btn.addEventListener('click', send);
    draw2d(); text();
    const api: ApiApi = { lang: L, raf: env.requestAnimationFrame, caf: env.cancelAnimationFrame, n: () => n, p: prog };
    h3 = mount3d(env, box, () => import('../../three3d/api'), api);
    (box as HTMLElement & { __lab?: unknown }).__lab = { send, n: () => n, total: () => apiTotal(n) };
  };
  return { labs: [go], eager: () => {} };
}
