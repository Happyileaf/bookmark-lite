import { passwordResetTokenRepo } from "@/server/repositories/password-reset-token.repo";
import { auditRepo } from "@/server/repositories/audit.repo";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "@/server/auth/password-reset-token";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { mailService } from "@/server/mail/mail.service";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/types/errors";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const RESET_TOKEN_TTL_MINUTES = RESET_TOKEN_TTL_MS / (60 * 1000);

type ResetRequestResult = {
  sent: boolean;
};

export const passwordResetService = {
  /**
   * 发起密码重置请求
   *
   * @description 根据邮箱生成重置令牌并发送邮件；无论邮箱是否注册都返回成功，避免账号枚举
   * @param email - 用户邮箱
   * @param resetBaseUrl - 用于拼接重置链接的站点根地址
   * @returns 发送结果
   */
  async requestReset(
    email: string,
    resetBaseUrl: string,
  ): Promise<ResetRequestResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    });

    if (!user) {
      return { sent: false };
    }

    await passwordResetTokenRepo.invalidateUnusedByUser(user.id);

    const { raw, tokenHash } = generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await passwordResetTokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = buildResetUrl(resetBaseUrl, raw);
    const mailResult = await mailService.sendTemplate(
      "password-reset",
      user.email,
      { resetUrl, ttlMinutes: RESET_TOKEN_TTL_MINUTES },
    );

    if (!mailResult.success) {
      console.error("[password-reset] 邮件发送失败，用户：%s", user.email);
    }

    await auditRepo.create({
      userId: user.id,
      role: "user",
      action: "PASSWORD_RESET_REQUEST",
      targetType: "USER",
      targetId: user.id,
      scope: "USER",
      status: "SUCCESS",
    });

    return { sent: mailResult.success };
  },

  /**
   * 校验重置令牌有效性
   *
   * @description 用于重置页面加载时判断令牌是否可用，不消费令牌
   * @param token - 令牌明文
   * @returns 有效返回用户信息，否则抛出 AppError
   * @throws {AppError} VALIDATION_FAILED 当令牌格式不合法
   * @throws {AppError} RESOURCE_NOT_FOUND 当令牌不存在、已使用或已过期
   */
  async verifyToken(token: string): Promise<{ email: string }> {
    if (!token || token.length !== 64) {
      throw new AppError("VALIDATION_FAILED", "重置链接无效", 422);
    }

    const tokenHash = hashPasswordResetToken(token);
    const record = await passwordResetTokenRepo.findActiveByHash(tokenHash);
    if (!record) {
      throw new AppError("RESOURCE_NOT_FOUND", "重置链接无效或已失效", 404);
    }
    if (record.usedAt) {
      throw new AppError("RESOURCE_NOT_FOUND", "重置链接已被使用", 404);
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new AppError("RESOURCE_NOT_FOUND", "重置链接已过期", 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: record.userId },
      select: { email: true },
    });
    if (!user) {
      throw new AppError("RESOURCE_NOT_FOUND", "账户不存在", 404);
    }

    return { email: user.email };
  },

  /**
   * 使用令牌重置密码
   *
   * @description 校验令牌有效性后更新密码并标记令牌已使用；新旧密码不能相同
   * @param token - 令牌明文
   * @param newPassword - 新密码
   * @throws {AppError} VALIDATION_FAILED 当令牌格式不合法或新旧密码相同
   * @throws {AppError} RESOURCE_NOT_FOUND 当令牌不存在、已使用或已过期
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || token.length !== 64) {
      throw new AppError("VALIDATION_FAILED", "重置链接无效", 422);
    }

    const tokenHash = hashPasswordResetToken(token);
    const record = await passwordResetTokenRepo.findActiveByHash(tokenHash);
    if (!record) {
      throw new AppError("RESOURCE_NOT_FOUND", "重置链接无效或已失效", 404);
    }
    if (record.usedAt) {
      throw new AppError("RESOURCE_NOT_FOUND", "重置链接已被使用", 404);
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new AppError("RESOURCE_NOT_FOUND", "重置链接已过期", 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: record.userId },
      select: { id: true, email: true, passwordHash: true },
    });
    if (!user) {
      throw new AppError("RESOURCE_NOT_FOUND", "账户不存在", 404);
    }

    const sameAsOld = await verifyPassword(newPassword, user.passwordHash);
    if (sameAsOld) {
      throw new AppError("VALIDATION_FAILED", "新密码不能与旧密码相同", 422);
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await passwordResetTokenRepo.markUsed(record.id);

    await auditRepo.create({
      userId: user.id,
      role: "user",
      action: "PASSWORD_RESET_COMPLETE",
      targetType: "USER",
      targetId: user.id,
      scope: "USER",
      status: "SUCCESS",
    });
  },
};

function buildResetUrl(baseUrl: string, token: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  return `${normalizedBase}/reset-password?token=${token}`;
}
