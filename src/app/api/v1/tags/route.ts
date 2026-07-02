import { requireApiTokenUser } from "@/server/auth/api-token-guard";
import { tagService } from "@/server/services/tag.service";
import { AppError, isAppError } from "@/server/types/errors";
import type { DataScope } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  scope: z.enum(["APP", "USER"]).default("USER"),
});

const createSchema = z.object({
  scope: z.enum(["APP", "USER"]).default("USER"),
  name: z.string().trim().min(1, "标签名不能为空").max(80),
  color: z.string().trim().max(20).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireApiTokenUser(request);

    const searchParams = new URL(request.url).searchParams;
    const parsed = querySchema.safeParse({
      scope: searchParams.get("scope") ?? "USER",
    });

    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "查询参数不正确",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const data = await tagService.list(parsed.data.scope as DataScope, user);

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
          message: "获取标签列表失败",
        },
        requestId,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireApiTokenUser(request);

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "标签参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const data = await tagService.upsert(
      {
        scope: parsed.data.scope,
        name: parsed.data.name,
        color: parsed.data.color,
        description: parsed.data.description,
      },
      user,
    );

    return Response.json(
      {
        ok: true,
        data,
        requestId,
      },
      { status: 201 },
    );
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
          message: "创建标签失败",
        },
        requestId,
      },
      { status: 500 },
    );
  }
}
