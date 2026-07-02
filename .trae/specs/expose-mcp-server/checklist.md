# Checklist

## v1 REST API
- [x] `/api/v1/bookmarks` GET 支持 scope/q/view/tagId/sort/分页，Token 鉴权，返回统一信封
- [x] `/api/v1/bookmarks` POST 支持仅 URL 创建（title 回退 host），URL 重复返回 200 + alreadyExists
- [x] `/api/v1/bookmarks/{id}` PATCH 支持 tagNames 重设及各字段更新
- [x] `/api/v1/bookmarks` DELETE 接受 ids[]，软删除到回收站
- [x] `/api/v1/tags` GET 返回名称/颜色/书签计数
- [x] `/api/v1/tags` POST 创建标签，重名返回 409
- [x] `/api/v1/tags/{id}` PATCH 更新标签，不存在返回 404
- [x] `/api/v1/tags/{id}` DELETE 删除标签
- [x] `/api/v1/url-metadata` POST 抓取 title/description/favicon，Token 鉴权
- [x] 所有 v1 接口：非 super_admin 写 APP scope 返回 403；无效 Token 返回 401（复用 requireApiTokenUser + assertCanManageScope）

## MCP Server
- [x] `mcp-server/` 作为独立 pnpm workspace 包存在，已纳入 pnpm-workspace.yaml
- [x] MCP Server 以 stdio 传输运行
- [x] 通过环境变量读取平台 URL 与 LINKFLOW_TOKEN；缺失 Token 时启动报错
- [x] HTTP 客户端携带 Bearer Token 调用 v1 接口，错误信封透传
- [x] 暴露 9 个 tools：list/create/update/delete_bookmarks、list/create/update/delete_tag、fetch_url_metadata
- [x] delete_bookmarks 与 delete_tag 带 destructive hint
- [x] fetch_url_metadata 描述引导 AI 优先自行分析 URL、失败再调用
- [x] 书签/标签相关 tool 统一用标签名（tagNames/name）而非 UUID

## 验证
- [x] 根项目 lint / typecheck 通过
- [x] mcp-server 包构建 / typecheck 通过
- [x] `mcp-server/README.md` 提供完整接入指南（生成 Token / 构建 / 环境变量 / 客户端 JSON 配置 / 验证 / 排查）
- [x] 提供可复制的 AI 客户端 MCP 配置示例（command + args + env）
- [x] 端到端：stdio 启动后 AI 客户端能列出 9 个 tools 并成功调用 list_bookmarks
