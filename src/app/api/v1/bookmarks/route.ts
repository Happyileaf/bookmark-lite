import { requireApiTokenUser } from "@/server/auth/api-token-guard";
import { bookmarkService } from "@/server/services/bookmark.service";
import { AppError, isAppError } from "@/server/types/errors";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { dataScopeSchema } from "@/server/validators/bookmark.schema";
import type { DataScope } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  scope: dataScopeSchema.default("USER"),
  q: z.string().trim().max(200).optional(),
  tagId: z.string().uuid().optional(),
  view: z
    .enum(["all", "favorites", "untagged", "recent_added", "recent_visited"])
    .default("all"),
  sort: z
    .enum([
      "default",
      "created_desc",
      "created_asc",
      "updated_desc",
      "visited_desc",
      "title_asc",
      "title_desc",
    ])
    .default("default"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
});

const createSchema = z.object({
  scope: dataScopeSchema.default("USER"),
  url: z.string().trim().min(1, "URL 不能为空"),
  title: z.string().trim().max(300, "标题长度不能超过 300").optional(),
  description: z
    .string()
    .trim()
    .max(2000, "描述长度不能超过 2000")
    .optional()
    .or(z.literal("")),
  favicon: z.string().url().max(1000).optional().or(z.literal("")),
  tagNames: z.array(z.string().trim().min(1).max(80)).default([]),
});

const deleteSchema = z.object({
  scope: dataScopeSchema.default("USER"),
  ids: z.array(z.string().uuid()).min(1, "ids 不能为空"),
});

function successResponse(data: unknown, requestId: string, status = 200) {
  return Response.json({ ok: true, data, requestId }, { status });
}

function errorResponse(error: unknown, requestId: string, fallbackMessage: string) {
  if (isAppError(error)) {
    return Response.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          fieldErrors: error.fieldErrors,
        },
        requestId,
      },
      { status: error.status },
    );
  }

  return Response.json(
    {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: fallbackMessage },
      requestId,
    },
    { status: 500 },
  );
}

/**
 * 查询书签列表（v1 REST）
 *
 * @description Bearer Token 鉴权，复用 bookmarkService.list；scope 默认 USER
 * @param request - HTTP 请求
 * @returns 统一信封响应
 */
export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireApiTokenUser(request);

    const searchParams = new URL(request.url).searchParams;
    const parsed = querySchema.safeParse({
      scope: searchParams.get("scope") ?? "USER",
      q: searchParams.get("q") ?? undefined,
      tagId: searchParams.get("tagId") ?? undefined,
      view: searchParams.get("view") ?? "all",
      sort: searchParams.get("sort") ?? "default",
      page: searchParams.get("page") ?? "1",
      pageSize: searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE),
    });

    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "查询参数不正确",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const data = await bookmarkService.list({
      scope: parsed.data.scope as DataScope,
      user,
      query: {
        q: parsed.data.q,
        tagId: parsed.data.tagId,
        view: parsed.data.view,
        sort: parsed.data.sort,
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
      },
    });

    return successResponse(data, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "获取书签列表失败");
  }
}

/**
 * 创建书签（v1 REST）
 *
 * @description Bearer Token 鉴权，复用 bookmarkService.create；title 缺省时回退为 URL host；
 * URL 重复（BOOKMARK_DUPLICATE_URL）转换为 200 + alreadyExists
 * @param request - HTTP 请求
 * @returns 统一信封响应
 */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireApiTokenUser(request);

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "书签参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    // title 缺省时回退为 URL host，保证非空
    const title =
      parsed.data.title ||
      (() => {
        try {
          return new URL(parsed.data.url).host;
        } catch {
          return parsed.data.url.slice(0, 300);
        }
      })();

    try {
      const bookmark = await bookmarkService.create(
        {
          scope: parsed.data.scope,
          title,
          url: parsed.data.url,
          description: parsed.data.description || "",
          favicon: parsed.data.favicon || "",
          tagNames: parsed.data.tagNames,
        },
        user,
      );
      return successResponse(
        { id: bookmark.id, alreadyExists: false },
        requestId,
      );
    } catch (error) {
      // 去重命中：转换为已存在语义
      if (isAppError(error) && error.code === "BOOKMARK_DUPLICATE_URL") {
        return successResponse({ alreadyExists: true }, requestId);
      }
      throw error;
    }
  } catch (error) {
    return errorResponse(error, requestId, "创建书签失败");
  }
}

/**
 * 批量删除书签（v1 REST）
 *
 * @description Bearer Token 鉴权，复用 bookmarkService.deleteMany
 * @param request - HTTP 请求
 * @returns 统一信封响应
 */
export async function DELETE(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireApiTokenUser(request);

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "删除参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const data = await bookmarkService.deleteMany(
      parsed.data.ids,
      parsed.data.scope as DataScope,
      user,
    );

    return successResponse(data, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "删除书签失败");
  }
}
