import { prisma } from "@/server/db/prisma";
import type { DataScope } from "@prisma/client";

type ListInput = {
  scope: DataScope;
  ownerUserId: string | null;
};

type ListPagedInput = ListInput & {
  page: number;
  pageSize: number;
};

function buildWhere(input: ListInput) {
  return input.scope === "APP"
    ? { scope: "APP" as const, ownerUserId: null }
    : { scope: "USER" as const, ownerUserId: input.ownerUserId };
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
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
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
