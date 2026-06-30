import { apiTokenRepo } from "@/server/repositories/api-token.repo";
import { hashApiToken } from "@/server/auth/api-token";
import { AppError } from "@/server/types/errors";
import type { Role } from "@prisma/client";
import type { SessionUser } from "@/server/auth/session";

const BEARER_PREFIX = "Bearer ";

/**
 * 从请求中解析 Bearer Token 并返回对应用户
 *
 * @description 插件接口鉴权入口：读取 Authorization 头，按哈希查找未撤销 Token，
 * 命中则异步刷新最后使用时间，返回用户身份；未命中或缺失则抛 401
 * @param request - HTTP 请求
 * @returns 鉴权通过的用户身份
 * @throws {AppError} AUTH_REQUIRED 当 Token 缺失、无效或已撤销时
 * @example
 * const user = await requireApiTokenUser(request);
 */
export async function requireApiTokenUser(
  request: Request,
): Promise<SessionUser> {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith(BEARER_PREFIX)) {
    throw new AppError("AUTH_REQUIRED", "缺少有效的访问令牌", 401);
  }

  const rawToken = authHeader.slice(BEARER_PREFIX.length).trim();
  if (!rawToken) {
    throw new AppError("AUTH_REQUIRED", "缺少有效的访问令牌", 401);
  }

  const tokenHash = hashApiToken(rawToken);
  const record = await apiTokenRepo.findActiveByHash(tokenHash);
  if (!record || record.revokedAt) {
    throw new AppError("AUTH_REQUIRED", "无效的访问令牌", 401);
  }

  // 异步刷新最后使用时间，不阻塞主流程
  void apiTokenRepo.touchLastUsed(record.id);

  return {
    id: record.user.id,
    role: record.user.role as Role,
  };
}
