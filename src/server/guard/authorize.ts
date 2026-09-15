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

export function assertCanManageScope(scope: DataScope, user: SessionUser | null) {
  if (!user) {
    throw new AppError("AUTH_REQUIRED", "请先登录", 401);
  }
  if (scope === "APP" && user.role !== "super_admin") {
    throw new AppError("FORBIDDEN", "仅超级管理员可管理应用级数据", 403);
  }
}

/**
 * 断言当前用户为超级管理员
 *
 * @description 管理端操作的前置守卫；未登录抛 AUTH_REQUIRED，非超级管理员抛 FORBIDDEN
 * @param user - 当前会话用户
 * @throws {AppError} AUTH_REQUIRED 未登录
 * @throws {AppError} FORBIDDEN 非超级管理员
 * @example
 * assertSuperAdmin(user);
 */
export function assertSuperAdmin(user: SessionUser | null) {
  if (!user) {
    throw new AppError("AUTH_REQUIRED", "请先登录", 401);
  }
  if (user.role !== "super_admin") {
    throw new AppError("FORBIDDEN", "仅超级管理员可执行该操作", 403);
  }
}
