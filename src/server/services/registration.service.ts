import { hashPassword } from "@/server/auth/password";
import {
  generateRegistrationCode,
  hashRegistrationCode,
} from "@/server/auth/registration-code";
import { registrationCodeRepo } from "@/server/repositories/registration-code.repo";
import { auditRepo } from "@/server/repositories/audit.repo";
import { mailService } from "@/server/mail/mail.service";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/types/errors";
import { timingSafeEqual } from "node:crypto";

/** 验证码有效期：10 分钟 */
const CODE_TTL_MS = 10 * 60 * 1000;
/** 验证码有效期（分钟），用于邮件与前端提示 */
const CODE_TTL_MINUTES = CODE_TTL_MS / (60 * 1000);
/** 同一邮箱重复发送验证码的冷却时间：60 秒 */
const RESEND_COOLDOWN_MS = 60 * 1000;
/** 单条验证码最大校验错误次数，超限即失效 */
const MAX_VERIFY_ATTEMPTS = 5;

export const registrationService = {
  /**
   * 发送注册验证码
   *
   * @description 校验邮箱未注册后生成 6 位数字验证码并发送邮件；60 秒内重复发送会被限流。
   * 未配置邮件服务（本地开发）时验证码打印到服务端控制台，流程不中断。
   * @param email - 待注册邮箱
   * @returns 发送结果，含验证码有效期（分钟）
   * @throws {AppError} VALIDATION_FAILED 当邮箱已注册
   * @throws {AppError} RATE_LIMITED 当冷却时间内重复请求
   * @throws {AppError} MAIL_SEND_FAILED 当邮件发送失败
   */
  async sendCode(email: string): Promise<{ ttlMinutes: number }> {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      throw new AppError("VALIDATION_FAILED", "邮箱已注册，请直接登录", 422);
    }

    const latest =
      await registrationCodeRepo.findLatestUnusedByEmail(normalizedEmail);
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) / 1000,
      );
      throw new AppError(
        "RATE_LIMITED",
        `发送过于频繁，请 ${waitSeconds} 秒后再试`,
        429,
      );
    }

    await registrationCodeRepo.invalidateUnusedByEmail(normalizedEmail);

    const { raw, codeHash } = generateRegistrationCode(normalizedEmail);
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);
    await registrationCodeRepo.create({
      email: normalizedEmail,
      codeHash,
      expiresAt,
    });

    if (mailService.isConfigured()) {
      const mailResult = await mailService.sendTemplate(
        "register-code",
        normalizedEmail,
        { code: raw, ttlMinutes: CODE_TTL_MINUTES },
      );

      await auditRepo.create({
        action: "REGISTRATION_CODE_SENT",
        targetType: "EMAIL",
        targetId: normalizedEmail,
        scope: "USER",
        status: mailResult.success ? "SUCCESS" : "FAIL",
        reason: mailResult.success ? undefined : mailResult.error,
      });

      if (!mailResult.success) {
        throw new AppError(
          "MAIL_SEND_FAILED",
          mailResult.error ?? "验证码邮件发送失败",
          500,
        );
      }
    } else {
      /**
       * 开发态兜底：未配置 RESEND_API_KEY 时邮件不会真正发出，
       * 将验证码打印到服务端控制台以便本地联调
       */
      console.warn(
        "[registration] 邮件服务未配置，开发模式验证码 %s 发送至 %s（%d 分钟内有效）",
        raw,
        normalizedEmail,
        CODE_TTL_MINUTES,
      );
    }

    return { ttlMinutes: CODE_TTL_MINUTES };
  },

  /**
   * 校验验证码并完成注册
   *
   * @description 校验 6 位验证码的归属、有效期、错误次数与哈希一致性；
   * 通过后在同一事务内创建用户并消费验证码，保证原子性
   * @param email - 注册邮箱
   * @param code - 用户输入的 6 位验证码
   * @param password - 已通过强度校验的密码明文
   * @throws {AppError} VALIDATION_FAILED 当验证码格式错误、错误次数超限或验证码不正确
   * @throws {AppError} RESOURCE_NOT_FOUND 当验证码不存在或已过期
   */
  async registerWithCode(
    email: string,
    code: string,
    password: string,
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!/^\d{6}$/.test(trimmedCode)) {
      throw new AppError("VALIDATION_FAILED", "验证码必须为 6 位数字", 422);
    }

    const record =
      await registrationCodeRepo.findLatestUnusedByEmail(normalizedEmail);
    if (!record || record.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new AppError(
        "RESOURCE_NOT_FOUND",
        "验证码无效或已失效，请重新获取",
        404,
      );
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new AppError("RESOURCE_NOT_FOUND", "验证码已过期，请重新获取", 404);
    }

    const codeHash = hashRegistrationCode(normalizedEmail, trimmedCode);
    const matched =
      codeHash.length === record.codeHash.length &&
      timingSafeEqual(Buffer.from(codeHash), Buffer.from(record.codeHash));

    if (!matched) {
      await registrationCodeRepo.incrementAttempts(record.id);
      const remaining = MAX_VERIFY_ATTEMPTS - record.attempts - 1;
      throw new AppError(
        "VALIDATION_FAILED",
        remaining > 0
          ? `验证码不正确，还可尝试 ${remaining} 次`
          : "验证码错误次数过多，请重新获取",
        422,
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: "user",
        },
      });
      await tx.registrationCode.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
    });

    await auditRepo.create({
      action: "REGISTRATION_COMPLETE",
      targetType: "EMAIL",
      targetId: normalizedEmail,
      scope: "USER",
      status: "SUCCESS",
    });
  },
};
