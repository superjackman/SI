/* R15 plain-language layer for Up (real products grouped by way of use). No KaTeX here. */
import type { PStation } from './types';

const Up: PStation = {
  cards: {
    c_Up_0: {
      zh: `<p>这一站像一本<b>按用途分好类的产品目录</b>：每个产品都配着官网链接和一句话介绍，都对照官网核对过。价格和版本变得太快，所以不写。列在这里不等于推荐，先想好用法再挑。</p>`,
      en: `<p>This stop is like a <b>product catalogue sorted by use</b>: each product has its official website and a one-line description, all checked against the official site. Prices and versions change too fast, so they are left out. Being listed is not a recommendation; decide how you will use it first, then choose.</p>`,
    },
    c_Up_list: {
      keep: true,
      zh: `<p>用上面的按钮按用法筛选，也可以只看国内运营的或开源的。</p>`,
      en: `<p>Use the buttons above to filter by way of use, or show only products run in China or open-source ones.</p>`,
    },
    c_Up_cn: {
      zh: `<p>在中国大陆用要知道两件事：<b>不少境外产品可能用不了</b>，或者注册、付钱受限制；还有，<b>扮演“人”、陪人聊感情</b>的 AI 服务有专门的管理规定。以官网说明和当地法规为准。</p>`,
      en: `<p>Two things to know when using these in mainland China: <b>many overseas products may not be available</b>, or sign-up and payment may be restricted; and AI services that <b>play a “person” and offer emotional companionship</b> have their own specific rules. Check the official sites and local regulations.</p>`,
    },
  },
};
export default Up;
