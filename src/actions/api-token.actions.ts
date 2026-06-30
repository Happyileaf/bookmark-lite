"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/server/auth/session";
import { apiTokenService } from "@/server/services/api-token.service";

/**
 * 创建 API Token
 *
 * @description 生成新 Token，返回明文（仅此一次）
 * @param name - Token 名称
 * @returns 含明文的签发结果
 */
export async function createApiTokenAction(
  name: string,
): Promise<{ id: string; name: string; tokenPrefix: string; raw: string }> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("请先登录");
  }
  const issued = await apiTokenService.issue(user, name);
  revalidatePath("/settings");
  return issued;
}

/**
 * 撤销 API Token
 *
 * @description 软删除指定 Token，立即失效
 * @param tokenId - Token ID
 */
export async function revokeApiTokenAction(tokenId: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("请先登录");
  }
  await apiTokenService.revoke(user, tokenId);
  revalidatePath("/settings");
}
