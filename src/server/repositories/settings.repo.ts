import { prisma } from "@/server/db/prisma";
import type { DataScope } from "@prisma/client";

export const settingsRepo = {
  getSystemDefaults() {
    return prisma.systemDefaultSetting.upsert({
      where: { id: 1 },
      create: {
        id: 1,
      },
      update: {},
    });
  },

  getScopeSettings(scope: DataScope, userId: string | null) {
    if (scope === "APP") {
      return prisma.appSetting.upsert({
        where: { id: 1 },
        create: { id: 1 },
        update: {},
      });
    }
    if (!userId) {
      throw new Error("USER scope requires userId");
    }
    return prisma.userSetting.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  },
};
