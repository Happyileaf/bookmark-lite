import { prisma } from "@/server/db/prisma";
import type { DataScope } from "@prisma/client";

export const tagRepo = {
  list(scope: DataScope, ownerUserId: string | null) {
    return prisma.tag.findMany({
      where:
        scope === "APP"
          ? { scope: "APP", ownerUserId: null }
          : { scope: "USER", ownerUserId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
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
