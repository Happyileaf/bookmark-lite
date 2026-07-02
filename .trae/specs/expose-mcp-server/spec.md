# AI 一等公民：MCP Server 能力开放 Spec

## Why
现有平台的所有操作都由用户直接手动完成。在 AI Agent 时代，用户希望通过与 AI 对话完成书签操作（发现网站后让 AI 收藏、询问书签库数据、让 AI 整理未分类书签）。我们不为这些场景定制专用接口，而是开放一组**标准化原子能力**，让 AI 通过组合这些能力完成用户指令，使 AI 成为使用平台的一等公民。

## What Changes
- 新增一组面向程序的正式公开 REST API：`/api/v1/*`，统一用 Bearer Token 鉴权、支持 `scope` 参数、遵循 RESTful 语义。
- 新增独立的 MCP Server（pnpm workspace 包 `mcp-server/`），以 stdio 传输、作为纯 HTTP 客户端调用 `/api/v1/*`，把平台能力暴露为标准 MCP tools。
- 开放 9 个原子能力 tool（书签 4 个 + 标签 4 个 + URL 元数据兜底 1 个），由 AI 自由组合完成用户指令。
- 现有 `/api/extension/*` 接口保持不变，`ApiToken` 表与鉴权体系沿用。

## Impact
- 影响能力：书签 CRUD、标签 CRUD、URL 元数据抓取的对外开放。
- 影响代码：
  - 新增 `src/app/api/v1/**`（REST route，Token 鉴权，复用现有 service 层）
  - 复用 `src/server/services/bookmark.service.ts`、`tag.service.ts`、`src/server/auth/api-token-guard.ts`、`src/server/guard/authorize.ts`
  - 复用 `src/app/api/url-metadata/route.ts` 的元数据解析逻辑
  - 新增 `mcp-server/` workspace 包（独立 `package.json`、`tsconfig.json`）
  - 更新 `pnpm-workspace.yaml` 纳入新包

## 设计原则（贯穿全局）
- **平台只给原子能力，AI 做编排**：不为「整理未分类」等场景定制专用接口。
- **数据域跟随 Token 主人角色**：普通用户仅可操作 USER 库；super_admin 可操作 APP 库（复用 `assertCanManageScope`）。
- **Token 沿用全量权限**：不新增细粒度 scopes。
- **标签用名不用 ID**：create/update 书签时传 `tagNames`，复用 `findOrCreateTagsInTx`。
- **危险操作**：删除为软删除（回收站兜底可恢复），二次确认依赖 AI 客户端审批机制，delete tool 标注 destructive hint。
- **错误透传**：REST 统一信封 `{ ok, error: { code, message } }` 原样透传给 AI，供其自我纠错。

## ADDED Requirements

### Requirement: v1 公开 REST API 命名空间
系统 SHALL 在 `/api/v1/*` 下提供一组面向程序的公开 REST 接口，统一使用 Bearer Token 鉴权（复用 `requireApiTokenUser`），返回统一信封 `{ ok, data|error, requestId }`。

#### Scenario: 缺失或无效 Token
- **WHEN** 请求未携带有效 Bearer Token
- **THEN** 返回 401，`error.code = "AUTH_REQUIRED"`

#### Scenario: 数据域授权
- **WHEN** 非 super_admin 用户尝试写 `scope=APP` 的资源
- **THEN** 返回 403，`error.code = "FORBIDDEN"`

### Requirement: 书签查询能力
系统 SHALL 提供 `GET /api/v1/bookmarks`，支持 `scope`、`q`、`view`（all/favorites/untagged/recent_added/recent_visited）、`tagId`、`sort`、`page`、`pageSize` 参数，返回分页书签列表（含标签）。

#### Scenario: 查询未分类书签
- **WHEN** 调用 `GET /api/v1/bookmarks?scope=USER&view=untagged`
- **THEN** 返回该用户下所有无标签书签的分页结果

### Requirement: 书签创建能力
系统 SHALL 提供 `POST /api/v1/bookmarks`，接受 `scope`、`url`（必填）、`title?`、`description?`、`favicon?`、`tagNames?`。当 `title` 缺省时回退为 URL host。URL 去重命中时返回 200 且标记 `alreadyExists`。

#### Scenario: 仅凭 URL 创建
- **WHEN** 只提供 `url` 而无 `title`
- **THEN** 成功创建书签，`title` 回退为 URL host

#### Scenario: URL 重复
- **WHEN** 提交的 URL 在同数据域已存在
- **THEN** 返回 200，`data.alreadyExists = true`，不重复创建

### Requirement: 书签更新能力
系统 SHALL 提供 `PATCH /api/v1/bookmarks/{id}`，支持更新 `title`、`url`、`description`、`favicon`、`isFavorite`、`isVisible`、`tagNames`（重设标签，不存在则自动创建）。

#### Scenario: 给未分类书签打标签
- **WHEN** 传入 `tagNames: ["AI", "工具"]`
- **THEN** 书签标签被重设为这两个标签，缺失的标签自动创建

### Requirement: 书签删除能力
系统 SHALL 提供 `DELETE /api/v1/bookmarks`，接受 `ids[]`，执行软删除到回收站（复用 `deleteMany`，可在保留期内恢复）。

#### Scenario: 软删除可恢复
- **WHEN** 删除一批书签
- **THEN** 书签进入回收站，返回成功删除数量

### Requirement: 标签查询能力
系统 SHALL 提供 `GET /api/v1/tags`，按 `scope` 返回标签列表（含名称、颜色、书签计数）。

#### Scenario: 列出标签
- **WHEN** 调用 `GET /api/v1/tags?scope=USER`
- **THEN** 返回该用户全部标签及其书签计数

### Requirement: 标签创建能力
系统 SHALL 提供 `POST /api/v1/tags`，接受 `scope`、`name`（必填）、`color?`、`description?`。同域名称重复时返回 409。

#### Scenario: 创建重复标签名
- **WHEN** 创建的标签名在同数据域已存在
- **THEN** 返回 409，`error.code = "TAG_DUPLICATE_NAME"`

### Requirement: 标签更新能力
系统 SHALL 提供 `PATCH /api/v1/tags/{id}`，支持更新 `name`、`color`、`description`（底层复用 `tagService.upsert`）。

#### Scenario: 更新不存在的标签
- **WHEN** 更新的标签 ID 不存在
- **THEN** 返回 404，`error.code = "RESOURCE_NOT_FOUND"`

### Requirement: 标签删除能力
系统 SHALL 提供 `DELETE /api/v1/tags/{id}`，删除指定标签（复用 `tagService.delete`）。

#### Scenario: 删除标签
- **WHEN** 删除一个存在且属于当前数据域的标签
- **THEN** 标签被删除，关联的 BookmarkTag 级联清理

### Requirement: URL 元数据抓取能力（兜底）
系统 SHALL 提供 `POST /api/v1/url-metadata`（复用现有解析逻辑），从 URL 抓取 `title`、`description`、`favicon`。此能力作为兜底，MCP tool 描述中 SHALL 明确引导 AI 优先自行分析 URL，失败后再调用。

#### Scenario: 抓取网页元数据
- **WHEN** 提交一个可访问的 HTML 页面 URL
- **THEN** 返回解析出的 title、description、favicon

### Requirement: 独立 MCP Server
系统 SHALL 提供独立的 MCP Server（`mcp-server/` workspace 包），以 **stdio** 传输运行，通过环境变量读取平台基础 URL 和 Bearer Token，作为纯 HTTP 客户端调用 `/api/v1/*`，将上述能力暴露为标准 MCP tools。

#### Scenario: 通过环境变量注入 Token
- **WHEN** AI 客户端以 stdio 启动 MCP Server 并注入 `LINKFLOW_TOKEN` 与平台 URL 环境变量
- **THEN** MCP Server 使用该 Token 为每个 REST 请求鉴权

#### Scenario: 缺少 Token 环境变量
- **WHEN** 启动时未提供 Token 环境变量
- **THEN** MCP Server 启动即报错并给出明确提示

### Requirement: MCP Tools 能力面
系统 SHALL 暴露以下 9 个 MCP tools，每个 tool 映射到对应 `/api/v1/*` 接口：

| Tool | 映射接口 | 说明 |
|---|---|---|
| `list_bookmarks` | GET /api/v1/bookmarks | scope/q/view/tagId/sort/分页 |
| `create_bookmark` | POST /api/v1/bookmarks | url + 可选字段 + tagNames |
| `update_bookmark` | PATCH /api/v1/bookmarks/{id} | 各字段 + tagNames 重设 |
| `delete_bookmarks` | DELETE /api/v1/bookmarks | ids[]，软删除（destructive hint） |
| `list_tags` | GET /api/v1/tags | 名称/颜色/计数 |
| `create_tag` | POST /api/v1/tags | name/color/description |
| `update_tag` | PATCH /api/v1/tags/{id} | 更新字段 |
| `delete_tag` | DELETE /api/v1/tags/{id} | 删除标签（destructive hint） |
| `fetch_url_metadata` | POST /api/v1/url-metadata | 兜底，描述引导 AI 优先自行分析 |

#### Scenario: 删除 tool 标注破坏性
- **WHEN** 客户端读取 `delete_bookmarks` / `delete_tag` 的 tool 元信息
- **THEN** 该 tool 带有 destructive hint，供客户端触发用户审批

#### Scenario: tool 错误透传
- **WHEN** REST 接口返回错误信封
- **THEN** MCP tool 将 `error.code` 与中文 `message` 透传给 AI，供其判断与重试

---

## 接入方式（Onboarding）

本节说明用户如何把自己的 AI 客户端接入平台。接入链路为：
**AI 客户端 → 本地 stdio 启动 MCP Server → 带 Bearer Token 的 HTTP → 平台 `/api/v1/*`**

### 步骤 1：生成 API Token
1. 登录平台，进入 **API Tokens** 页（`/api-tokens`，管理端为 `/admin/api-tokens`）。
2. 点击「创建 Token」，输入名称（如 `my-ai-agent`），提交。
3. 复制生成的明文 Token（形如 `linkflow_xxxxxxxx...`）。**明文仅展示一次**，请妥善保存。
4. Token 权限等同于账号本人（全量权限）；super_admin 的 Token 可操作 APP 公共库。

### 步骤 2：获取 / 构建 MCP Server
- 方式 A（本地源码构建）：
  ```bash
  pnpm install
  pnpm --filter bookmark-lite-mcp build   # 产物输出到 mcp-server/dist
  ```
- 构建产物为可执行入口 `mcp-server/dist/index.js`，通过 `node` 以 stdio 方式启动。

### 步骤 3：环境变量
MCP Server 启动时读取以下环境变量：

| 变量 | 必填 | 说明 | 示例 |
|---|---|---|---|
| `LINKFLOW_TOKEN` | 是 | 步骤 1 生成的 Bearer Token | `linkflow_xxxx...` |
| `LINKFLOW_BASE_URL` | 是 | 平台基础地址（不含尾部 `/api`） | `https://your-host.com` |

缺少任一必填变量时，MCP Server 启动即报错并给出明确提示。

### 步骤 4：在 AI 客户端配置 MCP Server
以支持 stdio MCP 的客户端（如 Claude Desktop / 各类 AI IDE）为例，在其 MCP 配置中新增一项：

```json
{
  "mcpServers": {
    "bookmark-lite": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"],
      "env": {
        "LINKFLOW_TOKEN": "linkflow_xxxxxxxxxxxx",
        "LINKFLOW_BASE_URL": "https://your-host.com"
      }
    }
  }
}
```

### 步骤 5：验证接入
1. 重启 / 重新加载 AI 客户端，确认 `bookmark-lite` 的 tools 已列出（9 个）。
2. 让 AI 调用 `list_tags` 或 `list_bookmarks(scope=USER)`，若返回数据即接入成功。
3. 若返回 `AUTH_REQUIRED`，检查 `LINKFLOW_TOKEN` 是否有效/未被撤销；若连接失败，检查 `LINKFLOW_BASE_URL` 是否可达。

### Requirement: 接入文档与配置示例
系统 SHALL 在 `mcp-server/README.md` 中提供上述接入指南与可复制的 MCP 客户端配置示例（stdio 命令 + 环境变量）。

#### Scenario: 用户按文档完成接入
- **WHEN** 用户按 README 生成 Token、构建并配置环境变量
- **THEN** AI 客户端可列出全部 tools 并成功调用 `list_bookmarks`
