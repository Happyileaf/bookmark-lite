import { prisma } from "@/server/db/prisma";
import type { DataScope, Prisma } from "@prisma/client";

type ListInput = {
  scope: DataScope;
  ownerUserId: string | null;
  includeHidden?: boolean;
  q?: string;
  tagId?: string;
  view?: "all" | "favorites" | "untagged" | "recent_added" | "recent_visited";
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

  findById(id: string) {
    return prisma.bookmark.findUnique({
      where: { id },
      include: {
        bookmarkTags: true,
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

    return {
      all,
      favorites,
      untagged,
      recent_added: recentAdded,
      recent_visited: recentVisited,
    };
  },
};
