import { prisma } from "@/server/db/prisma";
import type { DataScope } from "@prisma/client";

type ListPageInput = {
  scope: DataScope;
  ownerUserId: string | null;
  page: number;
  pageSize: number;
};

function buildWhere(scope: DataScope, ownerUserId: string | null) {
  return scope === "APP"
    ? { scope: "APP" as const, ownerUserId: null }
    : { scope: "USER" as const, ownerUserId };
}

export const trashRepo = {
  async list({ scope, ownerUserId, page, pageSize }: ListPageInput) {
    const where = buildWhere(scope, ownerUserId);
    const [total, items] = await prisma.$transaction([
      prisma.trashItem.count({ where }),
      prisma.trashItem.findMany({
        where,
        orderBy: [{ deletedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { items, total };
  },

  findByIds(ids: string[], scope: DataScope, ownerUserId: string | null) {
    return prisma.trashItem.findMany({
      where: {
        id: { in: ids },
        scope,
        ownerUserId,
      },
    });
  },
};
