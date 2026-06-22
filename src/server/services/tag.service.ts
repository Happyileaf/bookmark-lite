import { prisma } from "@/server/db/prisma";
import { assertCanManageScope } from "@/server/guard/authorize";
import { resolveScopeContext } from "@/server/guard/scope";
import { tagRepo } from "@/server/repositories/tag.repo";
import type { SessionUser } from "@/server/auth/session";
import { tagQuerySchema, tagUpsertSchema } from "@/server/validators/tag.schema";
import type { DataScope } from "@prisma/client";
import { AppError } from "@/server/types/errors";

function ensureTagOwner(
  tag: { scope: DataScope; ownerUserId: string | null },
  scope: DataScope,
  ownerUserId: string | null,
) {
  if (tag.scope !== scope || tag.ownerUserId !== ownerUserId) {
    throw new AppError("SCOPE_MISMATCH", "标签与当前数据域不匹配", 403);
  }
}

export const tagService = {
  async list(scope: DataScope, user: SessionUser | null) {
    if (scope === "USER" && !user) {
      throw new AppError("AUTH_REQUIRED", "请先登录", 401);
    }
    const ownerUserId = scope === "USER" ? user?.id ?? null : null;
    return tagRepo.list(scope, ownerUserId);
  },

  async listPaged(
    scope: DataScope,
    user: SessionUser | null,
    query?: Partial<{ q: string; sort: string; page: number; pageSize: number }>,
  ) {
    if (scope === "USER" && !user) {
      throw new AppError("AUTH_REQUIRED", "请先登录", 401);
    }
    const ownerUserId = scope === "USER" ? user?.id ?? null : null;
    const parsed = tagQuerySchema.parse(query ?? {});
    const result = await tagRepo.listPaged({
      scope,
      ownerUserId,
      q: parsed.q,
      sort: parsed.sort as
        | "default"
        | "name_asc"
        | "name_desc"
        | "created_desc"
        | "created_asc"
        | "bookmark_count_desc"
        | "bookmark_count_asc",
      page: parsed.page,
      pageSize: parsed.pageSize,
    });

    return {
      items: result.items,
      pagination: {
        page: parsed.page,
        pageSize: parsed.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / parsed.pageSize)),
      },
    };
  },

  async upsert(input: unknown, user: SessionUser | null) {
    const parsed = tagUpsertSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "标签参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    assertCanManageScope(parsed.data.scope, user);
    const scopeCtx = resolveScopeContext(parsed.data.scope, user?.id);

    if (parsed.data.id) {
      const existing = await prisma.tag.findUnique({ where: { id: parsed.data.id } });
      if (!existing) {
        throw new AppError("RESOURCE_NOT_FOUND", "标签不存在", 404);
      }
      ensureTagOwner(existing, scopeCtx.scope, scopeCtx.ownerUserId);
      return prisma.tag.update({
        where: { id: existing.id },
        data: {
          name: parsed.data.name,
          color: parsed.data.color || null,
          description: parsed.data.description || null,
        },
      });
    }

    const duplicate = await tagRepo.findByName(scopeCtx.scopeOwnerKey, parsed.data.name);
    if (duplicate) {
      throw new AppError("TAG_DUPLICATE_NAME", "同范围标签名称重复", 409);
    }

    return prisma.tag.create({
      data: {
        scope: scopeCtx.scope,
        ownerUserId: scopeCtx.ownerUserId,
        scopeOwnerKey: scopeCtx.scopeOwnerKey,
        name: parsed.data.name,
        color: parsed.data.color || null,
        description: parsed.data.description || null,
      },
    });
  },

  async delete(id: string, scope: DataScope, user: SessionUser | null) {
    assertCanManageScope(scope, user);
    const scopeCtx = resolveScopeContext(scope, user?.id);

    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new AppError("RESOURCE_NOT_FOUND", "标签不存在", 404);
    }
    ensureTagOwner(tag, scopeCtx.scope, scopeCtx.ownerUserId);

    await prisma.$transaction(async (tx) => {
      await tx.tag.delete({
        where: { id: tag.id },
      });
    });
  },
};
