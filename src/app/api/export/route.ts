import { getSessionUser } from "@/server/auth/session";
import { exportService } from "@/server/services/export.service";
import { AppError, isAppError } from "@/server/types/errors";
import type { DataScope } from "@prisma/client";

export const dynamic = "force-dynamic";

function json(
  payload: Record<string, unknown>,
  status = 200,
  requestId = crypto.randomUUID(),
): Response {
  return Response.json(
    {
      ...payload,
      requestId,
    },
    { status },
  );
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get("scope") ?? "USER").toUpperCase() as DataScope;
    if (!["APP", "USER"].includes(scope)) {
      throw new AppError("VALIDATION_FAILED", "scope 参数不正确", 422);
    }

    const format = (searchParams.get("format") ?? "json").toLowerCase();
    if (!["json", "csv", "html"].includes(format)) {
      throw new AppError("VALIDATION_FAILED", "format 参数不正确", 422);
    }

    const user = await getSessionUser();
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? undefined;
    const view = searchParams.get("view") ?? undefined;

    const bookmarks = await exportService.getBookmarks({
      scope,
      user,
      ids,
      view,
    });
    const { content, mime } = exportService.formatContent(
      format as "json" | "csv" | "html",
      bookmarks,
    );

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": `${mime}; charset=utf-8`,
        "Content-Disposition": `attachment; filename="bookmark-lite-export.${format}"`,
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      return json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            fieldErrors: error.fieldErrors,
          },
        },
        error.status,
        requestId,
      );
    }

    return json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "导出失败，请稍后再试",
        },
      },
      500,
      requestId,
    );
  }
}
