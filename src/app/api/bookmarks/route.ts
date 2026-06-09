import { getSessionUser } from "@/server/auth/session";
import { bookmarkService } from "@/server/services/bookmark.service";
import { AppError, isAppError } from "@/server/types/errors";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { DataScope } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  scope: z.enum(["APP", "USER"]).default("APP"),
  q: z.string().trim().max(200).optional(),
  tagId: z.string().uuid().optional(),
  view: z
    .enum(["all", "favorites", "untagged", "recent_added", "recent_visited"])
    .default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
});

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const searchParams = new URL(request.url).searchParams;
    const parsed = querySchema.safeParse({
      scope: searchParams.get("scope") ?? "APP",
      q: searchParams.get("q") ?? undefined,
      tagId: searchParams.get("tagId") ?? undefined,
      view: searchParams.get("view") ?? "all",
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

    const user = await getSessionUser();
    const data = await bookmarkService.list({
      scope: parsed.data.scope as DataScope,
      user,
      query: {
        q: parsed.data.q,
        tagId: parsed.data.tagId,
        view: parsed.data.view,
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
      },
    });

    return Response.json({
      ok: true,
      data,
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
          message: "获取书签列表失败",
        },
        requestId,
      },
      { status: 500 },
    );
  }
}
