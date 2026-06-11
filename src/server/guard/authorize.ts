import type { SessionUser } from "@/server/auth/session";
import { AppError } from "@/server/types/errors";
import type { DataScope } from "@prisma/client";

export function assertCanReadScope(scope: DataScope, user: SessionUser | null) {
  if (scope === "APP") {
    return;
  }
  if (!user) {
    throw new AppError("AUTH_REQUIRED", "请先登录后访问个人数据", 401);
  }
}

export function assertCanManageScope(
  scope: DataScope,
  user: SessionUser | null,
  targetUserId?: string | null,
) {
  if (!user) {
    throw new AppError("AUTH_REQUIRED", "请先登录", 401);
  }
  if (scope === "APP" && user.role !== "super_admin") {
    throw new AppError("FORBIDDEN", "仅超级管理员可管理应用级数据", 403);
  }
  if (scope === "USER" && targetUserId && targetUserId !== user.id) {
    throw new AppError("FORBIDDEN", "仅可管理本人的用户级数据", 403);
  }
}
