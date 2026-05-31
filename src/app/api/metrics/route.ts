import { getSessionUser } from "@/server/auth/session";
import { metricsService } from "@/server/services/metrics.service";
import { AppError, isAppError } from "@/server/types/errors";
import type { DataScope, Prisma } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const metricSchema = z.object({
  eventName: z.string().trim().min(1).max(100),
  scope: z.enum(["APP", "USER"]).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    const parsed = metricSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "指标事件参数不正确",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }
    const user = await getSessionUser();
    await metricsService.track({
      eventName: parsed.data.eventName,
      userId: user?.id ?? null,
      scope: (parsed.data.scope as DataScope | undefined) ?? null,
      payload: (parsed.data.payload ?? null) as Prisma.InputJsonValue | undefined,
    });

    return Response.json({
      ok: true,
      data: { accepted: true },
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
          message: "指标写入失败",
        },
        requestId,
      },
      { status: 500 },
    );
  }
}
