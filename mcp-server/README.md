# Bookmark Lite MCP Server

将 Bookmark Lite（LinkFlow）平台的书签与标签能力，以标准 [Model Context Protocol (MCP)](https://modelcontextprotocol.io) tools 的形式暴露给支持 MCP 的 AI 客户端（如 Claude Desktop、Cursor 等）。

## 简介

这是一个独立的 Node 进程，通过 **stdio 传输**与 AI 客户端通信，本身作为一个纯 HTTP 客户端，携带 Bearer Token 调用平台的 `/api/v1/*` REST 接口，把平台能力封装为 9 个标准 MCP tools。

调用链路：

```
AI 客户端  ──(stdio / MCP 协议)──▶  bookmark-lite-mcp  ──(HTTP + Bearer Token)──▶  平台 /api/v1/*
```

- AI 客户端负责编排与调用 tools；
- 本 MCP Server 负责鉴权、请求封装与错误透传；
- 平台负责真实的数据读写与权限校验。

## 步骤 1：生成 API Token

1. 登录平台，进入 **`/api-tokens`** 页面（个人 Token）。
2. 点击创建，为 Token 起一个便于识别的名称。
3. 创建后会显示一次明文 Token，形如 `linkflow_xxxxxxxx`。**明文仅显示一次，请立即复制保存**，页面刷新后无法再次查看。

> 权限说明：普通用户的 Token 只能操作个人库（`scope=USER`）；`super_admin` 用户的 Token 可额外操作平台公共库（`scope=APP`）。

## 步骤 2：获取平台地址

本 MCP Server 只负责转发 HTTP 请求，平台可部署在任意地址。

- 远程部署（生产）：`https://bookmark-lite.contextlab.top`
- 本地开发：`http://localhost:3000`

后续在客户端配置的 `LINKFLOW_BASE_URL` 处填入对应地址（结尾是否带 `/` 均可）。

## 步骤 3：在 AI 客户端中配置（推荐 npx 零安装）

本包已发布到 npm，名为 `bookmark-lite-mcp`。在支持 MCP 的 AI 客户端（Claude Desktop、Cursor 等）的配置文件 `mcpServers` 中加入下述条目即可，**无需手动克隆或构建**：

```json
{
  "mcpServers": {
    "bookmark-lite": {
      "command": "npx",
      "args": ["-y", "bookmark-lite-mcp"],
      "env": {
        "LINKFLOW_TOKEN": "linkflow_xxxxxxxx",
        "LINKFLOW_BASE_URL": "https://bookmark-lite.contextlab.top"
      }
    }
  }
}
```

- `npx -y bookmark-lite-mcp` 会自动拉取最新版本并以 stdio 方式运行；
- `env` 中注入步骤 1 的 Token 与步骤 2 的平台地址；
- 保存后重载 / 重启 AI 客户端使配置生效。

### 环境变量

| 变量名 | 是否必填 | 说明 |
| --- | --- | --- |
| `LINKFLOW_TOKEN` | 必填 | 步骤 1 生成的 API Token，形如 `linkflow_xxx` |
| `LINKFLOW_BASE_URL` | 必填 | 平台基址，如 `https://bookmark-lite.contextlab.top` |

任一缺失，Server 启动时会在 stderr 打印中文错误并退出。

### 从源码构建（仅开发 / 未发布前）

如果你要本地修改调试，可在仓库根目录执行（要求 Node 18+）：

```bash
pnpm install
pnpm --filter bookmark-lite-mcp build
```

构建产物为 `mcp-server/dist/index.js`，此时客户端配置改用本地绝对路径：

```json
{
  "mcpServers": {
    "bookmark-lite": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"],
      "env": {
        "LINKFLOW_TOKEN": "linkflow_xxxxxxxx",
        "LINKFLOW_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

## 步骤 4：验证接入

1. 重载客户端后，在其 MCP / 工具面板中确认能列出本 Server 的 **9 个 tools**。
2. 调用一个只读工具做连通性验证，例如 `list_tags` 或 `list_bookmarks`：
   - 返回标签 / 书签数据 → 接入成功；
   - 返回错误信息 → 参考下方常见问题排查。

## 步骤 5：常见问题排查

| 现象 | 可能原因与处理 |
| --- | --- |
| 工具返回 `[AUTH_REQUIRED]` 或鉴权相关错误 | Token 无效 / 过期 / 未注入。检查 `LINKFLOW_TOKEN` 是否正确、是否已在平台被撤销。 |
| 工具返回 `[NETWORK_ERROR]` 或连接失败 | 检查 `LINKFLOW_BASE_URL` 是否正确、平台是否可访问、是否有网络 / 防火墙限制。 |
| 操作 `scope=APP` 报权限错误 | APP 库需要 `super_admin` 的 Token，请改用具备权限的 Token 或改用 `scope=USER`。 |
| 客户端启动即退出 | 多为缺少必填环境变量，查看客户端的 MCP 日志（stderr）中的中文提示。 |

## 附：Tools 一览表

| # | Tool 名称 | 说明 | 主要入参 | 标注 |
| --- | --- | --- | --- | --- |
| 1 | `list_bookmarks` | 查询 / 搜索书签库 | `scope?`, `q?`, `view?`, `tagId?`, `sort?`, `page?`, `pageSize?` | readOnly |
| 2 | `create_bookmark` | 收藏一个网址到书签库 | `scope?`, `url`, `title?`, `description?`, `favicon?`, `tagNames?` | — |
| 3 | `update_bookmark` | 更新书签（含打标签 / 收藏） | `scope?`, `id`, `title?`, `url?`, `description?`, `favicon?`, `isFavorite?`, `isVisible?`, `tagNames?` | — |
| 4 | `delete_bookmarks` | 删除书签（软删除到回收站，可恢复） | `scope?`, `ids` | destructive |
| 5 | `list_tags` | 列出所有标签及书签计数 | `scope?` | readOnly |
| 6 | `create_tag` | 创建标签 | `scope?`, `name`, `color?`, `description?` | — |
| 7 | `update_tag` | 更新标签 | `scope?`, `id`, `name?`, `color?`, `description?` | — |
| 8 | `delete_tag` | 删除标签 | `scope?`, `id` | destructive |
| 9 | `fetch_url_metadata` | 从 URL 抓取标题 / 描述 / 图标（兜底） | `url` | readOnly |

> 说明：
> - `scope` 取值 `USER`（默认，个人库）或 `APP`（平台公共库，需 super_admin）。
> - 打标签统一使用**标签名数组** `tagNames`，而非标签 ID；不存在的标签名会自动创建。
> - `fetch_url_metadata` 为兜底工具：AI 应优先依靠自身能力分析 URL 获取元数据，仅当自身无法获取时才调用它。
> - 破坏性工具（`delete_bookmarks`、`delete_tag`）已标注 `destructiveHint`，建议客户端在执行前向用户确认。
