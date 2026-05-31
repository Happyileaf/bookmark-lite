import { prisma } from "@/server/db/prisma";
import type { DataScope, Prisma } from "@prisma/client";

type ListInput = {
  scope: DataScope;
  ownerUserId: string | null;
  q?: string;
  tagId?: string;
  view?: "all" | "favorites" | "untagged" | "recent_added" | "recent_visited" | "pinned";
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
  sort: NonNullable<ListInput["sort"]>,
): Prisma.BookmarkOrderByWithRelationInput[] {
  switch (sort) {
    case "created_asc":
      return [{ createdAt: "asc" }];
    case "created_desc":
      return [{ createdAt: "desc" }];
    case "updated_desc":
      return [{ updatedAt: "desc" }];
    case "visited_desc":
      return [{ lastVisitedAt: "desc" }, { createdAt: "desc" }];
    case "title_asc":
      return [{ title: "asc" }];
    case "title_desc":
      return [{ title: "desc" }];
    case "default":
    default:
      return [{ isPinned: "desc" }, { createdAt: "desc" }];
  }
}

function buildWhere(input: ListInput): Prisma.BookmarkWhereInput {
  const scopeWhere: Prisma.BookmarkWhereInput =
    input.scope === "APP"
      ? { scope: "APP", ownerUserId: null, isVisible: true }
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
        : view === "pinned"
          ? { isPinned: true }
          : undefined;

  const clauses: Prisma.BookmarkWhereInput[] = [scopeWhere];
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
        orderBy: buildOrderBy(input.sort ?? "default"),
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
};
