import { randomInt } from "node:crypto";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import type { SessionUser } from "@/server/auth/session";
import { assertSuperAdmin } from "@/server/guard/authorize";
import { auditRepo } from "@/server/repositories/audit.repo";
import { userRepo } from "@/server/repositories/user.repo";
import { AppError } from "@/server/types/errors";
import {
  adminUserDeleteSchema,
  adminUserPasswordResetSchema,
  adminUserQuerySchema,
  adminUserRoleUpdateSchema,
  adminUserStatusUpdateSchema,
  userProfileUpdateSchema,
} from "@/server/validators/user.schema";

/** 临时密码字符集（base62） */
const TEMPORARY_PASSWORD_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** 临时密码长度 */
const TEMPORARY_PASSWORD_LENGTH = 12;

/**
 * 生成随机临时密码
 *
 * @description 使用 node:crypto 的 randomInt 逐位从 base62 字母表取字符；明文仅用于返回给管理员，绝不落库或写日志
 * @returns 12 位临时密码明文
 * @example
 * const temporaryPassword = generateTemporaryPassword();
 */
function generateTemporaryPassword(): string {
  let password = "";
  for (let index = 0; index < TEMPORARY_PASSWORD_LENGTH; index += 1) {
    password += TEMPORARY_PASSWORD_ALPHABET[randomInt(TEMPORARY_PASSWORD_ALPHABET.length)];
  }
  return password;
}

export const userService = {
  /**
   * 更新当前登录用户的昵称
   *
   * @description 入参经 schema 校验后写库；空字符串归一化为 null（未设置昵称）
   * @param user - 当前会话用户
   * @param input - 待更新的资料字段
   * @returns 更新后的昵称（可能为 null）
   */
  async updateProfile(
    user: SessionUser | null,
    input: unknown,
  ): Promise<{ name: string | null }> {
    if (!user) {
      throw new AppError("AUTH_REQUIRED", "请先登录", 401);
    }
    const parsed = userProfileUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "昵称参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name },
      select: { name: true },
    });

    return { name: updated.name };
  },

  /**
   * 分页查询用户列表（管理端）
   *
   * @description 仅超级管理员；校验查询参数后走仓储层，返回脱敏用户列表与分页信息
   * @param query - 查询参数（q/role/sort/page/pageSize）
   * @param user - 当前会话用户
   * @returns 用户列表与分页信息
   * @throws {AppError} FORBIDDEN 非超级管理员
   * @throws {AppError} VALIDATION_FAILED 查询参数校验失败
   * @example
   * const result = await userService.listPaged({ page: "1", pageSize: "30" }, user);
   */
  async listPaged(query: unknown, user: SessionUser | null) {
    assertSuperAdmin(user);

    const parsed = adminUserQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "用户查询参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const result = await userRepo.list({
      q: parsed.data.q,
      role: parsed.data.role,
      sort: parsed.data.sort,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });

    return {
      items: result.items,
      total: result.total,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      totalPages: Math.max(1, Math.ceil(result.total / parsed.data.pageSize)),
    };
  },

  /**
   * 用户统计（管理端仪表盘）
   *
   * @description 仅超级管理员；返回用户总数、超级管理员数、近 7 天新增数、已禁用数
   * @param user - 当前会话用户
   * @returns 各项统计数据
   * @throws {AppError} FORBIDDEN 非超级管理员
   * @example
   * const stats = await userService.stats(user);
   */
  async stats(user: SessionUser | null) {
    assertSuperAdmin(user);
    return userRepo.countStats();
  },

  /**
   * 修改用户角色（管理端）
   *
   * @description 仅超级管理员；禁止修改自己的角色；将超级管理员降为普通用户时，若可用超级管理员不足两人则拒绝，数量校验与更新放在同一事务保证并发一致；成功后写审计
   * @param input - 修改角色入参（id/role）
   * @param user - 当前会话用户
   * @throws {AppError} FORBIDDEN 非超级管理员或修改自己的角色
   * @throws {AppError} VALIDATION_FAILED 入参校验失败
   * @throws {AppError} RESOURCE_NOT_FOUND 目标用户不存在
   * @throws {AppError} CONFLICT 至少保留一名超级管理员
   * @example
   * await userService.updateRole({ id: "user-uuid", role: "super_admin" }, user);
   */
  async updateRole(input: unknown, user: SessionUser | null) {
    assertSuperAdmin(user);

    const parsed = adminUserRoleUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "角色参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const target = await userRepo.findById(parsed.data.id);
    if (!target) {
      throw new AppError("RESOURCE_NOT_FOUND", "用户不存在", 404);
    }
    if (target.id === user?.id) {
      throw new AppError("FORBIDDEN", "不能修改自己的角色", 403);
    }

    await prisma.$transaction(async (tx) => {
      if (target.role === "super_admin" && parsed.data.role === "user") {
        const activeAdmins = await tx.user.count({
          where: { role: "super_admin", disabledAt: null },
        });
        if (activeAdmins <= 1) {
          throw new AppError("CONFLICT", "至少保留一名超级管理员", 409);
        }
      }
      await tx.user.update({
        where: { id: target.id },
        data: { role: parsed.data.role },
      });
    });

    await auditRepo.create({
      userId: user?.id ?? null,
      role: user?.role ?? null,
      action: "ADMIN_USER_ROLE_UPDATE",
      targetType: "USER",
      targetId: target.id,
      scope: "USER",
      status: "SUCCESS",
    });
  },

  /**
   * 启用/禁用用户（管理端）
   *
   * @description 仅超级管理员；禁止操作自己；禁用未禁用的超级管理员时，若可用超级管理员不足两人则拒绝，数量校验与更新放在同一事务保证并发一致；禁用置 disabledAt 为当前时间，启用置 null；成功后写审计
   * @param input - 状态更新入参（id/disabled）
   * @param user - 当前会话用户
   * @throws {AppError} FORBIDDEN 非超级管理员或操作自己
   * @throws {AppError} VALIDATION_FAILED 入参校验失败
   * @throws {AppError} RESOURCE_NOT_FOUND 目标用户不存在
   * @throws {AppError} CONFLICT 至少保留一名超级管理员
   * @example
   * await userService.setDisabled({ id: "user-uuid", disabled: true }, user);
   */
  async setDisabled(input: unknown, user: SessionUser | null) {
    assertSuperAdmin(user);

    const parsed = adminUserStatusUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "状态参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const target = await userRepo.findById(parsed.data.id);
    if (!target) {
      throw new AppError("RESOURCE_NOT_FOUND", "用户不存在", 404);
    }
    if (target.id === user?.id) {
      throw new AppError("FORBIDDEN", "不能修改自己的状态", 403);
    }

    await prisma.$transaction(async (tx) => {
      if (parsed.data.disabled && target.role === "super_admin" && !target.disabledAt) {
        const activeAdmins = await tx.user.count({
          where: { role: "super_admin", disabledAt: null },
        });
        if (activeAdmins <= 1) {
          throw new AppError("CONFLICT", "至少保留一名超级管理员", 409);
        }
      }
      await tx.user.update({
        where: { id: target.id },
        data: { disabledAt: parsed.data.disabled ? new Date() : null },
      });
    });

    await auditRepo.create({
      userId: user?.id ?? null,
      role: user?.role ?? null,
      action: parsed.data.disabled ? "ADMIN_USER_DISABLE" : "ADMIN_USER_ENABLE",
      targetType: "USER",
      targetId: target.id,
      scope: "USER",
      status: "SUCCESS",
    });
  },

  /**
   * 重置用户密码（管理端）
   *
   * @description 仅超级管理员；生成 12 位随机临时密码，argon2 哈希后写库；明文仅通过返回值交给管理员，绝不写日志或审计；成功后写审计
   * @param input - 重置密码入参（id）
   * @param user - 当前会话用户
   * @returns 临时密码明文（仅此一次）
   * @throws {AppError} FORBIDDEN 非超级管理员
   * @throws {AppError} VALIDATION_FAILED 入参校验失败
   * @throws {AppError} RESOURCE_NOT_FOUND 目标用户不存在
   * @example
   * const { temporaryPassword } = await userService.resetPassword({ id: "user-uuid" }, user);
   */
  async resetPassword(
    input: unknown,
    user: SessionUser | null,
  ): Promise<{ temporaryPassword: string }> {
    assertSuperAdmin(user);

    const parsed = adminUserPasswordResetSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "重置密码参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const target = await userRepo.findById(parsed.data.id);
    if (!target) {
      throw new AppError("RESOURCE_NOT_FOUND", "用户不存在", 404);
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    await prisma.user.update({
      where: { id: target.id },
      data: { passwordHash },
    });

    await auditRepo.create({
      userId: user?.id ?? null,
      role: user?.role ?? null,
      action: "ADMIN_USER_PASSWORD_RESET",
      targetType: "USER",
      targetId: target.id,
      scope: "USER",
      status: "SUCCESS",
    });

    return { temporaryPassword };
  },

  /**
   * 删除用户（管理端）
   *
   * @description 仅超级管理员；禁止删除自己；删除未禁用的超级管理员时，若可用超级管理员不足两人则拒绝；事务内依次删除该用户个人域书签、个人域标签、回收站条目，最后删除用户本体（apiToken/userSetting/passwordResetToken 由 schema 级联，auditLog/eventMetric SetNull 保留）；事务成功后写审计，targetId 记录被删用户邮箱
   * @param input - 删除入参（id）
   * @param user - 当前会话用户
   * @throws {AppError} FORBIDDEN 非超级管理员或删除自己
   * @throws {AppError} VALIDATION_FAILED 入参校验失败
   * @throws {AppError} RESOURCE_NOT_FOUND 目标用户不存在
   * @throws {AppError} CONFLICT 至少保留一名超级管理员
   * @example
   * await userService.deleteUser({ id: "user-uuid" }, user);
   */
  async deleteUser(input: unknown, user: SessionUser | null) {
    assertSuperAdmin(user);

    const parsed = adminUserDeleteSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "删除用户参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const target = await userRepo.findById(parsed.data.id);
    if (!target) {
      throw new AppError("RESOURCE_NOT_FOUND", "用户不存在", 404);
    }
    if (target.id === user?.id) {
      throw new AppError("FORBIDDEN", "不能删除自己", 403);
    }

    await prisma.$transaction(async (tx) => {
      if (target.role === "super_admin" && !target.disabledAt) {
        const activeAdmins = await tx.user.count({
          where: { role: "super_admin", disabledAt: null },
        });
        if (activeAdmins <= 1) {
          throw new AppError("CONFLICT", "至少保留一名超级管理员", 409);
        }
      }
      await tx.bookmark.deleteMany({
        where: { scope: "USER", ownerUserId: target.id },
      });
      await tx.tag.deleteMany({
        where: { scope: "USER", ownerUserId: target.id },
      });
      await tx.trashItem.deleteMany({
        where: { ownerUserId: target.id },
      });
      await tx.user.delete({
        where: { id: target.id },
      });
    });

    await auditRepo.create({
      userId: user?.id ?? null,
      role: user?.role ?? null,
      action: "ADMIN_USER_DELETE",
      targetType: "USER",
      targetId: target.email,
      scope: "USER",
      status: "SUCCESS",
    });
  },
};
