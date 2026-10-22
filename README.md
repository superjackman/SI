# SI

AI 学习地图 · AI Learning Map — <https://superjackman.github.io/SI/>

| 路径 Path | 内容 Content |
|---|---|
| `index.html` | 现行单文件版（生产）· current single-file page (production) |
| `next/` | React 新版构建产物（迁移中预览，<https://superjackman.github.io/SI/next/>）· React rewrite build output (migration preview) |
| `web/` | React 新版源码 · React source (Vite 5 + React 18 + TypeScript strict + Zustand) |
| `.nojekyll` | 让 Pages 原样发布所有文件 · tells Pages to serve files as-is (no Jekyll) |

## 开发与发布 · Develop & publish

GitHub Pages 设置保持不变（从 main 分支根目录发布），**不用 GitHub Actions**：在本地构建、测试，把产物复制进仓库，再提交推送。
Pages settings stay unchanged (deploy from branch main, root); **no GitHub Actions**: build and test locally, copy the output into the repo, commit, push.

```bash
cd web
npm ci                 # 首次 · first time (Node ≥ 18.18; tests use your installed Google Chrome)
npm run dev            # 本地开发 · dev server  http://localhost:5173/SI/next/
npm test               # 类型检查 + 单元测试 + 构建 + 手机端冒烟测试(360/390/430) + 体积检查
npm run deploy         # 构建→测试→清掉 next/ 里上一版的文件→复制新产物到 ../next/→确保 ../.nojekyll
cd .. && git status    # 检查变更（脚本从不 commit / push）· review; the script never commits or pushes
git add -A && git commit -m "next: …" && git push
```

- **base 路径**：迁移期 `/SI/next/`，切换后 `/SI/`，统一定义在 `web/base.config.mjs`（也可用环境变量 `SI_BASE` 覆盖）。
  Base path is `/SI/next/` during the migration and `/SI/` after cutover, defined once in `web/base.config.mjs` (override with `SI_BASE`).
- **任何一步失败都不会复制文件**。没有 Chrome 时可设 `CHROME_PATH=…`，或 `npx playwright install chromium` 后加 `PW_BUNDLED=1`。
  Nothing is copied if any step fails. Without Chrome set `CHROME_PATH`, or install Playwright's Chromium and set `PW_BUNDLED=1`.
- **切换（R5）**：`npm run deploy:cutover` 以 base `/SI/` 构建到仓库根目录，旧 `index.html` 自动改名为 `legacy.html` 保留。
  Cutover (R5): `npm run deploy:cutover` builds with base `/SI/` into the repo root and renames the old `index.html` to `legacy.html`.
- **统计**：GoatCounter 像素只在 `/SI/` 正式版计数，`/SI/next/`、localhost 不计数；统计在页面 load 之后单独加载，永远不阻塞内容。
  Analytics (GoatCounter pixel) counts only on the production `/SI/`; never on `/SI/next/` or localhost, and loads after `load`, never blocking content.
- **规则**：只做手机版布局；按钮用图标；多处复用的文案写成 code 放在 `web/src/i18n/codes.ts`（中英对照），只用一次的文案就地写中英两份；不引用任何外部 CDN 或字体（照顾国内访问速度）。
  Rules: phone-only layout; icon buttons; shared text as codes in `web/src/i18n/codes.ts` (zh/en), one-off text inline in both languages; no external CDNs or fonts.
