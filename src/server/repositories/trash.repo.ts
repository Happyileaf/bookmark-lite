import { prisma } from "@/server/db/prisma";
import type { DataScope } from "@prisma/client";

export const trashRepo = {
  list(scope: DataScope, ownerUserId: string | null) {
    return prisma.trashItem.findMany({
      where:
        scope === "APP"
          ? { scope: "APP", ownerUserId: null }
          : { scope: "USER", ownerUserId },
      orderBy: [{ deletedAt: "desc" }],
    });
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
