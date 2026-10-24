/* R22 bottom bar: its own words (lazy chunk). Plain words a primary-school pupil can read; {x} filled by fill(). */
import type { Bi } from '../../i18n/types';

export const D = {
  noLab: { zh: '这一站没有动手实验。点「下一站」去找好玩的吧！', en: 'This stop has no hands-on lab. Tap “Next” to find one!' },
  noQuiz: { zh: '这一站没有小测验。', en: 'This stop has no quiz.' },
  tocH: { zh: '📑 这一页有什么', en: '📑 On this page' },
  tocTip: { zh: '点一项就跳过去。', en: 'Tap one to jump there.' },
  here: { zh: '你在这里', en: 'You are here' },
  plain: { zh: '🧒 先用大白话说', en: '🧒 In plain words' },
  stage: { zh: '🗺️ 结构图', en: '🗺️ Diagram' },
  hand: { zh: '🧭 接下来去哪', en: '🧭 Where next' },
  labH: { zh: '🧪 这一页的实验', en: '🧪 Labs on this page' },
  labTip: { zh: '选一个开始玩：', en: 'Pick one to play:' },
  rLab: { zh: '🧒 路线推荐', en: '🧒 Route pick' },
  progH: { zh: '✨ 我的进度', en: '✨ My progress' },
  lit: { zh: '已点亮 {x} / {t} 站', en: '{x} of {t} stops lit' },
  how: { zh: '每站做完小测、答对一多半，这一站就点亮了。', en: 'Finish a stop’s quiz and get most answers right to light it up.' },
  rH: { zh: '🧒 小学生路线：点亮了 {k}/6 站', en: '🧒 Kids’ route: {k}/6 stops lit' },
  certGo: { zh: '🎓 领取我的奖状', en: '🎓 Get my certificate' },
  certLeft: { zh: '再点亮 {n} 站，就能领奖状。', en: 'Light {n} more to get the certificate.' },
  lastH: { zh: '🎉 已经是最后一站了', en: '🎉 This is the last stop' },
  lastT: { zh: '后面没有新的站了。可以回到第一站从头看，也可以看看自己点亮了几站。', en: 'There are no more stops after this one. Go back to the first stop, or see how many stops you have lit.' },
  toFirst: { zh: '🏠 回到第一站', en: '🏠 Back to the first stop' },
  seeProg: { zh: '✨ 看我的进度', en: '✨ See my progress' },
  rEndH: { zh: '🧒 路线的最后一站', en: '🧒 Last stop on the route' },
  moreH: { zh: '🗺️ 地图和图标', en: '🗺️ Map & icons' },
  quizLit: { zh: '已点亮', en: 'lit' },
} satisfies Record<string, Bi>;
