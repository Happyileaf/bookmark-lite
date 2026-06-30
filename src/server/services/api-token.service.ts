import { apiTokenRepo } from "@/server/repositories/api-token.repo";
import { auditRepo } from "@/server/repositories/audit.repo";
import { generateApiToken } from "@/server/auth/api-token";
import type { SessionUser } from "@/server/auth/session";
import { AppError } from "@/server/types/errors";

type IssuedToken = {
  id: string;
  name: string;
  tokenPrefix: string;
  raw: string;
};

type ListableToken = {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
};

export const apiTokenService = {
  /**
   * 签发新的 API Token
   *
   * @description 生成明文与哈希，落库后返回明文（仅此一次）与前缀；写审计日志
   * @param user - 当前用户
   * @param name - Token 名称
   * @returns 含明文与前缀的签发结果
   * @example
   * const token = await apiTokenService.issue(user, "我的Chrome");
   */
  async issue(user: SessionUser, name: string): Promise<IssuedToken> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new AppError("VALIDATION_FAILED", "Token 名称不能为空", 422);
    }
    if (trimmedName.length > 100) {
      throw new AppError("VALIDATION_FAILED", "Token 名称不能超过 100 字符", 422);
    }

    const { raw, tokenHash, tokenPrefix } = generateApiToken();
    const created = await apiTokenRepo.create({
      userId: user.id,
      name: trimmedName,
      tokenHash,
      tokenPrefix,
    });

    await auditRepo.create({
      userId: user.id,
      role: user.role,
      action: "API_TOKEN_CREATE",
      targetType: "API_TOKEN",
      targetId: created.id,
      scope: "USER",
      status: "SUCCESS",
    });

    return {
      id: created.id,
      name: created.name,
      tokenPrefix: created.tokenPrefix,
      raw,
    };
  },

  /**
   * 列出用户未撤销的 Token（脱敏）
   *
   * @description 用于设置页展示，不含哈希
   * @param user - 当前用户
   * @returns Token 列表
   */
  async list(user: SessionUser): Promise<ListableToken[]> {
    return apiTokenRepo.listActiveByUser(user.id);
  },

  /**
   * 撤销 Token
   *
   * @description 软删除，校验归属；写审计日志
   * @param user - 当前用户
   * @param tokenId - Token ID
   * @throws {AppError} RESOURCE_NOT_FOUND 当 Token 不存在或不归属当前用户
   */
  async revoke(user: SessionUser, tokenId: string): Promise<void> {
    const ok = await apiTokenRepo.revoke(tokenId, user.id);
    if (!ok) {
      throw new AppError("RESOURCE_NOT_FOUND", "Token 不存在或已撤销", 404);
    }
    await auditRepo.create({
      userId: user.id,
      role: user.role,
      action: "API_TOKEN_REVOKE",
      targetType: "API_TOKEN",
      targetId: tokenId,
      scope: "USER",
      status: "SUCCESS",
    });
  },
};
