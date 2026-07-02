import { requireApiTokenUser } from "@/server/auth/api-token-guard";
import { bookmarkService } from "@/server/services/bookmark.service";
import { AppError } from "@/server/types/errors";
import { successResponse, errorResponse } from "@/app/api/v1/_lib";
import { dataScopeSchema } from "@/server/validators/bookmark.schema";
import type { DataScope } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  scope: dataScopeSchema.default("USER"),
  title: z.string().trim().min(1).max(300).optional(),
  url: z.string().trim().optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  favicon: z.string().url().max(1000).optional().or(z.literal("")),
  isFavorite: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  tagNames: z.array(z.string().trim().min(1).max(80)).optional(),
});

/**
 * 更新书签（v1 REST）
 *
 * @description Bearer Token 鉴权，从路径取 id，复用 bookmarkService.update
 * @param request - HTTP 请求
 * @param context - 路由上下文，params 为异步对象
 * @returns 统一信封响应
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireApiTokenUser(request);
    const { id } = await params;

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "书签更新参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    await bookmarkService.update(
      {
        id,
        scope: parsed.data.scope as DataScope,
        title: parsed.data.title,
        url: parsed.data.url,
        description: parsed.data.description,
        favicon: parsed.data.favicon,
        isFavorite: parsed.data.isFavorite,
        isVisible: parsed.data.isVisible,
        tagNames: parsed.data.tagNames,
      },
      user,
    );

    return successResponse({ id }, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "更新书签失败");
  }
}
