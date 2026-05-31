import type { SessionUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { assertCanManageScope } from "@/server/guard/authorize";
import { resolveScopeContext } from "@/server/guard/scope";
import { auditRepo } from "@/server/repositories/audit.repo";
import { bookmarkRepo } from "@/server/repositories/bookmark.repo";
import { tagRepo } from "@/server/repositories/tag.repo";
import { trashRepo } from "@/server/repositories/trash.repo";
import { AppError } from "@/server/types/errors";
import type { DataScope } from "@prisma/client";

type TrashBookmarkPayload = {
  bookmark: {
    title: string;
    url: string;
    normalizedUrl: string;
    description?: string | null;
    isFavorite?: boolean;
    isPinned?: boolean;
    isVisible?: boolean;
    lastVisitedAt?: string | Date | null;
  };
  tagIds: string[];
};

function parsePayload(payload: unknown): TrashBookmarkPayload {
  if (!payload || typeof payload !== "object") {
    throw new AppError("INTERNAL_ERROR", "回收站数据损坏", 500);
  }
  const typed = payload as TrashBookmarkPayload;
  if (!typed.bookmark || !typed.bookmark.url || !typed.bookmark.title) {
    throw new AppError("INTERNAL_ERROR", "回收站书签快照不完整", 500);
  }
  return typed;
}

export const trashService = {
  async list(scope: DataScope, user: SessionUser | null) {
    assertCanManageScope(scope, user);
    const scopeCtx = resolveScopeContext(scope, user?.id);
    return trashRepo.list(scopeCtx.scope, scopeCtx.ownerUserId);
  },

  async restore(ids: string[], scope: DataScope, user: SessionUser | null) {
    assertCanManageScope(scope, user);
    const scopeCtx = resolveScopeContext(scope, user?.id);
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) {
      return { restored: 0 };
    }

    const items = await trashRepo.findByIds(uniqueIds, scopeCtx.scope, scopeCtx.ownerUserId);
    if (items.length === 0) {
      return { restored: 0 };
    }

    const touchedTagIds = new Set<string>();
    let restoredCount = 0;
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const payload = parsePayload(item.payload);
        const duplicate = await bookmarkRepo.findByNormalizedUrl(
          scopeCtx.scopeOwnerKey,
          payload.bookmark.normalizedUrl,
        );
        if (duplicate) {
          continue;
        }

        const bookmark = await tx.bookmark.create({
          data: {
            scope: scopeCtx.scope,
            ownerUserId: scopeCtx.ownerUserId,
            scopeOwnerKey: scopeCtx.scopeOwnerKey,
            title: payload.bookmark.title,
            url: payload.bookmark.url,
            normalizedUrl: payload.bookmark.normalizedUrl,
            description: payload.bookmark.description ?? null,
            isFavorite: payload.bookmark.isFavorite ?? false,
            isPinned: payload.bookmark.isPinned ?? false,
            isVisible: payload.bookmark.isVisible ?? true,
            lastVisitedAt: payload.bookmark.lastVisitedAt
              ? new Date(payload.bookmark.lastVisitedAt)
              : null,
          },
        });

        const tagIds = payload.tagIds ?? [];
        const existingTags = await tx.tag.findMany({
          where: {
            id: { in: tagIds },
            scope: scopeCtx.scope,
            ownerUserId: scopeCtx.ownerUserId,
          },
        });
        if (existingTags.length > 0) {
          await tx.bookmarkTag.createMany({
            data: existingTags.map((tag) => ({
              bookmarkId: bookmark.id,
              tagId: tag.id,
            })),
            skipDuplicates: true,
          });
          existingTags.forEach((tag) => touchedTagIds.add(tag.id));
        }

        await tx.trashItem.delete({
          where: { id: item.id },
        });
        restoredCount += 1;
      }
    });

    await tagRepo.refreshBookmarkCount([...touchedTagIds]);
    await auditRepo.create({
      userId: user?.id ?? null,
      role: user?.role ?? null,
      action: "TRASH_RESTORE",
      targetType: "BOOKMARK",
      targetId: uniqueIds.join(","),
      scope,
      status: "SUCCESS",
    });

    return { restored: restoredCount };
  },

  async deleteForever(ids: string[], scope: DataScope, user: SessionUser | null) {
    assertCanManageScope(scope, user);
    const scopeCtx = resolveScopeContext(scope, user?.id);
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) {
      return { deleted: 0 };
    }

    const result = await prisma.trashItem.deleteMany({
      where: {
        id: { in: uniqueIds },
        scope: scopeCtx.scope,
        ownerUserId: scopeCtx.ownerUserId,
      },
    });

    await auditRepo.create({
      userId: user?.id ?? null,
      role: user?.role ?? null,
      action: "TRASH_DELETE_FOREVER",
      targetType: "BOOKMARK",
      targetId: uniqueIds.join(","),
      scope,
      status: "SUCCESS",
    });

    return { deleted: result.count };
  },

  async clear(scope: DataScope, user: SessionUser | null) {
    assertCanManageScope(scope, user);
    const scopeCtx = resolveScopeContext(scope, user?.id);
    const result = await prisma.trashItem.deleteMany({
      where: {
        scope: scopeCtx.scope,
        ownerUserId: scopeCtx.ownerUserId,
      },
    });

    await auditRepo.create({
      userId: user?.id ?? null,
      role: user?.role ?? null,
      action: "TRASH_CLEAR",
      targetType: "BOOKMARK",
      targetId: scopeCtx.scope,
      scope,
      status: "SUCCESS",
    });

    return { deleted: result.count };
  },
};
