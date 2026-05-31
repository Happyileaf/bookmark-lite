import { getSessionUser } from "@/server/auth/session";
import { assertCanManageScope } from "@/server/guard/authorize";
import { importService } from "@/server/services/import.service";
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

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get("scope") ?? "USER").toUpperCase() as DataScope;
    if (!["APP", "USER"].includes(scope)) {
      throw new AppError("VALIDATION_FAILED", "scope 参数不正确", 422);
    }

    const user = await getSessionUser();
    assertCanManageScope(scope, user);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new AppError("VALIDATION_FAILED", "请上传导入文件", 422);
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new AppError("IMPORT_TOO_LARGE", "导入文件大小不能超过 10MB", 413);
    }

    const records = importService.parse(file.name, await file.text());
    const data = await importService.importBookmarks(scope, user, records);
    return json({ ok: true, data }, 200, requestId);
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
          message: "导入失败，请稍后再试",
        },
      },
      500,
      requestId,
    );
  }
}
