# SI

AI 学习地图 · AI Learning Map — <https://superjackman.github.io/SI/>

| 路径 Path | 内容 Content |
|---|---|
| `index.html`, `assets/` | 系统探索器（生产构建）· the system explorer (production build) |
| `next/` | 旧预览地址，跳转到 `/SI/` · old preview address, redirects to `/SI/` |
| `web/` | 源码 · source (Vite 5 + TypeScript strict + three.js + Zustand) |
| `.nojekyll` | 让 Pages 原样发布所有文件 · tells Pages to serve files as-is (no Jekyll) |

## 开发与发布 · Develop & publish

GitHub Pages 设置保持不变（从 main 分支根目录发布），**不用 GitHub Actions**：在本地构建、测试，把产物复制进仓库，再提交推送。
Pages settings stay unchanged (deploy from branch main, root); **no GitHub Actions**: build and test locally, copy the output into the repo, commit, push.

```bash
cd web
npm ci                 # 首次 · first time (Node ≥ 18.18; tests use your installed Google Chrome)
npm run dev            # 本地开发 · dev server  http://localhost:5173/SI/next/
npm test               # 类型检查 + 单元测试 + 构建 + 手机端冒烟测试(360/390/430) + 体积检查
npm run deploy         # 切换后：构建(base /SI/)→测试→清掉更早一版的文件→复制到仓库根目录→next/ 保持为跳转页→确保 ../.nojekyll
cd .. && git status    # 检查变更（脚本从不 commit / push）· review; the script never commits or pushes
git add -A && git commit -m "site: …" && git push
```

- **base 路径**：迁移期 `/SI/next/`，切换后 `/SI/`，统一定义在 `web/base.config.mjs`（也可用环境变量 `SI_BASE` 覆盖）。
  Base path is `/SI/next/` during the migration and `/SI/` after cutover, defined once in `web/base.config.mjs` (override with `SI_BASE`).
- **任何一步失败都不会复制文件**。没有 Chrome 时可设 `CHROME_PATH=…`，或 `npx playwright install chromium` 后加 `PW_BUNDLED=1`。
  Nothing is copied if any step fails. Without Chrome set `CHROME_PATH`, or install Playwright's Chromium and set `PW_BUNDLED=1`.
  切换后 `npm run deploy` 默认部署到根目录（/SI/），`next/` 只是跳转到 `/SI/` 的小页面（保留 ?query 和 #hash），不再接受 `--target next`。
  After the cutover `npm run deploy` deploys the root (/SI/); `next/` is only a redirect to `/SI/` (query + hash kept) and `--target next` is refused.
- **统计**：GoatCounter 像素只在 `/SI/` 正式版计数，`/SI/next/`、localhost 不计数；统计在页面 load 之后单独加载，永远不阻塞内容。
  页面路径与旧版相同（`/zh/home`、`/en/T3`…）；事件也沿用旧版：每个实验第一次被操作计 `evt-lab-<实验id>`，每个测验第一次作答计 `evt-quiz-<站>`（每次打开页面各计一次）。
  Analytics (GoatCounter pixel) counts only on the production `/SI/`; never on `/SI/next/` or localhost, and loads after `load`, never blocking content.
  Page paths match the old page (`/zh/home`, `/en/T3` …), and so do events: `evt-lab-<lab id>` on the first use of each lab, `evt-quiz-<stop>` on the first answer in each quiz (once per page load).
- **规则**：只做手机版布局；按钮用图标；多处复用的文案写成 code 放在 `web/src/i18n/codes.ts`（中英对照），只用一次的文案就地写中英两份；不引用任何外部 CDN 或字体（照顾国内访问速度）。
  Rules: phone-only layout; icon buttons; shared text as codes in `web/src/i18n/codes.ts` (zh/en), one-off text inline in both languages; no external CDNs or fonts.

## 每周更新资讯和工具 · Weekly news and tools

门户上的「查资讯」「找工具」是两份静态 JSON，没有服务器。过期的资讯会伤信誉，所以按周改文件再发布。

The News and Tools panes are two static JSON files. There is no server. Stale news hurts trust, so edit the files on a weekly cadence and deploy.

1. 资讯：编辑 `web/src/hub/news.json` 的 `weeks`。新的一周追加一个 `{ week, items }`，不要删掉以前的周。每条必须有真实来源 URL、发布日期 `date`（YYYY-MM-DD）和核对日 `checked`。只写你打开来源页核对过的事实。写不出处、写排行、或编造人数，都不要加。对不上本站任何一站的条目也不要加。`st` 里的站键必须是 23 站之一。`more` 用 3 到 4 句写它和第几站的哪一个小目标有关。
   News: edit `weeks` in `web/src/hub/news.json`. Append a `{ week, items }` for a new week and leave older weeks in the file. Every item needs a real source URL, a publication `date` (`YYYY-MM-DD`) and the file’s `checked` date. Write only facts you confirmed by opening the source. Do not add an item without a source, a ranking, or an invented user count. Skip items that do not map back to a station. Every key in `st` must be one of the 23 stops. `more` is 3–4 sentences tying the item to one stop’s small goal.
2. 工具：编辑 `web/src/hub/tools.json`。只放真实产品。免费额度和「中国大陆能不能打开官网」按核对日填写，拿不准就写成「以官网当天为准」，不要猜。`st` 链回原理所在的站，`safe` 固定为 `S`。
   Tools: edit `web/src/hub/tools.json`. Real products only. Free-tier notes and whether the official site opens in mainland China are as of `checked`. If you are not sure, say the site’s own page is the authority. Do not guess. `st` links the principle back to stops. `safe` stays `S`.
3. 发布：在 `web/` 里跑 `npm test`，通过后 `npm run deploy`，再提交并推到 `main`。GitHub Pages 从仓库根目录提供 `/SI/`。
   Ship: from `web/`, run `npm test`, then `npm run deploy`, then commit and push to `main`. GitHub Pages serves `/SI/` from the repo root.

## 搜索引擎 · Search engines (R25)

每次构建都会自动生成：推导之路每站一张静态页（`s/<站键>/`、`en/s/<站键>/`，共 23 站）、两张目录页（`s/`、`en/s/`）、`sitemap.xml`（含知识卡 `c/<id>.html`）、`robots.txt`、`404.html`（生成器：`web/scripts/seo.mjs`，R52 恢复）。

站点验证（站长自己做，仓库里不放任何假的验证码）：

1. **Google Search Console**：添加“网址前缀”资源 `https://superjackman.github.io/SI/`，选“HTML 文件”验证 → 把下载的 `googleXXXX.html` 原样放进 `web/public/`（构建后会出现在 `/SI/googleXXXX.html`），或选“HTML 标记”，把那一行 `<meta name="google-site-verification" content="…">` 加进 `web/index.html` 的 `<head>`。
2. **Bing Webmaster Tools**：可以直接“从 Google Search Console 导入”；或把 `BingSiteAuth.xml` 放进 `web/public/`，或加 `<meta name="msvalidate.01" content="…">`。
3. **百度搜索资源平台**：百度按“域名”验证（文件要放在域名根目录，HTML 标签要放在域名首页），子目录 `/SI/` 不能单独当站点验证。`https://superjackman.github.io/` 的根属于另一个仓库 `superjackman/superjackman.github.io`（现在不存在，根地址返回 404）：要验证，就建这个仓库，在它的 `index.html` 里放 `<meta name="baidu-site-verification" content="…">`（或把 `baidu_verify_XXXX.html` 放进去），验证主站后再添加 `/SI/` 子站；或者给本站绑一个自己的域名。另外，GitHub Pages 过去曾对百度爬虫返回 403，验证后请用百度的“抓取诊断”确认能抓到。

放好后 `npm run deploy`、提交、推送，再回各平台点“验证”，然后提交站点地图 `https://superjackman.github.io/SI/sitemap.xml`。

注意：`/SI/robots.txt` 不会被爬虫读取（只认域名根 `https://superjackman.github.io/robots.txt`，那属于 `superjackman.github.io` 仓库）；所以站点地图要在各平台手动提交。
