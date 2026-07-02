import { requireApiTokenUser } from "@/server/auth/api-token-guard";
import { tagService } from "@/server/services/tag.service";
import { AppError } from "@/server/types/errors";
import { successResponse, errorResponse } from "@/app/api/v1/_lib";
import type { DataScope } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  scope: z.enum(["APP", "USER"]).default("USER"),
  name: z.string().trim().min(1, "标签名不能为空").max(80).optional(),
  color: z.string().trim().max(20).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

const deleteSchema = z.object({
  scope: z.enum(["APP", "USER"]).default("USER"),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireApiTokenUser(request);
    const { id } = await params;

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
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
        id,
        scope: parsed.data.scope,
        name: parsed.data.name,
        color: parsed.data.color,
        description: parsed.data.description,
      },
      user,
    );

    return successResponse(data, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "更新标签失败");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireApiTokenUser(request);
    const { id } = await params;

    const searchParams = new URL(request.url).searchParams;
    let scopeInput = searchParams.get("scope") ?? undefined;
    if (!scopeInput) {
      const body = await request.json().catch(() => null);
      if (body && typeof body === "object" && "scope" in body) {
        scopeInput = (body as { scope?: string }).scope;
      }
    }

    const parsed = deleteSchema.safeParse({ scope: scopeInput ?? "USER" });
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "查询参数不正确",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    await tagService.delete(id, parsed.data.scope as DataScope, user);

    return successResponse({ id }, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "删除标签失败");
  }
}
