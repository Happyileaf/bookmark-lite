import { HOT_VISIT_WINDOW_DAYS } from "@/lib/constants";
import { prisma } from "@/server/db/prisma";
import type { DataScope, Prisma } from "@prisma/client";

type ListInput = {
  scope: DataScope;
  ownerUserId: string | null;
  includeHidden?: boolean;
  q?: string;
  tagId?: string;
  view?:
    | "all"
    | "favorites"
    | "untagged"
    | "recent_added"
    | "recent_visited"
    | "hot"
    | "random";
  sort?:
    | "default"
    | "created_desc"
    | "created_asc"
    | "updated_desc"
    | "visited_desc"
    | "title_asc"
    | "title_desc";
  page: number;
  pageSize: number;
};

/**
 * 计算热门书签统计窗口的起点时间
 *
 * @description 热门列表与热门计数必须使用同一窗口口径（最近 HOT_VISIT_WINDOW_DAYS 天），
 * 抽成单一函数避免两处各自计算产生口径漂移
 * @returns 窗口起点时间（当前时间往前推 HOT_VISIT_WINDOW_DAYS 天）
 */
function getHotWindowStart(): Date {
  return new Date(Date.now() - HOT_VISIT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

function buildOrderBy(
  input: Pick<ListInput, "sort" | "includeHidden">,
): Prisma.BookmarkOrderByWithRelationInput[] {
  switch (input.sort ?? "default") {
    case "created_asc":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "created_desc":
      return [{ createdAt: "desc" }, { id: "desc" }];
    case "updated_desc":
      return [{ updatedAt: "desc" }, { id: "desc" }];
    case "visited_desc":
      return [{ lastVisitedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }];
    case "title_asc":
      return [{ title: "asc" }, { id: "asc" }];
    case "title_desc":
      return [{ title: "desc" }, { id: "desc" }];
    case "default":
    default:
      // 默认统一按创建时间倒序，附加 id 作为稳定排序键。
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

function buildWhere(input: ListInput): Prisma.BookmarkWhereInput {
  const scopeWhere: Prisma.BookmarkWhereInput =
    input.scope === "APP"
      ? { scope: "APP", ownerUserId: null }
      : { scope: "USER", ownerUserId: input.ownerUserId };

  const q = input.q?.trim();
  const keywordWhere: Prisma.BookmarkWhereInput | undefined = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { url: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          {
            bookmarkTags: {
              some: {
                tag: {
                  name: { contains: q, mode: "insensitive" },
                },
              },
            },
          },
        ],
      }
    : undefined;

  const tagWhere = input.tagId
    ? {
        bookmarkTags: {
          some: {
            tagId: input.tagId,
          },
        },
      }
    : undefined;

  const view = input.view ?? "all";
  const viewWhere: Prisma.BookmarkWhereInput | undefined =
    view === "favorites"
      ? { isFavorite: true }
      : view === "untagged"
        ? { bookmarkTags: { none: {} } }
        : undefined;

  const clauses: Prisma.BookmarkWhereInput[] = [scopeWhere];
  if (!input.includeHidden) {
    clauses.push({ isVisible: true });
  }
  if (keywordWhere) clauses.push(keywordWhere);
  if (tagWhere) clauses.push(tagWhere);
  if (viewWhere) clauses.push(viewWhere);

  return { AND: clauses };
}

export const bookmarkRepo = {
  async list(input: ListInput) {
    /**
     * 热门视图依赖访问次数排序，无法用书签表自身的 orderBy 表达，
     * 仅公共库（APP）支持热门视图，其余场景回落到普通列表查询
     */
    if (input.view === "hot" && input.scope === "APP") {
      return bookmarkRepo.listHot(input);
    }
    const where = buildWhere(input);
    const [total, items] = await prisma.$transaction([
      prisma.bookmark.count({ where }),
      prisma.bookmark.findMany({
        where,
        orderBy: buildOrderBy(input),
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: {
          bookmarkTags: {
            include: {
              tag: true,
            },
          },
        },
      }),
    ]);
    return { items, total };
  },

  /**
   * 查询热门书签分页列表（仅公共库）
   *
   * @description 热门排序依据是「统计窗口内的访问次数 + 最近访问时间」，二者均来自
   * bookmark_visits 聚合而非书签表字段，故先 groupBy 取访问统计，再在应用层完成
   * 排序与分页；q/tagId 过滤复用 buildWhere 叠加到命中书签集合上
   * @param input - 列表查询入参（q/tagId/page/pageSize 生效，view 恒为 hot）
   * @returns 与 list 同构的 { items, total }，items 含 bookmarkTags 关联
   */
  async listHot(input: ListInput) {
    const visitStats = await prisma.bookmarkVisit.groupBy({
      by: ["bookmarkId"],
      where: {
        occurredAt: { gte: getHotWindowStart() },
        bookmark: { scope: "APP", ownerUserId: null, isVisible: true },
      },
      _count: { bookmarkId: true },
      _max: { occurredAt: true },
    });
    if (visitStats.length === 0) {
      return { items: [], total: 0 };
    }

    const statByBookmarkId = new Map(visitStats.map((stat) => [stat.bookmarkId, stat]));

    /**
     * 热门视图的语义由「窗口内有访问记录」决定，因此把统计命中的书签 ID
     * 作为额外过滤条件叠加，再复用 buildWhere 保留 scope/q/tagId 等既有过滤口径
     */
    const where: Prisma.BookmarkWhereInput = {
      AND: [
        buildWhere({ ...input, view: "all" }),
        { id: { in: [...statByBookmarkId.keys()] } },
      ],
    };
    const matched = await prisma.bookmark.findMany({
      where,
      include: {
        bookmarkTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    const sorted = matched.sort((left, right) => {
      const leftStat = statByBookmarkId.get(left.id);
      const rightStat = statByBookmarkId.get(right.id);
      /** groupBy 分组键即书签 ID，findMany 的 ID 过滤条件保证统计必然存在，此处仅作类型收窄 */
      if (!leftStat || !rightStat) {
        return 0;
      }
      const countDiff = rightStat._count.bookmarkId - leftStat._count.bookmarkId;
      if (countDiff !== 0) {
        return countDiff;
      }
      const lastVisitedDiff =
        (rightStat._max.occurredAt?.getTime() ?? 0) -
        (leftStat._max.occurredAt?.getTime() ?? 0);
      if (lastVisitedDiff !== 0) {
        return lastVisitedDiff;
      }
      const createdDiff = right.createdAt.getTime() - left.createdAt.getTime();
      if (createdDiff !== 0) {
        return createdDiff;
      }
      return right.id.localeCompare(left.id);
    });

    const start = (input.page - 1) * input.pageSize;
    return {
      items: sorted.slice(start, start + input.pageSize),
      total: sorted.length,
    };
  },

  findById(id: string) {
    return prisma.bookmark.findUnique({
      where: { id },
      include: {
        bookmarkTags: true,
      },
    });
  },

  /**
   * 按 ID 列表批量查询书签（含标签）
   *
   * @description 随机发现接口一次回显一批书签，与逐条 findUnique 相比仅需一次查询；
   * findMany 不保证返回顺序，调用方需自行按抽取顺序重排
   * @param ids - 书签 ID 数组（由随机抽取产生，长度即批大小）
   * @returns 书签数组（含 bookmarkTags 及其 tag），不存在的 ID 自动缺省
   */
  listByIdsWithTags(ids: string[]) {
    return prisma.bookmark.findMany({
      where: { id: { in: ids } },
      include: {
        bookmarkTags: {
          include: {
            tag: true,
          },
        },
      },
    });
  },

  /**
   * 查询随机发现的候选书签 ID 列表
   *
   * @description 随机抽取需要先拿到完整候选池才能保证等概率，故仅 select id 以减小传输量；
   * 候选池固定为公共库可见书签（scope=APP、ownerUserId=null、isVisible=true）
   * @param tagId - 可选标签 ID，存在时候选池限定为挂有该标签的书签
   * @returns 候选书签 ID 数组，池为空时返回空数组
   */
  listRandomCandidateIds(tagId?: string) {
    return prisma.bookmark.findMany({
      where: {
        scope: "APP",
        ownerUserId: null,
        isVisible: true,
        ...(tagId ? { bookmarkTags: { some: { tagId } } } : {}),
      },
      select: { id: true },
    });
  },

  /**
   * 查询指定访客近期是否已访问过某书签
   *
   * @description 访问记录的基础防刷查询：防刷窗口由调用方依据
   * BOOKMARK_VISIT_DEDUP_WINDOW_MS 计算，repo 仅负责按条件命中
   * @param input - 查询条件（书签 ID、访客标识、窗口起点时间）
   * @returns 窗口内已有访问记录返回 true，否则返回 false
   */
  async hasRecentVisit(input: { bookmarkId: string; visitorKey: string; since: Date }) {
    const recent = await prisma.bookmarkVisit.findFirst({
      where: {
        bookmarkId: input.bookmarkId,
        visitorKey: input.visitorKey,
        occurredAt: { gte: input.since },
      },
      select: { id: true },
    });
    return recent !== null;
  },

  /**
   * 写入一条公共书签访问记录
   *
   * @description 仅做数据落库；是否计入（书签范围/可见性）与防刷去重由 service 层决策，
   * 调用方需先通过 hasRecentVisit 完成窗口查重
   * @param input - 访问记录字段（书签 ID、登录用户 ID 或 null、访客标识）
   * @returns 无返回值
   */
  async createVisit(input: { bookmarkId: string; userId: string | null; visitorKey: string }) {
    await prisma.bookmarkVisit.create({
      data: {
        bookmarkId: input.bookmarkId,
        userId: input.userId,
        visitorKey: input.visitorKey,
      },
    });
  },

  findByNormalizedUrl(scopeOwnerKey: string, normalizedUrl: string) {
    return prisma.bookmark.findUnique({
      where: {
        scopeOwnerKey_normalizedUrl: { scopeOwnerKey, normalizedUrl },
      },
    });
  },

  async countByView(input: Omit<ListInput, "page" | "pageSize" | "sort" | "tagId" | "q">) {
    const baseWhere = buildWhere({ ...input, view: "all", page: 1, pageSize: 1 });

    const [all, favorites, untagged] = await Promise.all([
      prisma.bookmark.count({ where: baseWhere }),
      prisma.bookmark.count({
        where: {
          ...baseWhere,
          isFavorite: true,
        },
      }),
      prisma.bookmark.count({
        where: {
          ...baseWhere,
          bookmarkTags: { none: {} },
        },
      }),
    ]);

    const recentAddedWhere = { ...baseWhere };
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentAdded = await prisma.bookmark.count({
      where: {
        ...recentAddedWhere,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const recentVisited = await prisma.bookmark.count({
      where: {
        ...recentAddedWhere,
        lastVisitedAt: { gte: thirtyDaysAgo },
      },
    });

    /**
     * 热门计数与热门列表共用「窗口内有访问记录的公共可见书签」口径；
     * 个人库（USER）没有访问上报，热门概念不存在，直接计 0
     */
    const hotVisitedBookmarks =
      input.scope === "APP"
        ? await prisma.bookmarkVisit.findMany({
            where: {
              occurredAt: { gte: getHotWindowStart() },
              bookmark: { scope: "APP", ownerUserId: null, isVisible: true },
            },
            select: { bookmarkId: true },
            distinct: ["bookmarkId"],
          })
        : [];

    return {
      all,
      favorites,
      untagged,
      recent_added: recentAdded,
      recent_visited: recentVisited,
      hot: hotVisitedBookmarks.length,
    };
  },
};
