import { prisma } from "@/server/db/prisma";

type CreateInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

type ActiveToken = {
  id: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
};

export const passwordResetTokenRepo = {
  /**
   * 创建密码重置令牌记录
   *
   * @description 将令牌哈希与过期时间落库，不存储明文
   * @param input - 创建输入
   * @returns 创建的令牌记录
   */
  async create(input: CreateInput) {
    return prisma.passwordResetToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });
  },

  /**
   * 按哈希查找未使用且未过期的令牌
   *
   * @description 重置密码时根据令牌哈希定位记录，仅命中未使用且未过期项
   * @param tokenHash - 令牌哈希
   * @returns 命中则返回令牌记录，否则 null
   */
  async findActiveByHash(tokenHash: string): Promise<ActiveToken | null> {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
      },
    });
  },

  /**
   * 标记令牌为已使用
   *
   * @description 重置成功后置 usedAt 为当前时间，令牌即失效
   * @param id - 令牌 ID
   */
  async markUsed(id: string): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  },

  /**
   * 失效用户的所有未使用令牌
   *
   * @description 发起重置前清理同一用户的历史未使用令牌，避免堆积
   * @param userId - 用户 ID
   */
  async invalidateUnusedByUser(userId: string): Promise<void> {
    await prisma.passwordResetToken.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });
  },
};
