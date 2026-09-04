import { prisma } from "@/server/db/prisma";

/** 创建验证码的输入参数 */
type CreateInput = {
  /** 验证码归属邮箱（归一化后的小写邮箱） */
  email: string;
  /** 验证码 HMAC 哈希，不存明文 */
  codeHash: string;
  /** 过期时间 */
  expiresAt: Date;
};

/** 一条验证码记录 */
type RegistrationCodeRecord = {
  id: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  attempts: number;
  createdAt: Date;
};

export const registrationCodeRepo = {
  /**
   * 创建注册验证码记录
   *
   * @description 将验证码哈希与过期时间落库，不存储明文
   * @param input - 创建输入
   */
  async create(input: CreateInput): Promise<void> {
    await prisma.registrationCode.create({
      data: {
        email: input.email,
        codeHash: input.codeHash,
        expiresAt: input.expiresAt,
      },
    });
  },

  /**
   * 查询邮箱最近一条未使用的验证码记录
   *
   * @description 按创建时间倒序取最新一条，供发送限频与校验使用
   * @param email - 验证码归属邮箱
   * @returns 命中则返回验证码记录，否则 null
   */
  async findLatestUnusedByEmail(
    email: string,
  ): Promise<RegistrationCodeRecord | null> {
    return prisma.registrationCode.findFirst({
      where: { email, usedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        codeHash: true,
        expiresAt: true,
        usedAt: true,
        attempts: true,
        createdAt: true,
      },
    });
  },

  /**
   * 失效邮箱的所有未使用验证码
   *
   * @description 每次成功发送新验证码前调用，旧验证码立即失效，避免堆积与重放
   * @param email - 验证码归属邮箱
   */
  async invalidateUnusedByEmail(email: string): Promise<void> {
    await prisma.registrationCode.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    });
  },

  /**
   * 累加验证码错误尝试次数
   *
   * @description 验证码错误或超限时调用，达到上限后该验证码视为失效
   * @param id - 验证码记录 ID
   */
  async incrementAttempts(id: string): Promise<void> {
    await prisma.registrationCode.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  },

  /**
   * 标记验证码为已使用
   *
   * @description 注册成功后置 usedAt 为当前时间，验证码即失效
   * @param id - 验证码记录 ID
   */
  async markUsed(id: string): Promise<void> {
    await prisma.registrationCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  },
};
