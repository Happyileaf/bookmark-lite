"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/server/auth/session";
import { userService } from "@/server/services/user.service";

/**
 * 更新当前用户昵称
 *
 * @description 从个人资料表单读取昵称；空值归一化为未设置；更新后刷新设置页与顶栏
 * @param formData - 含 name 字段的表单数据
 * @returns 更新后的昵称
 */
export async function updateUserProfileAction(
  formData: FormData,
): Promise<{ name: string | null }> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("请先登录");
  }
  const result = await userService.updateProfile(user, {
    name: String(formData.get("name") ?? ""),
  });
  revalidatePath("/settings");
  revalidatePath("/admin/settings");
  return result;
}
