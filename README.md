<div align="center">

<img src="public/logo_assets/logo.png" alt="Bookmark Lite Logo" width="96" />

# Bookmark Lite

**一键收藏网页，把散落的链接沉淀成你的第二大脑。**

一个自托管的轻量级书签管理服务：浏览器插件一键收藏，公共书签库发现好站，还能通过 MCP 让 AI 直接读取和整理你的书签。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-24-339933)
![pnpm](https://img.shields.io/badge/pnpm-10-F69222)
![Next.js](https://img.shields.io/badge/Next.js-16-black)

[在线体验](https://bookmark-lite.contextlab.top) · [部署指南](#-部署) · [使用指南](#-使用方式) · [API 文档](#-rest-api)

</div>

---

## 目录

- [这是什么](#这是什么)
- [功能特性](#-功能特性)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始本地开发)
- [部署](#-部署)
- [环境变量](#-环境变量)
- [使用方式](#-使用方式)
- [REST API](#-rest-api)
- [数据库运维](#-数据库运维)
- [常见问题](#-常见问题)
- [路线图](#-路线图)
- [参与贡献](#-参与贡献)
- [License](#-license)

---

## 这是什么

Bookmark Lite 是一个开源自托管的书签管理平台，解决三个问题：

1. **收藏太麻烦** —— 装一个浏览器插件，点一下（或直接 Ctrl+D）就能把当前网页存进个人书签库，自动去重。
2. **收藏后吃灰** —— 标签分类、收藏夹、随机发现，让沉淀的链接重新被看见；平台还内置一个精选公共书签库。
3. **数据孤岛** —— 提供标准 REST API 和 [MCP Server](mcp-server)，AI 助手（Claude、Cursor 等）可以直接检索、整理你的书签。

> 数据完全归你所有：程序开源、数据库自建，可随时导出 JSON / CSV / HTML 或整库 SQL 备份。

## 功能特性

### 核心能力

- **浏览器插件（Manifest V3）**：支持 Chrome / Edge 等 Chromium 系浏览器
  - 一键收藏当前标签页（标题、URL、favicon 自动带入）
  - 被动同步：使用浏览器原生方式收藏（Ctrl+D / 地址栏星标）时自动推送
  - 失败本地队列 + 自动重试，断网不丢收藏
- **书签管理**：标签分类、收藏、搜索、可见性控制、无限滚动
- **回收站**：软删除，可恢复，按保留期自动过期
- **导入 / 导出**：支持浏览器标准书签 HTML、CSV、JSON 三种格式
- **公共书签库（APP 域）**：全站可见的精选导航站，含「随机发现」与基于真实访问的热门排序
- **后台管理**：用户管理（角色 / 禁用 / 重置密码）、数据统计与分析看板、审计日志
- **多主题**：浅色 / 深色 / 跟随系统，支持多种背景纹理
- **MCP 接入**：把书签与标签能力暴露为 9 个标准 MCP tools，供 AI 客户端调用

### 两种数据域

| 数据域 | 归属 | 谁可写 |
| --- | --- | --- |
| `USER` | 每个注册用户的个人书签库 | 本人（通过会话或 API Token） |
| `APP` | 平台公共书签库 | 仅 `super_admin` |

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 16（App Router）· React 19 · TypeScript |
| 样式 | Tailwind CSS 4 |
| 认证 | NextAuth 4（JWT 会话）+ 个人 API Token（Bearer） |
| ORM / 数据库 | Prisma 6 · PostgreSQL |
| 邮件 | Resend（注册验证码 / 密码重置） |
| 校验 | Zod |
| 插件 | Manifest V3 · esbuild |
| MCP | `@modelcontextprotocol/sdk`，stdio 传输 |
| 包管理 | pnpm 10（pnpm workspace monorepo） |

> 注意：本项目使用的 Next.js 版本较新（16.x），部分 API 与旧版本存在差异。

## 项目结构

```
bookmark-lite/
├── src/                    # Next.js 主应用
│   ├── app/                # App Router 页面与 API 路由
│   │   ├── api/v1/         # 对外 REST API（/api/v1/*）
│   │   └── api/extension/  # 浏览器插件专用接口
│   ├── actions/            # Server Actions
│   ├── components/         # UI 组件
│   └── server/             # 服务层 / 仓储层 / 鉴权 / 邮件等后端逻辑
├── extension/              # 浏览器插件（独立 workspace 包）
├── mcp-server/             # MCP Server（独立 workspace 包）
├── prisma/                 # Prisma schema 与迁移文件
├── scripts/                # 数据库初始化、备份、种子数据脚本
└── public/downloads/       # 插件安装包分发目录
```

## 快速开始（本地开发）

### 1. 环境要求

- **Node.js 24**（版本以 [.nvmrc](.nvmrc) 为准，推荐用 nvm 切换：`nvm use`）
- **pnpm 10**：`npm install -g pnpm`
- **PostgreSQL**（本地实例或 Docker）

用 Docker 快速起一个 PostgreSQL：

```bash
docker run -d --name bookmark-lite-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bookmark_lite \
  -p 5432:5432 \
  postgres:16
```

### 2. 安装依赖

```bash
pnpm install
```

安装后会自动执行 `prisma generate` 生成客户端。

### 3. 配置环境变量

```bash
cp .env.local.example .env
```

本地开发最小配置（`.env`）：

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bookmark_lite?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/bookmark_lite?schema=public"
NEXTAUTH_SECRET="dev-only-secret-change-me"
```

> 本地开发即使不配置 `NEXTAUTH_SECRET` 也能运行（有兜底值）；**生产环境必须配置强随机密钥**，否则启动会直接报错。

### 4. 初始化数据库表结构

本地快速开发可用（直接同步 schema，不走迁移版本）：

```bash
pnpm run db:setup
```

或使用正式迁移流程（推荐，与生产一致）：

```bash
pnpm run db:migrate:deploy
```

### 5.（可选）填充公共书签库示例数据

写入 20 个标签 + 500 个精选书签到 APP 公共库：

```bash
pnpm run db:data:seed:app
```

> 注意：该脚本会先清空 APP 域已有的书签与标签再写入，仅用于初始化演示。

### 6. 启动开发服务器

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)，访问 `/bookmarks` 即可看到公共书签库。

### 7.（可选）本地调试浏览器插件

```bash
pnpm run build:extension:local
```

然后在 Chrome 打开 `chrome://extensions`，开启「开发者模式」→「加载已解压的扩展程序」→ 选择 `extension/dist` 目录。

---

## 部署

推荐使用 **Vercel + 托管 PostgreSQL（Neon / Vercel Postgres）**，约 5 分钟可完成。

### 方式一：Vercel（推荐）

1. Fork 本仓库并在 Vercel 中导入。
2. 创建一个 PostgreSQL 数据库（Neon、Vercel Postgres、Supabase 均可），拿到连接串。
3. 在 **Project Settings → Environment Variables** 中配置：

   | 变量 | 说明 |
   | --- | --- |
   | `DATABASE_URL` | 带连接池（pooled）的连接串，用于运行时 |
   | `DIRECT_URL` | 直连（unpooled）连接串，用于跑迁移。**使用 Neon 等连接池数据库时强烈建议配置** |
   | `NEXTAUTH_SECRET` | 强随机密钥，用 `openssl rand -base64 32` 生成 |
   | `RESEND_API_KEY` | （可选但建议）Resend API Key，否则注册验证码与找回密码邮件无法发出 |
   | `MAIL_FROM_ADDRESS` | （可选）发件人地址，需在 Resend 验证域名；留空使用 `noreply@resend.dev` |
   | `EXTENSION_ALLOWED_ORIGIN` | （可选）限制插件接口的跨域来源，形如 `chrome-extension://<扩展ID>`；默认 `*` |

4. 将 **Build Command** 修改为：

   ```bash
   pnpm run build:with-db
   ```

   该命令会先执行 `pnpm run db:migrate:deploy` 应用迁移，再执行 `next build`，保证每次部署数据库结构都是最新的。

5. 部署完成后，访问站点并注册第一个账号。

### 方式二：自托管（Node 服务器 / VPS）

```bash
# 1. 构建
pnpm install
pnpm run db:migrate:deploy
pnpm build

# 2. 启动（默认监听 3000 端口，建议前面挂 Nginx / Caddy 并配置 HTTPS）
pnpm start
```

建议用 pm2 / systemd 守护进程，并配置反向代理与 TLS 证书（插件接口和 Cookie 均要求生产环境 HTTPS）。

### 创建第一个超级管理员

注册的账号默认都是 `user` 角色，系统没有内置 admin 账号。注册第一个账号后，在数据库中将其提升为 `super_admin`：

```bash
pnpm exec prisma db execute --schema prisma/schema.prisma --stdin <<'SQL'
UPDATE users SET role = 'super_admin' WHERE email = 'your-email@example.com';
SQL
```

重新登录后即可看到「后台管理」入口。之后也可以在后台直接修改其他用户的角色。

---

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 是 | PostgreSQL 连接串（生产建议用 pooled 地址） |
| `DIRECT_URL` | 建议 | 直连地址，迁移时优先使用；使用 Neon / Supabase 等连接池时应配置 |
| `NEXTAUTH_SECRET` | 生产必填 | JWT 签名密钥，生产环境要求长度 ≥ 32 且不能使用示例值，用 `openssl rand -base64 32` 生成 |
| `RESEND_API_KEY` | 否 | [Resend](https://resend.com) API Key；未配置时注册验证码会打印在服务端控制台（仅适合本地开发），找回密码功能不可用 |
| `MAIL_FROM_ADDRESS` | 否 | 发件人地址，需在 Resend 验证域名；留空使用 `noreply@resend.dev` |
| `EXTENSION_ALLOWED_ORIGIN` | 否 | 插件接口允许的 Origin；默认 `*`。生产环境建议锁定为固定的 `chrome-extension://<ID>` |

更多远程数据库连接串模板可参考 [.env.vercel.example](.env.vercel.example)。

## 使用方式

### 1. 浏览器插件：一键收藏

1. 登录站点，进入 **「API Token」页面（`/api-tokens`）**，创建一个 Token。明文形如 `bml-xxxxxxxx`，**仅展示一次**，请立即复制保存。
2. 安装插件：
   - 直接下载安装包：站点首页 →「使用指南」（`/guide`）→ 下载，或访问 `/downloads/bookmark-lite-extension.zip`
   - 或从源码构建：`pnpm run build:extension`（产物在 `extension/dist`，并会生成 zip 到 `public/downloads`）
3. 在浏览器扩展页加载：Chrome / Edge 打开 `chrome://extensions` → 开启「开发者模式」→「加载已解压的扩展程序」选择 `extension/dist`（使用 zip 分发时解压后加载）。
4. 点击工具栏插件图标 / 打开插件选项页，粘贴 API Token 并保存。
5. 之后：
   - 点击插件图标 →「收藏当前页」一键收藏；
   - 或直接用浏览器原生方式收藏（Ctrl+D），插件会自动同步（可在选项中关闭）。

收藏默认进入你的**个人书签库（USER 域）未分类**，命中重复 URL 会自动跳过。

### 2. MCP：让 AI 操作书签库

MCP Server 已发布到 npm：[`bookmark-lite-mcp`](https://www.npmjs.com/package/bookmark-lite-mcp)，无需克隆源码。在支持 MCP 的客户端（Claude Desktop、Cursor 等）配置文件中加入：

```json
{
  "mcpServers": {
    "bookmark-lite": {
      "command": "npx",
      "args": ["-y", "bookmark-lite-mcp"],
      "env": {
        "API_TOKEN": "bml-xxxxxxxx"
      }
    }
  }
}
```

重启客户端后即可让 AI 调用 9 个工具（书签与标签的增删改查、URL 元数据抓取）。完整说明见 [mcp-server/README.md](mcp-server/README.md)。

> 连接自建实例时，在 `env` 中额外设置 `"API_BASE_URL": "https://你的域名"`。npm 上的发布版默认连接官方线上地址。

### 3. 导入与导出

登录后在「管理 → 导入 / 导出」页面：

- **导入**：支持浏览器导出的标准书签 **HTML**、**CSV**、**JSON**（≤ 5MB）
- **导出**：一键导出当前库为 JSON / CSV / HTML

## REST API

所有 `/api/v1/*` 接口使用 **Bearer Token** 鉴权，Token 在站点 `/api-tokens` 页面生成。

```bash
curl -H "Authorization: Bearer bml-xxxxxxxx" \
  "https://your-domain/api/v1/bookmarks?scope=USER&page=1"
```

统一响应信封：

```jsonc
// 成功
{ "ok": true, "data": { }, "requestId": "<uuid>" }
// 失败
{ "ok": false, "error": { "code": "AUTH_REQUIRED", "message": "无效的访问令牌" }, "requestId": "<uuid>" }
```

### 接口一览（v1）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/bookmarks` | 查询书签，支持 `scope`、`q`、`tagId`、`view`、`sort`、`page`、`pageSize` |
| `POST` | `/api/v1/bookmarks` | 创建书签（`url`、`title?`、`description?`、`favicon?`、`tagNames?`），重复 URL 返回 `alreadyExists: true` |
| `DELETE` | `/api/v1/bookmarks` | 批量删除（请求体传 `ids`），进入回收站 |
| `PATCH` | `/api/v1/bookmarks/:id` | 更新单个书签（标题 / URL / 标签 / 收藏 / 可见性等） |
| `GET` / `POST` | `/api/v1/tags` | 标签列表 / 创建标签 |
| `PATCH` / `DELETE` | `/api/v1/tags/:id` | 更新 / 删除单个标签 |
| `POST` | `/api/v1/url-metadata` | 抓取目标 URL 的标题 / 描述 / 图标（请求体 JSON 传 `url`） |

分页参数：`page` 从 1 开始，`pageSize` 最大 100。操作 `scope=APP` 需要 `super_admin` 权限。

## 数据库运维

相关脚本说明详见 [scripts/db/README.md](scripts/db/README.md)。

| 命令 | 用途 |
| --- | --- |
| `pnpm run db:setup` | 用 `prisma db push` 快速同步表结构（本地开发） |
| `pnpm run db:migrate:dev` | 开发环境创建并应用新迁移 |
| `pnpm run db:migrate:deploy` | 生产环境应用迁移（优先使用 `DIRECT_URL`） |
| `pnpm run db:migrate:baseline` | 给已存在但无迁移历史的库建立基线（如从备份恢复的库） |
| `pnpm run db:data:seed:app` | 写入 APP 公共库种子数据（20 标签 + 500 书签） |
| `pnpm run db:export [路径]` | 用 `pg_dump` 导出整库 SQL 备份 |
| `pnpm run db:import -- 备份.sql` | 导入 SQL 备份到当前库 |
| `pnpm run db:init -- 备份.sql` | 自动建库（若不存在）并导入备份 |
| `pnpm run db:roundtrip:test` | 导出 → 临时库导入 → 数量比对，非破坏性验证备份可用性 |

> 导出 / 导入脚本依赖 PostgreSQL 客户端工具（`pg_dump`、`psql`），需保证其在 `PATH` 中；找不到时可用 `PG_DUMP_PATH` / `PSQL_PATH` 指定绝对路径。

## 常见问题

**Q：注册时收不到验证码邮件？**
A：检查是否配置了 `RESEND_API_KEY`。本地开发未配置邮件服务时，验证码会直接打印在运行 `pnpm dev` 的终端日志里。生产环境请确认发件域名已在 Resend 验证。

**Q：启动时报错 “NEXTAUTH_SECRET 未配置”？**
A：这是生产环境的强制校验。执行 `openssl rand -base64 32` 生成强随机值，配置到环境变量后再启动；且不能使用示例占位值、长度需 ≥ 32。

**Q：插件点收藏没反应 / 提示检查 Token？**
A：① 确认插件选项页中已粘贴有效 Token；② 确认插件连接的平台地址正确（自建实例需在选项页修改 API Base URL）；③ Token 可能已被撤销，到 `/api-tokens` 页面重新生成。401 鉴权错误不会自动重试。

**Q：插件收藏后在网页上找不到？**
A：插件收藏写入的是你的**个人库（USER 域）**，在「我的书签」页面查看，而不是公共书签库。

**Q：Vercel 部署后迁移失败？**
A：连接池（pgbouncer）不支持部分迁移操作。请配置 `DIRECT_URL`（unpooled 直连地址），`db:migrate:deploy` 会自动优先使用它。

**Q：如何升级到新版本？**
A：拉取最新代码后重新部署即可；使用 `pnpm run build:with-db`（Vercel）或先跑 `pnpm run db:migrate:deploy`（自托管）会自动应用增量迁移。建议升级前用 `pnpm run db:export` 备份。

**Q：忘记密码怎么办？**
A：在登录页点「忘记密码」，通过邮件中的重置链接设置新密码（需要已配置邮件服务）。管理员也可以在后台用户管理中直接重置密码。

## 路线图

可能的后续方向（欢迎讨论 / PR）：

- 插件 favicon 在被动同步场景下的补全
- 浏览器历史书签的批量导入
- 收藏文件夹 → 标签的映射同步
- Firefox / Safari 适配
- 接口正式限流能力

## 参与贡献

欢迎提交 Issue 和 Pull Request。

1. Fork 并克隆仓库；
2. 参照「[快速开始](#快速开始本地开发)」完成本地环境；
3. 新建分支开发，提交前运行 `pnpm lint` 确保通过；
4. 描述清楚改动的背景与方式，提交 PR。

如遇安全问题，请优先私下联系维护者，不要直接在公开 Issue 中披露细节。

## License

基于 [MIT License](LICENSE) 开源，Copyright © 2026 Happyileaf。
