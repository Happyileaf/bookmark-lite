import { prisma } from "@/server/db/prisma";
import type { DataScope, Prisma } from "@prisma/client";

type ListInput = {
  scope: DataScope;
  ownerUserId: string | null;
};

type TagSortOption =
  | "default"
  | "name_asc"
  | "name_desc"
  | "created_desc"
  | "created_asc"
  | "bookmark_count_desc"
  | "bookmark_count_asc";

type ListPagedInput = ListInput & {
  q?: string;
  sort?: TagSortOption;
  page: number;
  pageSize: number;
};

function buildWhere(input: ListInput & { q?: string }): Prisma.TagWhereInput {
  const scopeWhere: Prisma.TagWhereInput =
    input.scope === "APP"
      ? { scope: "APP", ownerUserId: null }
      : { scope: "USER", ownerUserId: input.ownerUserId };

  const q = input.q?.trim();
  const keywordWhere: Prisma.TagWhereInput | undefined = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }
    : undefined;

  const clauses: Prisma.TagWhereInput[] = [scopeWhere];
  if (keywordWhere) clauses.push(keywordWhere);

  return { AND: clauses };
}

function buildOrderBy(sort?: TagSortOption): Prisma.TagOrderByWithRelationInput[] {
  switch (sort ?? "default") {
    case "name_asc":
      return [{ name: "asc" }, { id: "asc" }];
    case "name_desc":
      return [{ name: "desc" }, { id: "desc" }];
    case "created_desc":
      return [{ createdAt: "desc" }, { id: "desc" }];
    case "created_asc":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "bookmark_count_desc":
      return [{ bookmarkCount: "desc" }, { sortOrder: "asc" }, { id: "asc" }];
    case "bookmark_count_asc":
      return [{ bookmarkCount: "asc" }, { sortOrder: "asc" }, { id: "asc" }];
    case "default":
    default:
      return [{ sortOrder: "asc" }, { name: "asc" }];
  }
}

export const tagRepo = {
  list(scope: DataScope, ownerUserId: string | null) {
    return prisma.tag.findMany({
      where: buildWhere({ scope, ownerUserId }),
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  },

  async listPaged(input: ListPagedInput) {
    const where = buildWhere(input);
    const [total, items] = await prisma.$transaction([
      prisma.tag.count({ where }),
      prisma.tag.findMany({
        where,
        orderBy: buildOrderBy(input.sort),
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);
    return { items, total };
  },

  findByName(scopeOwnerKey: string, name: string) {
    return prisma.tag.findUnique({
      where: {
        scopeOwnerKey_name: {
          scopeOwnerKey,
          name,
        },
      },
    });
  },

  async findOrCreateMany(
    scope: DataScope,
    ownerUserId: string | null,
    scopeOwnerKey: string,
    names: string[],
  ) {
    const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
    const tags = await Promise.all(
      uniqueNames.map(async (name, index) => {
        const existing = await this.findByName(scopeOwnerKey, name);
        if (existing) {
          return existing;
        }
        return prisma.tag.create({
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
  },

  async refreshBookmarkCount(tagIds: string[]) {
    const uniqueTagIds = [...new Set(tagIds)];
    await Promise.all(
      uniqueTagIds.map(async (tagId) => {
        const count = await prisma.bookmarkTag.count({
          where: { tagId },
        });
        await prisma.tag.update({
          where: { id: tagId },
          data: { bookmarkCount: count },
        });
      }),
    );
  },
};
