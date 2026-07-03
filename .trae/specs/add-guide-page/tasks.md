# Tasks

- [x] Task 1: 在 `globals.css` 新增指南页浅色品牌色作用域样式
  - [x] SubTask 1.1: 新增 `.guide-page { --bm-color-* ...; --bm-radius-* ...; }` 作用域变量块（浅色 teal 品牌色，覆盖 `:root` 与 `.dark`），确保指南页内 `var(--bm-color-*)` 始终为浅色值
  - [x] SubTask 1.2: 新增 `.bm-mint-glow` 装饰背景类（双 radial-gradient，复用设计稿实现），并补齐指南页用到的 `bm-card` 等在浅色作用域下的样式（如已存在则确保不被 `.dark` 覆盖）

- [x] Task 2: 新增 MCP 配置复制交互客户端组件
  - [x] SubTask 2.1: 新增 `src/components/guide/copy-config-button.tsx`（`"use client"`），实现点击复制目标 `<code>` 文本，文案「复制」→「已复制」、图标 `Copy`→`Check`，1.8s 后恢复
  - [x] SubTask 2.2: 兼容 `navigator.clipboard` 不可用时的 `textarea` 回退方案；通过 `data-copy-target` 与目标 `<code id="mcp-config-code">` 关联

- [x] Task 3: 新增公开路由 `/guide` 页面，1:1 还原设计稿结构
  - [x] SubTask 3.1: 新增 `src/app/(public)/guide/page.tsx`（Server Component，`dynamic = "force-dynamic"`），外层包裹 `<div className="guide-page ...">`，复用全局 `AppHeader`（根 layout 已渲染，页面内不再重复 header）
  - [x] SubTask 3.2: 实现 Hero 区（左列标题/副标题/锚点按钮/信任徽章；右列 `bm-mint-glow` 卡片含两张特性卡与三格统计），品牌名替换为 `Bookmark Lite`
  - [x] SubTask 3.3: 实现「快速开始」双卡片（`id="extension"` 浏览器插件四步、`id="mcp"` MCP 连接四步），每步含序号圆点 + 标题 + 说明
  - [x] SubTask 3.4: 实现「安装浏览器插件」区（左卡下载按钮指向 `/downloads/bookmark-lite-extension.zip` + 两条提示；右卡「各浏览器安装方式」三步 + 风险确认提示）
  - [x] SubTask 3.5: 实现「MCP 配置」区（左卡三条信任说明；右卡「仅作展示」徽章 + `CopyConfigButton` + `<pre><code id="mcp-config-code">` 配置示例 + 令牌安全提示），配置示例使用真实的 `npx -y bookmark-lite-mcp` + `LINKFLOW_TOKEN`
  - [x] SubTask 3.6: 实现「常见问题」三组 Q/A 与「准备就绪」CTA（「开始使用」指向 `/login`）+ 页脚版权 `© 2026 Bookmark Lite · 保留所有权利`
  - [x] SubTask 3.7: 全部图标改用 `lucide-react` 组件（MousePointerClick / Workflow / PanelTop / PlugZap / Download / Settings2 / ShieldCheck / RotateCcw / LockKeyhole / Copy / Check）

- [x] Task 4: 在全局 AppHeader 新增「使用指南」入口按钮
  - [x] SubTask 4.1: 修改 `src/components/layout/header-actions.tsx`，对所有访客（含未登录与登录用户）展示一个指向 `/guide` 的「使用指南」链接，样式与现有头部按钮协调
  - [x] SubTask 4.2: 确认登录态用户（`UserMenu` 分支）与未登录访客分支均可见该入口

- [x] Task 5: 验证与收尾
  - [x] SubTask 5.1: 运行 `pnpm lint` 与 `pnpm exec tsc --noEmit`，修复报错
  - [x] SubTask 5.2: 本地 `pnpm dev` 访问 `/guide`，核对未登录可访问、视觉与设计稿 1:1、复制按钮交互正常、下载链接可达、AppHeader 入口按钮可见且可跳转

- [x] Task 6: 清理与提交
  - [x] SubTask 6.1: 功能验证通过后删除设计稿源目录 `bookmark-auth/`（含 pages/、partials/、logo_assets/、*.css、*.js、*.design、*.json）
  - [x] SubTask 6.2: 提交全部变更并推送至远端，commit 信息遵循 Angular 规范（scope 用英文，如 `feat(guide): add public guide page`）

# Task Dependencies
- Task 1 与 Task 2 相互独立，可并行
- Task 3 依赖 Task 1（作用域样式）与 Task 2（复制组件）
- Task 4 独立，可与 Task 3 并行
- Task 5 依赖 Task 3 与 Task 4
- Task 6 依赖 Task 5（验证通过后方可删除源目录与提交）
