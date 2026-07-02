#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
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
      "收藏一个网址到书签库。若 URL 已存在会返回 alreadyExists:true。标签用标签名数组传入（tagNames），不存在的标签会自动创建。",
    inputSchema: {
      scope: scopeSchema,
      url: z.string().describe("要收藏的网址（必填）"),
      title: z.string().optional().describe("标题，缺省时自动回退为 URL host"),
      description: z.string().optional().describe("描述"),
      favicon: z.string().optional().describe("图标 URL"),
      tagNames: z.array(z.string()).optional().describe("标签名数组，用名称而非 ID"),
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
      "更新书签，可修改标题/URL/描述/图标、切换收藏(isFavorite)与可见(isVisible)状态，或用 tagNames 重设标签（传入的标签名数组会完全替换现有标签）。",
    inputSchema: {
      scope: scopeSchema,
      id: z.string().describe("书签 ID（必填）"),
      title: z.string().optional().describe("新标题"),
      url: z.string().optional().describe("新网址"),
      description: z.string().optional().describe("新描述"),
      favicon: z.string().optional().describe("新图标 URL"),
      isFavorite: z.boolean().optional().describe("是否收藏"),
      isVisible: z.boolean().optional().describe("是否可见"),
      tagNames: z
        .array(z.string())
        .optional()
        .describe("标签名数组，会完全重设该书签的标签"),
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
    title: "抓取 URL 元数据",
    description:
      "从 URL 抓取标题/描述/图标。注意：AI 应优先依靠自身能力分析 URL 获取元数据，仅当自身无法获取时才调用此兜底工具。",
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
  process.stderr.write("[bookmark-lite-mcp] MCP Server 已启动（stdio 传输），等待客户端连接。\n");
}

main().catch((error) => {
  process.stderr.write(
    `[bookmark-lite-mcp] 启动失败：${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
