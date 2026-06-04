import { normalizeUrl } from "@/lib/url-normalize";
import type { SessionUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { assertCanManageScope, assertCanReadScope } from "@/server/guard/authorize";
import { resolveScopeContext } from "@/server/guard/scope";
import { auditRepo } from "@/server/repositories/audit.repo";
import { bookmarkRepo } from "@/server/repositories/bookmark.repo";
import { tagRepo } from "@/server/repositories/tag.repo";
import { AppError } from "@/server/types/errors";
import {
  bookmarkCreateSchema,
  bookmarkQuerySchema,
  bookmarkUpdateSchema,
} from "@/server/validators/bookmark.schema";
import type { DataScope, Prisma } from "@prisma/client";

type ListArgs = {
  scope: DataScope;
  user: SessionUser | null;
  query?: Partial<{
    includeHidden: boolean;
    q: string;
    tagId: string;
    view: "all" | "favorites" | "untagged" | "recent_added" | "recent_visited" | "pinned";
    sort:
      | "default"
      | "created_desc"
      | "created_asc"
      | "updated_desc"
      | "visited_desc"
      | "title_asc"
      | "title_desc";
    page: number;
    pageSize: number;
  }>;
};

function ensureBookmarkOwner(
  bookmark: { scope: DataScope; ownerUserId: string | null },
  scope: DataScope,
  ownerUserId: string | null,
) {
  if (bookmark.scope !== scope || bookmark.ownerUserId !== ownerUserId) {
    throw new AppError("SCOPE_MISMATCH", "书签与当前数据域不匹配", 403);
  }
}

async function findOrCreateTagsInTx(
  tx: Prisma.TransactionClient,
  scope: DataScope,
  ownerUserId: string | null,
  scopeOwnerKey: string,
  names: string[],
) {
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  const tags = await Promise.all(
    uniqueNames.map(async (name, index) => {
      const existing = await tx.tag.findUnique({
        where: {
          scopeOwnerKey_name: {
            scopeOwnerKey,
            name,
          },
        },
      });
      if (existing) {
        return existing;
      }
      return tx.tag.create({
        data: {
          scope,
          ownerUserId,
          scopeOwnerKey,
          name,
          sortOrder: index,
        },
      });
    }),
  );

  return tags;
}

export const bookmarkService = {
  async list(args: ListArgs) {
    assertCanReadScope(args.scope, args.user);
    const ownerUserId = args.scope === "USER" ? args.user?.id ?? null : null;
    const canIncludeHidden =
      args.query?.includeHidden === true &&
      (args.scope === "USER"
        ? !!args.user
        : args.user?.role === "super_admin");

    const parsed = bookmarkQuerySchema.parse({
      ...args.query,
    });
    const result = await bookmarkRepo.list({
      scope: args.scope,
      ownerUserId,
      includeHidden: canIncludeHidden,
      q: parsed.q,
      tagId: parsed.tagId,
      view: parsed.view,
      sort: parsed.sort,
      page: parsed.page,
      pageSize: parsed.pageSize,
    });

    return {
      items: result.items.map((bookmark) => ({
        ...bookmark,
        tags: bookmark.bookmarkTags.map((item) => item.tag),
      })),
      pagination: {
        page: parsed.page,
        pageSize: parsed.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / parsed.pageSize)),
      },
    };
  },

  async create(input: unknown, user: SessionUser | null) {
    const parsed = bookmarkCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "书签参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }
    assertCanManageScope(parsed.data.scope, user);
    const scopeCtx = resolveScopeContext(parsed.data.scope, user?.id);
    const normalizedUrl = normalizeUrl(parsed.data.url);

    const duplicate = await bookmarkRepo.findByNormalizedUrl(
      scopeCtx.scopeOwnerKey,
      normalizedUrl,
    );
    if (duplicate) {
      throw new AppError("BOOKMARK_DUPLICATE_URL", "该 URL 已存在", 409);
    }

    const created = await prisma.$transaction(async (tx) => {
      const tags = await findOrCreateTagsInTx(
        tx,
        scopeCtx.scope,
        scopeCtx.ownerUserId,
        scopeCtx.scopeOwnerKey,
        parsed.data.tagNames,
      );

      const bookmark = await tx.bookmark.create({
        data: {
          scope: scopeCtx.scope,
          ownerUserId: scopeCtx.ownerUserId,
          scopeOwnerKey: scopeCtx.scopeOwnerKey,
          title: parsed.data.title,
          url: parsed.data.url,
          normalizedUrl,
          description: parsed.data.description || null,
        },
      });

      if (tags.length > 0) {
        await tx.bookmarkTag.createMany({
          data: tags.map((tag) => ({
            bookmarkId: bookmark.id,
            tagId: tag.id,
          })),
          skipDuplicates: true,
        });
      }

      return { bookmark, tagIds: tags.map((tag) => tag.id) };
    });

    await tagRepo.refreshBookmarkCount(created.tagIds);
    await auditRepo.create({
      userId: user?.id ?? null,
      role: user?.role ?? null,
      action: "BOOKMARK_CREATE",
      targetType: "BOOKMARK",
      targetId: created.bookmark.id,
      scope: parsed.data.scope,
      status: "SUCCESS",
    });

    return created.bookmark;
  },

  async update(input: unknown, user: SessionUser | null) {
    const parsed = bookmarkUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "书签更新参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }
    assertCanManageScope(parsed.data.scope, user);
    const scopeCtx = resolveScopeContext(parsed.data.scope, user?.id);

    const existing = await prisma.bookmark.findUnique({
      where: { id: parsed.data.id },
      include: {
        bookmarkTags: true,
      },
    });
    if (!existing) {
      throw new AppError("RESOURCE_NOT_FOUND", "书签不存在", 404);
    }
    ensureBookmarkOwner(existing, scopeCtx.scope, scopeCtx.ownerUserId);

    const data: Prisma.BookmarkUpdateInput = {};
    let normalizedUrl: string | undefined;
    if (typeof parsed.data.url === "string" && parsed.data.url.trim()) {
      normalizedUrl = normalizeUrl(parsed.data.url);
      const duplicate = await bookmarkRepo.findByNormalizedUrl(
        scopeCtx.scopeOwnerKey,
        normalizedUrl,
      );
      if (duplicate && duplicate.id !== existing.id) {
        throw new AppError("BOOKMARK_DUPLICATE_URL", "该 URL 已存在", 409);
      }
      data.url = parsed.data.url;
      data.normalizedUrl = normalizedUrl;
    }
    if (typeof parsed.data.title === "string") {
      data.title = parsed.data.title;
    }
    if (typeof parsed.data.description === "string") {
      data.description = parsed.data.description || null;
    }
    if (typeof parsed.data.isFavorite === "boolean") {
      data.isFavorite = parsed.data.isFavorite;
    }
    if (typeof parsed.data.isPinned === "boolean") {
      data.isPinned = parsed.data.isPinned;
    }
    if (typeof parsed.data.isVisible === "boolean") {
      data.isVisible = parsed.data.isVisible;
    }

    const touchedTagIds = new Set(existing.bookmarkTags.map((item) => item.tagId));
    await prisma.$transaction(async (tx) => {
      await tx.bookmark.update({
        where: { id: existing.id },
        data,
      });

      if (parsed.data.tagNames) {
        await tx.bookmarkTag.deleteMany({
          where: { bookmarkId: existing.id },
        });
        const tags = await findOrCreateTagsInTx(
          tx,
          scopeCtx.scope,
          scopeCtx.ownerUserId,
          scopeCtx.scopeOwnerKey,
          parsed.data.tagNames,
        );
        if (tags.length > 0) {
          await tx.bookmarkTag.createMany({
            data: tags.map((tag) => ({
              bookmarkId: existing.id,
              tagId: tag.id,
            })),
            skipDuplicates: true,
          });
          tags.forEach((tag) => touchedTagIds.add(tag.id));
        }
      }
    });

    await tagRepo.refreshBookmarkCount([...touchedTagIds]);

    await auditRepo.create({
      userId: user?.id ?? null,
      role: user?.role ?? null,
      action: "BOOKMARK_UPDATE",
      targetType: "BOOKMARK",
      targetId: existing.id,
      scope: scopeCtx.scope,
      status: "SUCCESS",
    });
  },

  async deleteMany(ids: string[], scope: DataScope, user: SessionUser | null) {
    assertCanManageScope(scope, user);
    const scopeCtx = resolveScopeContext(scope, user?.id);
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length === 0) {
      return { success: 0 };
    }

    const touchedTagIds = new Set<string>();
    const deleted = await prisma.$transaction(async (tx) => {
      const bookmarks = await tx.bookmark.findMany({
        where: {
          id: { in: uniqueIds },
          scope: scopeCtx.scope,
          ownerUserId: scopeCtx.ownerUserId,
        },
        include: {
          bookmarkTags: true,
        },
      });

      if (bookmarks.length === 0) {
        return 0;
      }

      const settingsDefault = await tx.systemDefaultSetting.upsert({
        where: { id: 1 },
        create: { id: 1 },
        update: {},
      });
      const retentionDays = settingsDefault.trashRetentionDays;

      for (const bookmark of bookmarks) {
        bookmark.bookmarkTags.forEach((item) => touchedTagIds.add(item.tagId));
        await tx.trashItem.create({
          data: {
            scope: bookmark.scope,
            ownerUserId: bookmark.ownerUserId,
            objectType: "BOOKMARK",
            objectId: bookmark.id,
            deletedByUserId: user?.id ?? null,
            expiresAt: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000),
            payload: {
              bookmark: {
                title: bookmark.title,
                url: bookmark.url,
                normalizedUrl: bookmark.normalizedUrl,
                description: bookmark.description,
                isFavorite: bookmark.isFavorite,
                isPinned: bookmark.isPinned,
                isVisible: bookmark.isVisible,
                lastVisitedAt: bookmark.lastVisitedAt,
              },
              tagIds: bookmark.bookmarkTags.map((item) => item.tagId),
            },
          },
        });
      }

      await tx.bookmark.deleteMany({
        where: { id: { in: bookmarks.map((bookmark) => bookmark.id) } },
      });
      return bookmarks.length;
    });

    await tagRepo.refreshBookmarkCount([...touchedTagIds]);

    await auditRepo.create({
      userId: user?.id ?? null,
      role: user?.role ?? null,
      action: "BOOKMARK_DELETE",
      targetType: "BOOKMARK",
      targetId: uniqueIds.join(","),
      scope,
      status: "SUCCESS",
    });

    return { success: deleted };
  },

  async saveAppBookmarkToUser(
    bookmarkId: string,
    user: SessionUser | null,
    tagNames: string[] = [],
  ) {
    if (!user) {
      throw new AppError("AUTH_REQUIRED", "请先登录后保存到个人库", 401);
    }

    const appBookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    });

    if (!appBookmark || appBookmark.scope !== "APP") {
      throw new AppError("RESOURCE_NOT_FOUND", "应用公开书签不存在", 404);
    }

    const scopeCtx = resolveScopeContext("USER", user.id);
    const duplicate = await bookmarkRepo.findByNormalizedUrl(
      scopeCtx.scopeOwnerKey,
      appBookmark.normalizedUrl,
    );
    if (duplicate) {
      throw new AppError(
        "BOOKMARK_DUPLICATE_URL",
        "个人书签库中已存在该 URL，未重复创建",
        409,
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const tags = await findOrCreateTagsInTx(
        tx,
        "USER",
        user.id,
        user.id,
        tagNames,
      );
      const copied = await tx.bookmark.create({
        data: {
          scope: "USER",
          ownerUserId: user.id,
          scopeOwnerKey: user.id,
          title: appBookmark.title,
          url: appBookmark.url,
          normalizedUrl: appBookmark.normalizedUrl,
          description: appBookmark.description,
          isFavorite: false,
          isPinned: false,
          isVisible: true,
        },
      });

      if (tags.length > 0) {
        await tx.bookmarkTag.createMany({
          data: tags.map((tag) => ({
            bookmarkId: copied.id,
            tagId: tag.id,
          })),
          skipDuplicates: true,
        });
      }

      return {
        bookmark: copied,
        tagIds: tags.map((tag) => tag.id),
      };
    });

    await tagRepo.refreshBookmarkCount(created.tagIds);
    await auditRepo.create({
      userId: user.id,
      role: user.role,
      action: "BOOKMARK_COPY_APP_TO_USER",
      targetType: "BOOKMARK",
      targetId: created.bookmark.id,
      scope: "USER",
      status: "SUCCESS",
    });
    return created.bookmark;
  },
};
