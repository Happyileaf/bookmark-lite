import type { SessionUser } from "@/server/auth/session";
import { assertCanManageScope } from "@/server/guard/authorize";
import { resolveScopeContext } from "@/server/guard/scope";
import { settingsRepo } from "@/server/repositories/settings.repo";
import { settingsUpdateSchema } from "@/server/validators/settings.schema";
import type { DataScope } from "@prisma/client";
import { AppError } from "@/server/types/errors";
import { prisma } from "@/server/db/prisma";

type ResolvedSettings = {
  theme: "light" | "dark" | "system";
  trashRetentionDays: number;
  auditRetentionDays: number;
};

function resolveSystemSettings(
  scopeSettings: {
    theme: "light" | "dark" | "system" | null;
    trashRetentionDays: number | null;
    auditRetentionDays: number | null;
  },
  defaults: {
    theme: "light" | "dark" | "system";
    trashRetentionDays: number;
    auditRetentionDays: number;
  },
): ResolvedSettings {
  return {
    theme: scopeSettings.theme ?? defaults.theme,
    trashRetentionDays: scopeSettings.trashRetentionDays ?? defaults.trashRetentionDays,
    auditRetentionDays: scopeSettings.auditRetentionDays ?? defaults.auditRetentionDays,
  };
}

export const settingsService = {
  async get(scope: DataScope, user: SessionUser | null) {
    assertCanManageScope(scope, user);
    const scopeCtx = resolveScopeContext(scope, user?.id);
    const [defaults, settings] = await Promise.all([
      settingsRepo.getSystemDefaults(),
      settingsRepo.getScopeSettings(scopeCtx.scope, scopeCtx.ownerUserId),
    ]);

    return resolveSystemSettings(settings, defaults);
  },

  async update(scope: DataScope, user: SessionUser | null, input: unknown) {
    assertCanManageScope(scope, user);
    const scopeCtx = resolveScopeContext(scope, user?.id);
    const parsed = settingsUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "设置参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    if (scopeCtx.scope === "APP") {
      await prisma.appSetting.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          theme: parsed.data.theme,
          trashRetentionDays: parsed.data.trashRetentionDays,
          auditRetentionDays: parsed.data.auditRetentionDays,
        },
        update: {
          theme: parsed.data.theme,
          trashRetentionDays: parsed.data.trashRetentionDays,
          auditRetentionDays: parsed.data.auditRetentionDays,
        },
      });
    } else {
      await prisma.userSetting.upsert({
        where: { userId: scopeCtx.ownerUserId! },
        create: {
          userId: scopeCtx.ownerUserId!,
          theme: parsed.data.theme,
          trashRetentionDays: parsed.data.trashRetentionDays,
          auditRetentionDays: parsed.data.auditRetentionDays,
        },
        update: {
          theme: parsed.data.theme,
          trashRetentionDays: parsed.data.trashRetentionDays,
          auditRetentionDays: parsed.data.auditRetentionDays,
        },
      });
    }

    return this.get(scopeCtx.scope, user);
  },
};
