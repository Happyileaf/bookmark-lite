# Checklist

## 路由与可见性
- [ ] `/guide` 为公开页面，未登录用户访问不重定向到登录页
- [ ] 已登录用户访问 `/guide` 仍正常渲染，全局 AppHeader 显示其登录态
- [ ] 页面位于 `src/app/(public)/guide/page.tsx`，复用 `(public)` 路由组与根 layout（含全局 AppHeader）

## 视觉还原（1:1）
- [ ] 页面外层包裹 `.guide-page`，内含品牌色为浅色 teal（`#0d9488`），不受全局 `.dark` 影响
- [ ] Hero 区结构、间距、字号、锚点按钮、三个信任徽章与设计稿一致
- [ ] Hero 右列 `bm-mint-glow` 背景卡片 + 两张特性卡（快速收藏 / 连接工具）+ 三格统计（1 点 / 4 步 / 2 类）齐全
- [ ] 「快速开始」双卡片（`id="extension"` / `id="mcp"`）各含四步序号说明
- [ ] 「安装浏览器插件」区左卡下载按钮 + 两条提示，右卡三步安装方式 + 风险确认提示齐全
- [ ] 「MCP 配置」区左卡三条信任说明，右卡「仅作展示」徽章 + 复制按钮 + 代码块 + 令牌安全提示齐全
- [ ] 「常见问题」三组 Q/A 与设计稿一致
- [ ] 「准备就绪」CTA 横幅 + 「开始使用」按钮 + 页脚版权齐全

## 品牌与文案
- [ ] 全部「LinkFlow」品牌名替换为「Bookmark Lite」
- [ ] 页脚版权为 `© 2026 Bookmark Lite · 保留所有权利`
- [ ] 「开始使用」按钮（CTA 区块）指向 `/login`
- [ ] Logo 使用 `/logo_assets/logo_export.png`
- [ ] 全部图标使用 `lucide-react`，无 `data-lucide` 残留

## 内容准确性
- [ ] MCP 配置示例为真实可用形式：`npx -y bookmark-lite-mcp` + `env.LINKFLOW_TOKEN`，无 `scopes` 字段
- [ ] 浏览器插件下载按钮指向 `/downloads/bookmark-lite-extension.zip`
- [ ] 令牌安全提示文案与设计稿一致

## 复制交互
- [ ] 点击「复制」按钮可将 MCP 配置示例文本写入剪贴板
- [ ] 复制后按钮文案切换为「已复制」、图标切换为 `Check`，约 1.8s 后恢复
- [ ] `navigator.clipboard` 不可用时回退到 `textarea` 方案仍可复制

## AppHeader 入口
- [ ] 全局 AppHeader 新增「使用指南」入口，指向 `/guide`
- [ ] 入口对未登录访客与登录用户均可见
- [ ] 入口样式与现有头部按钮协调，点击可跳转 `/guide`

## 主题与样式边界
- [ ] 指南页始终为浅色品牌色，不渲染明/暗切换、不引入 10 主题切换器（`theme-switcher.js` / `themes.css`）
- [ ] 指南页样式作用域为 `.guide-page`，不影响其它页面的既有 `bm-*` 样式
- [ ] 页面内不重复渲染设计稿自带 header（复用全局 AppHeader）

## 验证
- [ ] `pnpm lint` 通过
- [ ] `pnpm exec tsc --noEmit` 通过
- [ ] 本地 `pnpm dev` 访问 `/guide` 视觉与设计稿 1:1，复制按钮、下载链接、AppHeader 入口功能正常

## 清理与提交
- [ ] 功能验证通过后已删除 `bookmark-auth/` 目录
- [ ] 全部变更已提交，commit 信息符合 Angular 规范（scope 用英文）
- [ ] 代码已推送至远端
