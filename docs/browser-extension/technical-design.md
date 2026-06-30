# 浏览器插件技术方案文档（Technical Design）

- 文档状态：评审稿（Draft for Review）
- 适用版本：浏览器插件 v1
- 关联平台：bookmark-lite（Next.js App Router + Prisma + PostgreSQL + NextAuth）
- 最后更新：2026-06-30

---

## 1. 背景与目标

### 1.1 背景
平台 bookmark-lite 当前仅支持在 Web 端通过 Server Action 管理书签，缺少与浏览器收藏行为的衔接。用户在浏览网页时若要收藏，需要切回平台 Web 端手动录入，链路长、转化低。

### 1.2 目标
提供一款 Chrome/Edge 浏览器插件，让用户的收藏行为自动汇聚到其个人书签库（`USER` 数据域）：

1. **被动同步**：用户使用浏览器原生方式收藏（Ctrl+D / 地址栏星标 / 书签菜单）时，插件监听到书签新增事件后自动推送到平台。受一个**默认开启**的同步开关控制。
2. **主动收藏**：用户点击插件 popup 中的「收藏当前页」按钮，一键将当前标签页存入平台。

### 1.3 非目标（v1 明确不做）
- 不做删除 / 修改的同步（仅同步「新增」）。
- 不做平台 → 浏览器的反向同步。
- 不做双向同步与冲突解决。
- 不做浏览器历史书签的全量导入（仅处理开关开启后的新增）。
- 不做 Firefox / Safari 适配。
- 不在同步链路中自动打标签（统一进入「未分类」）。
- 不拦截 / 替换浏览器原生书签弹窗（技术上不可行，浏览器 chrome 不开放）。

---

## 2. 关键技术约束与决策结论

### 2.1 浏览器能力边界
浏览器扩展**无法拦截或替换原生加书签弹窗**（Ctrl+D 弹出的 UI 属浏览器自身界面）。可行方案是通过 `bookmarks` 权限监听书签变更事件（`onCreated` / `onRemoved` / `onChanged`）。因此「被动同步」实现为：

> 用户原生收藏 → service worker 监听 `chrome.bookmarks.onCreated` → 推送平台。

### 2.2 认证方式
平台现状仅有基于 Cookie 的 NextAuth JWT 会话，扩展 service worker 无法稳定复用。结论：**引入个人 API Token**。

- 在平台「设置」页生成 Token，明文仅在生成时一次性展示。
- 数据库仅存储 Token 的哈希（SHA-256），不可逆。
- 扩展通过 `Authorization: Bearer <token>` 调用专用接口。
- 支持随时撤销，单用户可拥有多个 Token。

### 2.3 决策结论汇总

| 决策项 | 结论 |
|---|---|
| 核心目标 | 原生收藏被动同步 + 插件主动一键收藏 |
| 同步方向与范围 | 单向（原生→平台），仅新增 |
| 历史书签处理 | 不全量导入，仅处理开关开启后的新增 |
| 去重策略 | 按 `normalizedUrl` 去重，已存在则跳过（静默成功） |
| 标签处理 | 不加标签，进「未分类」，scope 固定 `USER` |
| 后端接口 | 新增独立路由 `POST /api/extension/bookmarks` |
| Token 存储 | 新增 `ApiToken` 表，存哈希、可撤销、每用户多个 |
| 主/被动后端 | 完全复用同一接口，后端不区分来源 |
| 主动收藏交互 | popup 一键即存，不进入编辑 |
| 已存在反馈 | 主动收藏命中去重时提示「已在书签库」 |
| 目标浏览器 | Chrome / Edge（Chromium 系，Manifest V3） |
| 代码位置 | 本仓库 `extension/` 子目录 |
| 失败处理 | 本地失败队列 + 有限次重试 + 角标提示 |

---

## 3. 整体架构

```
┌──────────────────────────── Browser ────────────────────────────┐
│                                                                  │
│  原生收藏 (Ctrl+D / 星标)                                         │
│        │ chrome.bookmarks.onCreated                              │
│        ▼                                                          │
│  ┌──────────────────────┐      ┌──────────────────────────┐     │
│  │  Service Worker       │◄────│  Popup                     │     │
│  │  (background.js)      │     │  - Token 输入              │     │
│  │  - 监听书签事件        │     │  - 同步开关 (默认开)        │     │
│  │  - 主动收藏处理        │     │  - 「收藏当前页」按钮        │     │
│  │  - 失败队列 + 重试     │     │  - 状态显示                 │     │
│  └──────────┬───────────┘      └──────────────────────────┘     │
│             │ chrome.storage (token / enabled / queue)           │
└─────────────┼────────────────────────────────────────────────────┘
              │ HTTPS  Authorization: Bearer <token>
              ▼
┌──────────────────────────── Platform ───────────────────────────┐
│  POST /api/extension/bookmarks                                   │
│        │  1. Bearer Token 鉴权 (查 ApiToken 哈希)                 │
│        │  2. 解析 user → scope=USER                              │
│        │  3. bookmarkService.create (复用)                       │
│        │  4. 去重命中转换为 200 + alreadyExists                  │
│        ▼                                                          │
│  bookmarkService.create → bookmarkRepo / Prisma → PostgreSQL     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. 后端设计

### 4.1 数据库变更

新增 `ApiToken` 模型，挂在 `User` 下。遵循平台既有命名（`@map` 蛇形列名、`@db.Uuid`、`Timestamptz(6)`）。

```prisma
model ApiToken {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String    @db.VarChar(100)
  tokenHash   String    @unique @map("token_hash") @db.VarChar(64)
  tokenPrefix String    @map("token_prefix") @db.VarChar(12)
  lastUsedAt  DateTime? @map("last_used_at") @db.Timestamptz(6)
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  revokedAt   DateTime? @map("revoked_at") @db.Timestamptz(6)

  @@index([userId, createdAt(sort: Desc)], map: "idx_api_tokens_user_created")
  @@map("api_tokens")
}
```

`User` 模型新增反向关系：

```prisma
model User {
  // ...existing fields...
  apiTokens ApiToken[]
}
```

字段说明：
- `tokenHash`：SHA-256（hex，64 字符）。Token 是高熵随机串，无需 argon2 等慢哈希。
- `tokenPrefix`：明文 Token 的前缀（例如 `blt_` + 前 8 位），用于在设置页列表中区分展示，不泄露完整 Token。
- `revokedAt`：软撤销标记。鉴权时要求 `revokedAt IS NULL`。
- `onDelete: Cascade`：用户删除时连带删除其 Token。

迁移文件：`prisma/migrations/<timestamp>_add_api_tokens/migration.sql`，通过 `pnpm run db:migrate:deploy` 应用。

### 4.2 Token 格式与生成

- 明文格式：`blt_` + 32 字节 `crypto.randomBytes` 的 base64url 编码。
- 存储：`tokenHash = sha256(明文)` 的 hex；`tokenPrefix = 明文前 12 字符`。
- 明文仅在创建接口的响应中返回一次，之后不可再读取。

新增 `src/server/auth/api-token.ts`：

```ts
import { createHash, randomBytes } from "node:crypto";

const TOKEN_PREFIX = "blt_";

/** 生成新的 API Token 明文及其派生信息。 */
export function generateApiToken() {
  const raw = TOKEN_PREFIX + randomBytes(32).toString("base64url");
  return {
    raw,
    tokenHash: hashApiToken(raw),
    tokenPrefix: raw.slice(0, 12),
  };
}

/** 计算 Token 的 SHA-256 哈希（hex）。 */
export function hashApiToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
```

### 4.3 Token 仓储层

新增 `src/server/repositories/api-token.repo.ts`，提供：
- `create({ userId, name, tokenHash, tokenPrefix })`
- `listByUser(userId)`：返回未撤销 Token（不含哈希）。
- `findActiveByHash(tokenHash)`：鉴权用，命中且 `revokedAt IS NULL`。
- `touchLastUsed(id)`：更新 `lastUsedAt`（可异步、不阻塞主流程）。
- `revoke(id, userId)`：置 `revokedAt = now()`，校验归属。

### 4.4 Token 服务层

新增 `src/server/services/api-token.service.ts`：
- `issue(user, name)`：生成 → 落库 → 返回 `{ id, name, tokenPrefix, raw }`（`raw` 仅此一次）。
- `list(user)`：返回该用户 Token 列表（脱敏）。
- `revoke(user, tokenId)`：撤销，写审计日志 `API_TOKEN_REVOKE`。
- 创建时写审计日志 `API_TOKEN_CREATE`。

### 4.5 Token 鉴权中间件

新增 `src/server/auth/api-token-guard.ts`：

```ts
import type { SessionUser } from "@/server/auth/session";

/**
 * 从请求中解析 Bearer Token 并返回对应用户。
 * 失败时抛出 AppError（401）。
 */
export async function requireApiTokenUser(request: Request): Promise<SessionUser> {
  // 1. 读取 Authorization: Bearer <token>
  // 2. hashApiToken(token) → apiTokenRepo.findActiveByHash
  // 3. 命中则 touchLastUsed（fire-and-forget），返回 { id, role }
  // 4. 未命中 / 缺失 / 已撤销 → throw new AppError("AUTH_REQUIRED", "无效的访问令牌", 401)
}
```

注意：插件请求**不携带 Cookie**，因此该接口不依赖 NextAuth 会话，也天然规避 CSRF（无 Cookie 即无 CSRF 面）。

### 4.6 收藏接口：`POST /api/extension/bookmarks`

文件：`src/app/api/extension/bookmarks/route.ts`

请求：
```http
POST /api/extension/bookmarks
Authorization: Bearer blt_xxxxxxxx
Content-Type: application/json

{
  "url": "https://example.com/article",
  "title": "示例文章",
  "favicon": "https://example.com/favicon.ico"
}
```

请求体校验（新增 `src/server/validators/extension.schema.ts`）：

```ts
import { z } from "zod";

export const extensionBookmarkCreateSchema = z.object({
  url: z.string().trim().min(1, "URL 不能为空").max(2048),
  title: z.string().trim().min(1).max(300).optional(),
  favicon: z.string().url().max(1000).optional().or(z.literal("")),
});
```

处理流程：
1. `requireApiTokenUser(request)` → 得到 `user`（scope 强制 `USER`）。
2. 解析并校验请求体。
3. `title` 缺省时回退为 URL 的 host 或截断后的 URL（保证非空，满足 `bookmarkCreateSchema`）。
4. 调用 `bookmarkService.create({ scope: "USER", title, url, favicon, tagNames: [] }, user)`。
5. **去重语义转换**：`bookmarkService.create` 在 URL 重复时抛 `BOOKMARK_DUPLICATE_URL`(409)。本接口需捕获该错误码，转换为 `200 { ok: true, data: { alreadyExists: true } }`，以符合「已存在则跳过」的约定。
6. 其他 AppError 按其 `status` 透传；未知错误返回 500。

响应（统一信封，与平台 `GET /api/bookmarks` 一致）：

```jsonc
// 新建成功
{ "ok": true, "data": { "id": "<uuid>", "alreadyExists": false }, "requestId": "<uuid>" }
// 已存在（去重命中）
{ "ok": true, "data": { "alreadyExists": true }, "requestId": "<uuid>" }
// 鉴权失败
{ "ok": false, "error": { "code": "AUTH_REQUIRED", "message": "无效的访问令牌" }, "requestId": "<uuid>" }
// 参数错误
{ "ok": false, "error": { "code": "VALIDATION_FAILED", "message": "...", "fieldErrors": {...} }, "requestId": "<uuid>" }
```

接口约束：
- `export const dynamic = "force-dynamic";`
- 需设置 CORS 响应头以允许扩展来源调用（见 4.8）。
- 复用现有 `AppError` / `isAppError` 错误处理范式。

### 4.7 Token 管理接口（供设置页使用）

可用 Server Action（与平台现有 `*.actions.ts` 一致），无需 REST：
- `createApiTokenAction(name)` → 返回明文（仅一次）。
- `revokeApiTokenAction(tokenId)`。
- 列表数据在 `settings/page.tsx` 服务端直接查询并传入。

### 4.8 CORS

扩展 service worker 的 `fetch` 发起的是跨域请求（Origin 为 `chrome-extension://<id>`）。`POST /api/extension/bookmarks` 需返回：
- `Access-Control-Allow-Origin`：建议读环境变量 `EXTENSION_ALLOWED_ORIGIN`（生产填扩展固定 ID 来源），开发期可临时 `*`（仅该接口）。
- `Access-Control-Allow-Headers: Authorization, Content-Type`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- 实现 `OPTIONS` 预检处理。

> 由于接口用 Bearer 而非 Cookie，放宽 Origin 不会带来会话劫持风险；Token 泄露风险由 Token 本身的保密承担。

### 4.9 限流与审计
- 限流：v1 采用轻量保护，按 Token 维度在接口入口做简单计数（可用内存计数或后续接入），超阈值返回 429。v1 可先记录不强制。
- 审计：复用 `auditRepo`。`bookmarkService.create` 已写 `BOOKMARK_CREATE`。Token 生成/撤销写 `API_TOKEN_CREATE` / `API_TOKEN_REVOKE`。

---

## 5. 平台 Web 端改动

### 5.1 设置页新增「API Token / 浏览器插件」区块
位置：`src/components/settings/settings-view.tsx`（USER scope）。新增子组件 `src/components/settings/api-token-section.client.tsx`：
- Token 列表：展示 `name`、`tokenPrefix***`、`lastUsedAt`、创建时间、撤销按钮。
- 「生成新 Token」：输入名称 → 调用 action → 弹出明文供复制，关闭后不可再查看（明确文案提示）。
- 插件下载/安装引导链接（可选）。

### 5.2 受影响文件清单
| 文件 | 变更 |
|---|---|
| `prisma/schema.prisma` | 新增 `ApiToken` 模型 + `User.apiTokens` |
| `prisma/migrations/<ts>_add_api_tokens/` | 新增迁移 |
| `src/server/auth/api-token.ts` | 新增：生成/哈希 |
| `src/server/auth/api-token-guard.ts` | 新增：Bearer 鉴权 |
| `src/server/repositories/api-token.repo.ts` | 新增：仓储 |
| `src/server/services/api-token.service.ts` | 新增：服务 |
| `src/server/validators/extension.schema.ts` | 新增：请求校验 |
| `src/actions/api-token.actions.ts` | 新增：创建/撤销 action |
| `src/app/api/extension/bookmarks/route.ts` | 新增：收藏接口 + OPTIONS |
| `src/components/settings/api-token-section.client.tsx` | 新增：Token 管理 UI |
| `src/components/settings/settings-view.tsx` | 接入新区块 |

> 编码遵循 `ai-toolkit/rules/coding`：命名规范（NAMING-001）、React 组件拆分（REACT-001）、注释规范（COMMENT-001）、枚举规范（ENUM-001）。

---

## 6. 浏览器插件设计（`extension/`）

### 6.1 目录结构
```
extension/
  manifest.json          # Manifest V3
  src/
    background.ts        # service worker：监听书签事件 + 失败队列
    popup.html
    popup.ts             # popup 逻辑：token / 开关 / 收藏按钮 / 状态
    popup.css
    lib/
      api.ts             # 调用 POST /api/extension/bookmarks
      storage.ts         # chrome.storage 封装：token / enabled / queue
      queue.ts           # 失败队列与重试
  icons/                 # 16/32/48/128 + 角标
  package.json           # 构建脚本（esbuild/tsc）
  tsconfig.json
```

### 6.2 manifest.json（要点）
```jsonc
{
  "manifest_version": 3,
  "name": "Bookmark Lite Sync",
  "version": "1.0.0",
  "permissions": ["bookmarks", "storage", "activeTab", "tabs"],
  "host_permissions": ["<平台域名>/*"],
  "background": { "service_worker": "background.js", "type": "module" },
  "action": { "default_popup": "popup.html" }
}
```

### 6.3 配置存储（`chrome.storage.local`）
| 键 | 含义 | 默认 |
|---|---|---|
| `apiBaseUrl` | 平台基址 | 预置生产域名，可改 |
| `token` | API Token 明文 | 空 |
| `syncEnabled` | 被动同步开关 | `true`（默认开） |
| `failedQueue` | 失败待重试队列 | `[]` |

### 6.4 被动同步（background）
```
chrome.bookmarks.onCreated(id, node):
  if not syncEnabled: return
  if not node.url: return            # 文件夹无 url，跳过
  if not token: 记录"未配置token"状态，入队或忽略
  push({ url: node.url, title: node.title, favicon: 派生 })
```
favicon 来源：`onCreated` 不直接提供 favicon。v1 策略：留空（`favicon` 可选），由平台侧或后续增强补全。

### 6.5 主动收藏（popup）
```
点击「收藏当前页」:
  tab = chrome.tabs.query({active, currentWindow})[0]
  push({ url: tab.url, title: tab.title, favicon: tab.favIconUrl })
  根据响应:
    alreadyExists=false → 提示「已收藏」
    alreadyExists=true  → 提示「已在书签库」
    鉴权失败            → 提示「请检查 Token」
    网络失败            → 入队 + 提示「将稍后重试」
```

### 6.6 失败队列与重试（queue）
- `push()` 失败（网络错误 / 5xx）时，将载荷写入 `failedQueue`。
- 重试时机：service worker 启动、下一次 `onCreated`、popup 打开时尝试 flush。
- 重试策略：每条最多重试 N 次（建议 3），指数退避；超限则标记失败并在扩展图标上设角标（`chrome.action.setBadgeText`）提示数量。
- 鉴权失败（401）不重试，直接提示用户检查 Token。

### 6.7 调用封装（api.ts）
```ts
// POST /api/extension/bookmarks，Bearer Token，返回 { ok, data, error }
// 区分：成功 / alreadyExists / 401 / 网络错误（供 queue 决策是否重试）
```

### 6.8 构建与加载
- 用 `esbuild` 或 `tsc` 将 `src/*.ts` 编译为扩展可加载的 JS。
- 开发：Chrome → 扩展程序 → 加载已解压的扩展程序 → 选 `extension/dist`。
- 发布：打包 zip 上传 Chrome Web Store（v1 可先内部分发）。

---

## 7. 安全设计
- Token 仅存哈希，明文一次性展示；列表仅显示前缀。
- 接口仅接受 Bearer，不读 Cookie，规避 CSRF。
- Token 可随时撤销（软删 `revokedAt`），鉴权强制校验未撤销。
- 强制 HTTPS（`host_permissions` 指向 https 域名）。
- 插件本地存储 Token 于 `chrome.storage.local`（扩展沙箱隔离）。
- 接口对 `url` 长度与协议做校验，复用平台 `normalizeUrl`。

---

## 8. 测试策略
- 后端单测：`api-token`（生成/哈希一致性）、`api-token-guard`（有效/无效/已撤销/缺失）、`extension/bookmarks` 路由（新建/去重转 200/校验失败/鉴权失败/CORS 预检）。
- 服务层：`bookmarkService.create` 去重路径已有逻辑，补接口层转换覆盖。
- 插件：手动验收为主（见验收文档）；`api.ts`/`queue.ts` 可加纯函数单测。

---

## 9. 上线与回滚
- 上线顺序：DB 迁移 → 后端接口 + 设置页 → 插件分发。
- DB 迁移：`pnpm run db:migrate:deploy`（Vercel 构建命令已含迁移）。
- 回滚：接口与设置页为新增，可直接下线路由；`ApiToken` 表为新增，保留不影响既有功能。

---

## 10. 待确认 / 后续增强
- favicon 补全（被动同步场景）。
- 历史书签全量导入（明确为 v2 候选）。
- 文件夹名 → 标签映射（v2 候选）。
- Firefox 适配。
- 接口正式限流接入。
