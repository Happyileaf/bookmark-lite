# Tasks

- [x] Task 1: 搭建 v1 书签 REST 接口：在 `/api/v1/bookmarks` 提供 Token 鉴权、支持 scope 的书签 CRUD。
  - [x] SubTask 1.1: 新增 `src/app/api/v1/bookmarks/route.ts`，实现 `GET`（复用 bookmarkService.list，参数 scope/q/view/tagId/sort/page/pageSize）与 `POST`（复用 bookmarkService.create，title 缺省回退 host，URL 重复转 200 + alreadyExists）
  - [x] SubTask 1.2: 新增 `src/app/api/v1/bookmarks/[id]/route.ts`，实现 `PATCH`（复用 bookmarkService.update，支持 tagNames 重设）
  - [x] SubTask 1.3: 在 `src/app/api/v1/bookmarks/route.ts` 实现 `DELETE`（复用 bookmarkService.deleteMany，接受 ids[]）
  - [x] SubTask 1.4: 统一走 `requireApiTokenUser` 鉴权与统一信封响应，复用现有 AppError 处理模式

- [x] Task 2: 搭建 v1 标签 REST 接口：在 `/api/v1/tags` 提供 Token 鉴权、支持 scope 的标签 CRUD。
  - [x] SubTask 2.1: 新增 `src/app/api/v1/tags/route.ts`，实现 `GET`（复用 tagService.list）与 `POST`（复用 tagService.upsert 创建分支）
  - [x] SubTask 2.2: 新增 `src/app/api/v1/tags/[id]/route.ts`，实现 `PATCH`（复用 tagService.upsert 更新分支）与 `DELETE`（复用 tagService.delete）

- [x] Task 3: 搭建 v1 URL 元数据接口：在 `/api/v1/url-metadata` 提供 Token 鉴权的元数据抓取。
  - [x] SubTask 3.1: 新增 `src/app/api/v1/url-metadata/route.ts`，复用现有 `src/app/api/url-metadata/route.ts` 的解析逻辑，加 Token 鉴权与统一信封

- [x] Task 4: 创建 MCP Server workspace 包骨架。
  - [x] SubTask 4.1: 新建 `mcp-server/` 目录，含 `package.json`（依赖 `@modelcontextprotocol/sdk`）、`tsconfig.json`、`build` 脚本
  - [x] SubTask 4.2: 更新根 `pnpm-workspace.yaml` 纳入 `mcp-server`
  - [x] SubTask 4.3: 实现启动入口：stdio 传输，读取平台 URL 与 `LINKFLOW_TOKEN` 环境变量，缺失时报错退出
  - [x] SubTask 4.4: 实现 HTTP 客户端封装（带 Bearer Token，统一解析信封与错误透传）

- [x] Task 5: 实现 10 个 MCP tools 并映射到 v1 接口。
  - [x] SubTask 5.1: 书签 tools：`list_bookmarks`、`create_bookmark`、`update_bookmark`、`delete_bookmarks`（destructive hint）
  - [x] SubTask 5.2: 标签 tools：`list_tags`、`create_tag`、`update_tag`、`delete_tag`（destructive hint）
  - [x] SubTask 5.3: `fetch_url_metadata` tool，描述中明确引导 AI 优先自行分析 URL、失败再调用
  - [x] SubTask 5.4: 各 tool 定义清晰的输入 schema（标签统一用 tagNames/name），错误信封透传给 AI

- [x] Task 6: 接入文档、验证与联调。
  - [x] SubTask 6.1: 编写 `mcp-server/README.md`：包含「生成 Token → 构建 → 环境变量（LINKFLOW_TOKEN / LINKFLOW_BASE_URL）→ AI 客户端 JSON 配置示例 → 验证接入 → 常见错误排查」完整接入指南
  - [x] SubTask 6.2: 运行 lint / typecheck（根项目与 mcp-server 包），修复问题
  - [x] SubTask 6.3: 端到端自测：以 stdio 启动 MCP Server，用真实 Token 验证 `list_tags` / `list_bookmarks` 可返回数据，并核对 401/连接失败的排查提示准确

# Task Dependencies
- Task 4 depends on Task 1, Task 2, Task 3（tools 需要 v1 接口就绪）
- Task 5 depends on Task 4（tools 依赖 Server 骨架与 HTTP 客户端）
- Task 6 depends on Task 5
- Task 1, Task 2, Task 3 相互独立，可并行
