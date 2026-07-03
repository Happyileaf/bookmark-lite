# 使用指南页 Spec

## Why
产品已具备浏览器插件收藏与 MCP 能力开放，但缺少一个向用户说明「如何把收藏接入工作流」的公开使用指南页。需依据设计稿 `bookmark-auth/pages/guide.html` 1:1 还原该页面，让访客（含未登录用户）能快速了解浏览器插件与 MCP 两种接入路径、安装方式、MCP 配置示例与常见问题。

## What Changes
- 新增公开路由 `/guide`（对应 `src/app/(public)/guide/page.tsx`），无需登录即可访问。
- 依据设计稿 1:1 还原页面结构与视觉：Hero、快速开始（浏览器插件 + MCP 双卡片）、安装浏览器插件、MCP 配置（含配置示例与复制按钮）、常见问题、准备就绪 CTA、页脚版权。
- 在 `src/app/globals.css` 中新增 `.guide-page` 作用域的品牌 CSS 变量（`--bm-color-*`、`--bm-radius-*`，仅浅色）与 `.bm-mint-glow` 装饰背景，使指南页始终以浅色品牌色呈现，与设计稿一致。
- 新增客户端组件 `src/components/guide/copy-config-button.tsx`，实现 MCP 配置示例的「复制」交互（点击后文案切换为「已复制」并自动恢复）。
- 复用全局 `AppHeader`（根 layout 已渲染），不在指南页内重复渲染设计稿自带的顶部 header；同时在 `AppHeader` 中新增一个「使用指南」入口按钮，指向 `/guide`。
- 品牌名统一为「Bookmark Lite」（设计稿中的「LinkFlow」全部替换）；Logo 复用 `/logo_assets/logo_export.png`。
- MCP 配置示例对齐真实接入方式（`npx -y bookmark-lite-mcp` + `LINKFLOW_TOKEN` 环境变量，无 `scopes` 字段）。
- 浏览器插件下载按钮指向 `/downloads/bookmark-lite-extension.zip`。
- 图标使用已安装的 `lucide-react`（对应设计稿中 `data-lucide` 图标）。
- **功能验证通过后**删除设计稿源目录 `bookmark-auth/`（其内容已迁移至 Next.js 应用内）。
- **功能验证通过后**提交并推送代码，commit 信息遵循 Angular 规范（scope 用英文）。

### 不在本次范围内（依据用户决策）
- **不**实现明/暗模式适配（指南页始终浅色品牌色）。
- **不**引入设计稿的 10 套主题色浮动切换器（`theme-switcher.js` / `themes.css`）。
- **不**渲染设计稿自带的页面级 header（复用全局 `AppHeader`）。

## Impact
- 影响能力：新增一个公开（未登录可访问）的内容型页面。
- 影响代码：
  - 新增 `src/app/(public)/guide/page.tsx`（Server Component，公开路由，复用 `(public)` 路由组，无独立 layout，继承根 layout 的 `AppHeader`）。
  - 新增 `src/components/guide/copy-config-button.tsx`（Client Component，仅含复制交互）。
  - 修改 `src/app/globals.css`：新增 `.guide-page` 作用域变量与 `.bm-mint-glow` 装饰类（浅色品牌色，不影响其它页面）。
  - 修改 `src/components/layout/app-header.tsx` 与 `src/components/layout/header-actions.tsx`：在全局头部新增「使用指南」入口按钮，指向 `/guide`，对所有访客（含未登录）可见。
- 复用资源：`/logo_assets/logo_export.png`、`/downloads/bookmark-lite-extension.zip`、`lucide-react` 图标库、`bm-card` 等已存在的全局基础类（在指南页内通过 `.guide-page` 变量覆盖为浅色品牌色）。
- 不影响现有鉴权与数据流；不新增 API。

## 设计决策

### 品牌与文案
- 品牌名：`Bookmark Lite`（替换设计稿全部 `LinkFlow`）。
- Hero 主标题保持「接入工作流」；副标题、各区块文案保持设计稿原样，仅替换品牌名。
- 页脚版权：`© 2026 Bookmark Lite · 保留所有权利`。
- 「开始使用」按钮（Header 内的次要 CTA 已由全局 AppHeader 承载；Hero 内无该按钮；CTA 区块的「开始使用」）统一指向 `/login`。

### 主题与配色
- 指南页**仅浅色品牌色**：主色 `#0d9488`（teal-600），背景 `#ffffff` / `#f8fafb`，文本 `#0f1f1c` / `#4b5c58` / `#7a8a86`，边框 `#e2eef0`。
- 通过在 `globals.css` 新增 `.guide-page { --bm-color-*: ...; }` 作用域变量，使页面内 `var(--bm-color-*)` 始终为浅色值，不受全局 `.dark` 影响，保证 1:1 还原设计稿的浅色视觉。
- 不写入任何 `dark:` 变体；不引入 `themes.css` / `theme-switcher.js`。

### 页面结构（自上而下，复用全局 AppHeader 之后）
1. **Hero**：左列主标题「接入工作流」+ 副标题 + 两个锚点按钮（`#extension` / `#mcp`）+ 三个信任徽章（本地授权 / 随时撤销 / 数据归你）；右列 `bm-mint-glow` 背景卡片，内含两张特性卡（快速收藏 / 连接工具）与三格统计（1 点 / 4 步 / 2 类）。
2. **快速开始**：标题 + 副标题；双卡片（`id="extension"` 浏览器插件四步、`id="mcp"` MCP 连接四步），每步含序号圆点 + 标题 + 说明。
3. **安装浏览器插件**：左卡片含下载按钮（`/downloads/bookmark-lite-extension.zip`）+ 两条提示；右卡片「各浏览器安装方式」三步（Chrome/Edge、Firefox、登录授权）+ 风险确认提示。
4. **MCP 配置**：左卡片三条信任说明；右卡片「配置示例」含「仅作展示」徽章 + 复制按钮 + `<pre><code>` 代码块 + 令牌安全提示。
5. **常见问题**：三组 Q&A（插件无反应 / 标签不准 / MCP 连接失败）。
6. **准备就绪 CTA**：`bm-color-primary-softer` 背景横幅 + 「开始使用」按钮（`/login`）。
7. **页脚**：版权一行。

### MCP 配置示例（对齐真实接入）
```
{
  "mcpServers": {
    "bookmark-lite": {
      "command": "npx",
      "args": ["-y", "bookmark-lite-mcp"],
      "env": {
        "LINKFLOW_TOKEN": "linkflow_xxxxxxxx"
      }
    }
  }
}
```
- 复制按钮复制上述代码块文本；点击后按钮文案「复制」→「已复制」，1.8s 后恢复，图标在 `copy` / `check` 间切换。
- 令牌安全提示：「真实令牌只在登录后的账号设置中生成，请勿在公开页面分享。」

### 图标映射（lucide-react）
| 设计稿 data-lucide | lucide-react 组件 | 用途 |
|---|---|---|
| `mouse-pointer-click` | `MousePointerClick` | 快速收藏特性卡 / 安装提示 |
| `workflow` | `Workflow` | 连接工具特性卡 |
| `panel-top` | `PanelTop` | 浏览器插件卡片图标 |
| `plug-zap` | `PlugZap` | MCP 连接卡片图标 |
| `download` | `Download` | 下载插件按钮 |
| `settings-2` | `Settings2` | 插件设置提示 |
| `shield-check` | `ShieldCheck` | MCP 信任说明 |
| `rotate-ccw` | `RotateCcw` | MCP 信任说明 |
| `lock-keyhole` | `LockKeyhole` | MCP 信任说明 |
| `copy` / `check` | `Copy` / `Check` | 复制按钮图标 |

## ADDED Requirements

### Requirement: 公开使用指南页路由
系统 SHALL 在 `/guide` 提供一个公开页面，未登录用户即可访问，无需鉴权重定向。

#### Scenario: 未登录访客访问
- **WHEN** 未登录用户访问 `/guide`
- **THEN** 页面正常渲染完整使用指南内容，不重定向到登录页

#### Scenario: 已登录用户访问
- **WHEN** 已登录用户访问 `/guide`
- **THEN** 页面正常渲染（不强制跳转），全局 AppHeader 显示其登录态

### Requirement: 1:1 视觉还原
系统 SHALL 依据设计稿 `bookmark-auth/pages/guide.html` 1:1 还原页面结构、间距、字号、配色、圆角与阴影，品牌色为浅色 teal（`#0d9488`）。

#### Scenario: 浅色品牌色始终生效
- **WHEN** 页面在任意全局主题下渲染
- **THEN** 指南页内容始终为浅色品牌色视觉（不受全局 `.dark` 影响），与设计稿一致

### Requirement: MCP 配置复制交互
系统 SHALL 在 MCP 配置示例区提供复制按钮，点击后复制代码块文本，按钮反馈「已复制」并自动恢复。

#### Scenario: 复制成功
- **WHEN** 用户点击「复制」按钮
- **THEN** 配置示例文本被写入剪贴板，按钮文案切换为「已复制」、图标切换为 `check`，约 1.8s 后恢复为「复制」与 `copy` 图标

### Requirement: 内容准确性
系统 SHALL 在指南页展示与真实接入方式一致的 MCP 配置示例与插件下载链接。

#### Scenario: MCP 配置可被真实使用
- **WHEN** 用户复制配置示例并填入有效 `LINKFLOW_TOKEN`
- **THEN** 该配置可被 MCP 客户端用于启动 `bookmark-lite-mcp`（`npx -y bookmark-lite-mcp`）

#### Scenario: 插件下载链接可达
- **WHEN** 用户点击「下载 Bookmark Lite 浏览器插件」按钮
- **THEN** 浏览器开始下载 `/downloads/bookmark-lite-extension.zip`

### Requirement: 全局头部使用指南入口
系统 SHALL 在全局 `AppHeader` 中提供一个「使用指南」入口，指向 `/guide`，对所有访客（含未登录用户）可见。

#### Scenario: 未登录访客看到入口
- **WHEN** 未登录用户在任意页面查看全局头部
- **THEN** 头部可见「使用指南」入口，点击跳转 `/guide`

### Requirement: 清理设计稿源目录
功能验证通过后，系统 SHALL 删除设计稿源目录 `bookmark-auth/`（其内容已迁移至 Next.js 应用内），避免重复维护。

### Requirement: 提交并推送代码
功能验证通过后，系统 SHALL 提交全部变更并推送至远端，commit 信息遵循 Angular 规范（scope 用英文）。
