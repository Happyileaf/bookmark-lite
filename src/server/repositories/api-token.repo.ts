import { prisma } from "@/server/db/prisma";

type CreateInput = {
  userId: string;
  name: string;
  tokenHash: string;
  tokenPrefix: string;
};

type ListableToken = {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
};

export const apiTokenRepo = {
  /**
   * 创建 Token 记录
   *
   * @description 将 Token 哈希与前缀落库，不存储明文
   * @param input - 创建输入
   * @returns 创建的 Token 记录
   */
  async create(input: CreateInput) {
    return prisma.apiToken.create({
      data: {
        userId: input.userId,
        name: input.name,
        tokenHash: input.tokenHash,
        tokenPrefix: input.tokenPrefix,
      },
    });
  },

  /**
   * 列出用户未撤销的 Token（脱敏，不含哈希）
   *
   * @description 用于设置页展示，仅返回未撤销项
   * @param userId - 用户 ID
   * @returns Token 列表
   */
  async listActiveByUser(userId: string): Promise<ListableToken[]> {
    const tokens = await prisma.apiToken.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        lastUsedAt: true,
        createdAt: true,
        revokedAt: true,
      },
    });
    return tokens;
  },

  /**
   * 按哈希查找未撤销的 Token（鉴权用）
   *
   * @description 鉴权时根据 Token 哈希定位用户，仅命中未撤销项
   * @param tokenHash - Token 哈希
   * @returns 命中则返回含用户信息的记录，否则 null
   */
  async findActiveByHash(tokenHash: string) {
    return prisma.apiToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });
  },

  /**
   * 更新最后使用时间
   *
   * @description 鉴权命中后异步刷新，不阻塞主流程
   * @param id - Token ID
   */
  async touchLastUsed(id: string): Promise<void> {
    await prisma.apiToken.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  },

  /**
   * 撤销 Token（软删除）
   *
   * @description 置 revokedAt 为当前时间，鉴权即失效；校验归属
   * @param id - Token ID
   * @param userId - 用户 ID（用于归属校验）
   * @returns 撤销成功返回 true，不存在或不归属则 false
   */
  async revoke(id: string, userId: string): Promise<boolean> {
    const result = await prisma.apiToken.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count > 0;
  },
};
