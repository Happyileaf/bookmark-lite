import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { config } from "./config.js";
import { httpClient, ApiError } from "./http-client.js";

const scopeSchema = z
  .enum(["APP", "USER"])
  .default("USER")
  .describe("数据域：USER=个人库，APP=平台公共库（需 super_admin token），默认 USER");

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

function fail(error: unknown) {
  const message =
    error instanceof ApiError
      ? `操作失败 [${error.code}]：${error.message}`
      : `操作失败：${error instanceof Error ? error.message : String(error)}`;
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  };
}

const server = new McpServer({
  name: "bookmark-lite-mcp",
  version: "1.0.0",
});

// 1. list_bookmarks
server.registerTool(
  "list_bookmarks",
  {
    title: "查询书签",
    description:
      "查询/搜索书签库。支持关键词、视图过滤、按标签过滤、排序与分页。返回书签列表及分页信息。",
    inputSchema: {
      scope: scopeSchema,
      q: z.string().optional().describe("搜索关键词，匹配标题/URL/描述"),
      view: z
        .enum(["all", "favorites", "untagged", "recent_added", "recent_visited"])
        .optional()
        .describe("视图：all/favorites/untagged/recent_added/recent_visited"),
      tagId: z.string().optional().describe("按标签 ID 过滤"),
      sort: z.string().optional().describe("排序方式，如 created_desc/title_asc 等"),
      page: z.number().int().min(1).optional().describe("页码，从 1 开始"),
      pageSize: z.number().int().min(1).max(100).optional().describe("每页数量，最大 100"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ scope, q, view, tagId, sort, page, pageSize }) => {
    try {
      const data = await httpClient.get("/api/v1/bookmarks", {
        scope,
        q,
        view,
        tagId,
        sort,
        page,
        pageSize,
      });
      return ok(data);
    } catch (error) {
      return fail(error);
    }
  },
);

// 2. create_bookmark
server.registerTool(
  "create_bookmark",
  {
    title: "收藏书签",
    description:
`【强制要求！调用前必须100%完成以下所有操作，否则视为无效调用】
### 前置流程（必须执行）
1. **必须优先使用你自身的知识与分析能力**，解析URL对应的网页内容，完整提取以下信息：
   - ✅ 准确的网页标题（**绝对禁止直接使用URL作为标题**，必须是网页真实内容的标题）
    - ✅ 精炼的内容描述（1-2句话概括网页核心价值，100字以内，禁止空描述）
    - ✅ 建议提供1-3个与内容主题高度相关的分类标签（用户有明确要求的除外，标签应为简洁的分类词，如"前端开发"、"AI工具"、"设计资源"等）
    - ✅ 网页favicon图标URL（如果能分析到）
2. **用户要求优先原则**：如果用户有明确的标签要求（包括明确指定标签、明确要求不要标签），请优先严格按照用户要求执行，无需遵守上述建议数量限制。
3. 仅当你**完全无法分析该URL内容**时，才允许**先调用fetch_url_metadata工具获取基础元数据**，再结合你自身的理解补全信息后调用本工具
4. 标签自动关联机制（无需人工干预）：
   - 你无需关心标签是否已存在，只需传入你认为适合的标签名即可
   - 平台会自动匹配已有标签，完全匹配的会直接关联
   - 不存在的标签会自动创建并关联
   - 无需提前调用list_tags查询现有标签，也无需提前调用create_tag创建标签

### 调用规范
- 禁止仅传入url参数调用本工具，必须同时提供title、description、tagNames
- 提供的元数据越准确完整，用户后续检索和管理书签的体验越好，请严格按照要求执行

收藏一个网址到书签库。若URL已存在会返回alreadyExists:true。`,
    inputSchema: {
      scope: scopeSchema,
      url: z.string().describe("要收藏的网址（必填）"),
      title: z.string().describe("网页标题（必填，必须优先通过自身分析获取，禁止直接使用URL作为标题）"),
      description: z.string().describe("网页内容的精炼描述（必填，概括核心价值，100字以内）"),
      favicon: z.string().optional().describe("网页图标URL，可通过分析或fetch_url_metadata获取"),
      tagNames: z.array(z.string()).optional().describe("1-3个内容相关的分类标签名数组（建议填写，平台会自动处理标签的关联与创建，无需提前操作；若用户明确要求不要标签可不填）")
    },
  },
  async ({ scope, url, title, description, favicon, tagNames }) => {
    try {
      const data = await httpClient.post("/api/v1/bookmarks", {
        scope,
        url,
        title,
        description,
        favicon,
        tagNames,
      });
      return ok(data);
    } catch (error) {
      return fail(error);
    }
  },
);

// 3. update_bookmark
server.registerTool(
  "update_bookmark",
  {
    title: "更新书签",
    description:
`更新书签信息。常见使用场景：
1. 当你调用create_bookmark后收到信息不完整的警告时，必须调用本工具补全缺失的标题、描述或标签
2. 修正已存在书签的错误信息
3. 调整书签的收藏状态、可见状态等

### 参数说明
- 可修改标题/URL/描述/图标、切换收藏(isFavorite)与可见(isVisible)状态
- 传入 tagNames 数组会完全替换该书签的现有标签，平台会自动处理标签的关联与创建
- 标签处理规则同create_bookmark：已存在的标签自动关联，不存在的标签自动创建，无需提前调用create_tag`,
    inputSchema: {
      scope: scopeSchema,
      id: z.string().describe("书签 ID（必填）"),
      title: z.string().optional().describe("新标题，禁止直接使用URL作为标题"),
      url: z.string().optional().describe("新网址"),
      description: z.string().optional().describe("新描述，概括核心价值，100字以内"),
      favicon: z.string().optional().describe("新图标 URL"),
      isFavorite: z.boolean().optional().describe("是否收藏"),
      isVisible: z.boolean().optional().describe("是否可见"),
      tagNames: z
        .array(z.string())
        .optional()
        .describe("标签名数组（建议1-3个），会完全重设该书签的标签，不存在的标签会自动创建；若用户明确要求不要标签可传空数组"),
    },
  },
  async ({ scope, id, ...rest }) => {
    try {
      const data = await httpClient.patch(
        `/api/v1/bookmarks/${encodeURIComponent(id)}`,
        { scope, ...rest },
      );
      return ok(data);
    } catch (error) {
      return fail(error);
    }
  },
);

// 4. delete_bookmarks（破坏性）
server.registerTool(
  "delete_bookmarks",
  {
    title: "删除书签",
    description:
      "删除书签（软删除到回收站，可恢复）。这是破坏性操作，建议客户端在执行前向用户确认。传入书签 ID 数组。",
    inputSchema: {
      scope: scopeSchema,
      ids: z.array(z.string()).min(1).describe("要删除的书签 ID 数组（必填）"),
    },
    annotations: { destructiveHint: true },
  },
  async ({ scope, ids }) => {
    try {
      const data = await httpClient.del("/api/v1/bookmarks", { scope, ids });
      return ok(data);
    } catch (error) {
      return fail(error);
    }
  },
);

// 5. list_tags
server.registerTool(
  "list_tags",
  {
    title: "列出标签",
    description: "列出所有标签及每个标签下的书签计数。",
    inputSchema: {
      scope: scopeSchema,
    },
    annotations: { readOnlyHint: true },
  },
  async ({ scope }) => {
    try {
      const data = await httpClient.get("/api/v1/tags", { scope });
      return ok(data);
    } catch (error) {
      return fail(error);
    }
  },
);

// 6. create_tag
server.registerTool(
  "create_tag",
  {
    title: "创建标签",
    description: "创建标签。重名会返回冲突错误（TAG 重名 409）。",
    inputSchema: {
      scope: scopeSchema,
      name: z.string().describe("标签名（必填）"),
      color: z.string().optional().describe("标签颜色"),
      description: z.string().optional().describe("标签描述"),
    },
  },
  async ({ scope, name, color, description }) => {
    try {
      const data = await httpClient.post("/api/v1/tags", {
        scope,
        name,
        color,
        description,
      });
      return ok(data);
    } catch (error) {
      return fail(error);
    }
  },
);

// 7. update_tag
server.registerTool(
  "update_tag",
  {
    title: "更新标签",
    description: "更新标签的名称/颜色/描述。",
    inputSchema: {
      scope: scopeSchema,
      id: z.string().describe("标签 ID（必填）"),
      name: z.string().optional().describe("新标签名"),
      color: z.string().optional().describe("新颜色"),
      description: z.string().optional().describe("新描述"),
    },
  },
  async ({ scope, id, name, color, description }) => {
    try {
      const data = await httpClient.patch(
        `/api/v1/tags/${encodeURIComponent(id)}`,
        { scope, name, color, description },
      );
      return ok(data);
    } catch (error) {
      return fail(error);
    }
  },
);

// 8. delete_tag（破坏性）
server.registerTool(
  "delete_tag",
  {
    title: "删除标签",
    description:
      "删除标签。这是破坏性操作，建议客户端在执行前向用户确认。删除后书签与该标签的关联会一并移除。",
    inputSchema: {
      scope: scopeSchema,
      id: z.string().describe("标签 ID（必填）"),
    },
    annotations: { destructiveHint: true },
  },
  async ({ scope, id }) => {
    try {
      const data = await httpClient.del(
        `/api/v1/tags/${encodeURIComponent(id)}`,
        undefined,
        { scope },
      );
      return ok(data);
    } catch (error) {
      return fail(error);
    }
  },
);

// 9. fetch_url_metadata
server.registerTool(
  "fetch_url_metadata",
  {
    title: "抓取 URL 元数据（兜底工具）",
    description:
`【兜底工具！仅允许在以下场景调用】
1. 你自身完全无法分析该URL的内容与元数据
2. 调用create_bookmark前自身分析失败，需要获取基础元数据补充
3. 禁止优先调用本工具，必须先尝试自身分析能力

### 调用后要求
调用本工具获取到元数据后，**不能直接使用返回的原始数据调用create_bookmark**，你必须：
1. 对返回的标题进行优化和修正，确保准确反映网页内容
2. 结合你自身的知识补充完善内容描述，确保描述清晰准确
3. 基于网页内容生成1-3个高质量的分类标签（用户有明确要求的除外），禁止直接使用返回的关键词作为标签
4. 补全所有必填信息后，再调用create_bookmark工具

从URL抓取标题/描述/图标，返回基础元数据用于补充书签信息。`,
    inputSchema: {
      url: z.string().describe("要抓取元数据的网址（必填）"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ url }) => {
    try {
      const data = await httpClient.post("/api/v1/url-metadata", { url });
      return ok(data);
    } catch (error) {
      return fail(error);
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(
    `[bookmark-lite-mcp] MCP Server 已启动（stdio 传输），连接平台 ${config.baseUrl}，等待客户端连接。\n`,
  );
}

main().catch((error) => {
  process.stderr.write(
    `[bookmark-lite-mcp] 启动失败：${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
