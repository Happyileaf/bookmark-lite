import { AppError, isAppError } from "@/server/types/errors";

export function successResponse(data: unknown, requestId: string, status = 200) {
  return Response.json({ ok: true, data, requestId }, { status });
}

export function errorResponse(error: unknown, requestId: string, fallbackMessage: string) {
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

export { AppError };
