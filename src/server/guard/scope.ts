import { APP_SCOPE_KEY } from "@/lib/constants";
import type { ScopeContext } from "@/server/types/domain";
import { AppError } from "@/server/types/errors";
import type { DataScope } from "@prisma/client";

export function resolveScopeContext(
  scope: DataScope,
  userId?: string | null,
): ScopeContext {
  if (scope === "APP") {
    return {
      scope,
      ownerUserId: null,
      scopeOwnerKey: APP_SCOPE_KEY,
    };
  }

  if (!userId) {
    throw new AppError("AUTH_REQUIRED", "用户数据域需要登录", 401);
  }

  return {
    scope,
    ownerUserId: userId,
    scopeOwnerKey: userId,
  };
}
