import { bookmarkService } from "@/server/services/bookmark.service";
import { AppError, isAppError } from "@/server/types/errors";
import { bookmarkRandomQuerySchema } from "@/server/validators/bookmark.schema";

export const dynamic = "force-dynamic";

/**
 * 随机发现一批公共书签
 *
 * @description 无需登录即可调用，从公共库可见书签中随机返回一批（count 默认 15、
 * 上限 50），供「随机发现 / 再来一批」入口使用；exclude 传入最近已展示过的书签
 * ID（逗号分隔、去重后最多 30 个）使新一批优先出现未看过的书签，公共库为空时
 * items 返回空数组
 * @param request - HTTP 请求（可选查询参数 tagId、exclude、count）
 * @returns 统一信封响应，data.items 为书签对象数组（含标签），池为空时为空数组
 */
export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const searchParams = new URL(request.url).searchParams;
    /** exclude 为逗号分隔的书签 ID 列表，先拆分去重，再交给 zod 统一校验格式与数量上限 */
    const excludeRaw = searchParams.get("exclude");
    const excludeIds = excludeRaw
      ? [
          ...new Set(
            excludeRaw
              .split(",")
              .map((part) => part.trim())
              .filter(Boolean),
          ),
        ]
      : undefined;

    const parsed = bookmarkRandomQuerySchema.safeParse({
      tagId: searchParams.get("tagId") ?? undefined,
      exclude: excludeIds,
      count: searchParams.get("count") ?? undefined,
    });
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "查询参数不正确",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const items = await bookmarkService.getRandomList({
      tagId: parsed.data.tagId,
      excludeIds: parsed.data.exclude,
      count: parsed.data.count,
    });

    return Response.json({
      ok: true,
      data: { items },
      requestId,
    });
  } catch (error) {
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
        error: {
          code: "INTERNAL_ERROR",
          message: "获取随机书签失败",
        },
        requestId,
      },
      { status: 500 },
    );
  }
}
