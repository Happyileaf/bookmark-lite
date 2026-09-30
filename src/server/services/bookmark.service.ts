import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics/constants";
import { BOOKMARK_VISIT_DEDUP_WINDOW_MS, DEFAULT_RANDOM_BATCH_SIZE } from "@/lib/constants";
import { normalizeUrl } from "@/lib/url-normalize";
import type { SessionUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { assertCanManageScope, assertCanReadScope } from "@/server/guard/authorize";
import { resolveScopeContext } from "@/server/guard/scope";
import { auditRepo } from "@/server/repositories/audit.repo";
import { bookmarkRepo } from "@/server/repositories/bookmark.repo";
import { tagRepo } from "@/server/repositories/tag.repo";
import { metricsService } from "@/server/services/metrics.service";
import { AppError } from "@/server/types/errors";
import {
  bookmarkCreateSchema,
  bookmarkQuerySchema,
  bookmarkUpdateSchema,
} from "@/server/validators/bookmark.schema";
import { randomInt } from "node:crypto";
import type { DataScope, Prisma } from "@prisma/client";

type ListArgs = {
  scope: DataScope;
  user: SessionUser | null;
  query?: Partial<{
    includeHidden: boolean;
    q: string;
    tagId: string;
    view:
      | "all"
      | "favorites"
      | "untagged"
      | "recent_added"
      | "recent_visited"
      | "hot"
      | "random";
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

/**
 * 原地洗牌书签 ID 数组
 *
 * @description Fisher-Yates 洗牌并以 node:crypto 的 randomInt 取随机下标，
 * 相比 Math.random 取模无模偏差，保证候选池内每个位置等概率；
 * 仅供 getRandomList 使用，池规模为轻量级（数百至数千），全量洗牌开销可忽略
 * @param ids - 待洗牌的 ID 数组（原地修改）
 */
function shuffleIds(ids: string[]) {
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
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
    /**
     * 随机发现由专用接口（getRandom）承接，列表查询中的 random 仅作防御性放行，
     * 归一化为 all 走普通列表，避免 repo 收到未定义语义的视图
     */
    const view = parsed.view === "random" ? "all" : parsed.view;
    const result = await bookmarkRepo.list({
      scope: args.scope,
      ownerUserId,
      includeHidden: canIncludeHidden,
      q: parsed.q,
      tagId: parsed.tagId,
      view,
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

  async countByView(args: { scope: DataScope; user: SessionUser | null }) {
    assertCanReadScope(args.scope, args.user);
    const ownerUserId = args.scope === "USER" ? args.user?.id ?? null : null;
    return bookmarkRepo.countByView({
      scope: args.scope,
      ownerUserId,
    });
  },

  /**
   * 记录公共书签访问事件（fire-and-forget）
   *
   * @description 热门书签统计的唯一数据来源。仅当书签为公共库可见书签
   * （scope=APP、ownerUserId=null、isVisible=true）时计入；非目标书签静默跳过，
   * 不抛错也不提示，避免暴露书签存在性。防刷规则：同一访客（visitorKey）对同一书签
   * 在 BOOKMARK_VISIT_DEDUP_WINDOW_MS 内最多计 1 次。刻意不更新书签 lastVisitedAt
   * （那是「最近访问」视图的排序依据，与热门统计解耦），也不写审计日志与埋点
   * @param input - 访问上报入参
   * @param input.bookmarkId - 被访问的书签 ID
   * @param input.userId - 当前登录用户 ID，匿名访问时为 null
   * @param input.visitorKey - 匿名访客标识（HttpOnly Cookie 中的 UUID）
   * @returns 无返回值（是否写入由调用方感知为无需关心）
   */
  async recordVisit(input: {
    bookmarkId: string;
    userId: string | null;
    visitorKey: string;
  }) {
    const bookmark = await bookmarkRepo.findById(input.bookmarkId);
    if (
      !bookmark ||
      bookmark.scope !== "APP" ||
      bookmark.ownerUserId !== null ||
      !bookmark.isVisible
    ) {
      return;
    }

    const hasRecentVisit = await bookmarkRepo.hasRecentVisit({
      bookmarkId: input.bookmarkId,
      visitorKey: input.visitorKey,
      since: new Date(Date.now() - BOOKMARK_VISIT_DEDUP_WINDOW_MS),
    });
    if (hasRecentVisit) {
      return;
    }

    await bookmarkRepo.createVisit({
      bookmarkId: input.bookmarkId,
      userId: input.userId,
      visitorKey: input.visitorKey,
    });
  },

  /**
   * 随机抽取一批公共书签
   *
   * @description 随机发现视图以列表形式一次展示一批（默认 DEFAULT_RANDOM_BATCH_SIZE 条）
   * 随机书签：候选池为公共库可见书签（scope=APP、ownerUserId=null、isVisible=true，
   * 可按标签限定），优先从最近未展示过（不在 excludeIds 中）的候选里等概率抽取，
   * 不足 count 时由最近展示过的候选补齐，兼顾「短时间内尽量不重复」与「批大小尽量凑满」；
   * 批内 ID 天然不重复，返回顺序即抽取顺序，池为空时返回空数组。
   * 洗牌使用 node:crypto 的 randomInt 而非 Math.random 取模，避免模偏差破坏等概率
   * @param input - 随机发现入参
   * @param input.tagId - 可选标签 ID，存在时候选池限定为挂有该标签的书签
   * @param input.excludeIds - 最近已展示过的书签 ID，作为「再来一批」的排除条件
   * @param input.count - 本批抽取数量，缺省为 DEFAULT_RANDOM_BATCH_SIZE
   * @returns 与 list 条目同构的书签对象数组（含 tags），候选池为空时返回空数组
   */
  async getRandomList(input: { tagId?: string; excludeIds?: string[]; count?: number }) {
    const candidates = await bookmarkRepo.listRandomCandidateIds(input.tagId);
    if (candidates.length === 0) {
      return [];
    }

    /**
     * 候选池按「是否最近展示过」分为两组并各自洗牌，拼接后取前 count 个：
     * 新面孔优先且组内等概率，不足 count 时自动由最近展示过的候选补齐，
     * 兼顾「短时间内尽量不重复」与「批大小尽量凑满」
     */
    const excludedIds = new Set(input.excludeIds ?? []);
    const freshIds: string[] = [];
    const shownIds: string[] = [];
    for (const candidate of candidates) {
      if (excludedIds.has(candidate.id)) {
        shownIds.push(candidate.id);
      } else {
        freshIds.push(candidate.id);
      }
    }
    shuffleIds(freshIds);
    shuffleIds(shownIds);

    const count = Math.min(input.count ?? DEFAULT_RANDOM_BATCH_SIZE, candidates.length);
    const pickedIds = [...freshIds, ...shownIds].slice(0, count);
    const bookmarks = await bookmarkRepo.listByIdsWithTags(pickedIds);

    /** findMany 不保序，按抽取顺序重排，保证列表首条即首个被抽中的书签 */
    const bookmarkById = new Map(bookmarks.map((bookmark) => [bookmark.id, bookmark]));
    return pickedIds.flatMap((id) => {
      const bookmark = bookmarkById.get(id);
      if (!bookmark) {
        return [];
      }
      return [
        {
          ...bookmark,
          tags: bookmark.bookmarkTags.map((item) => item.tag),
        },
      ];
    });
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
          favicon: parsed.data.favicon || null,
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

    // 埋点：书签创建成功（静默写入，不影响创建流程）
    await metricsService.trackSafely({
      eventName: ANALYTICS_EVENT_NAMES.BOOKMARK_CREATED,
      userId: user?.id ?? null,
      scope: parsed.data.scope,
      payload: {
        bookmarkId: created.bookmark.id,
        scope: parsed.data.scope,
        tagCount: created.tagIds.length,
      },
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
    if (typeof parsed.data.favicon === "string") {
      data.favicon = parsed.data.favicon || null;
    }
    if (typeof parsed.data.description === "string") {
      data.description = parsed.data.description || null;
    }
    if (typeof parsed.data.isFavorite === "boolean") {
      data.isFavorite = parsed.data.isFavorite;
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
                favicon: bookmark.favicon,
                description: bookmark.description,
                isFavorite: bookmark.isFavorite,
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
      throw new AppError("AUTH_REQUIRED", "请先登录后保存到个人空间", 401);
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
          favicon: appBookmark.favicon,
          normalizedUrl: appBookmark.normalizedUrl,
          description: appBookmark.description,
          isFavorite: false,
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
