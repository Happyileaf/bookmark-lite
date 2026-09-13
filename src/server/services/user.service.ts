import { prisma } from "@/server/db/prisma";
import type { SessionUser } from "@/server/auth/session";
import { AppError } from "@/server/types/errors";
import { userProfileUpdateSchema } from "@/server/validators/user.schema";

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
};
