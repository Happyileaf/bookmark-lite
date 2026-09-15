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

/**
 * 修改用户角色（管理端）
 *
 * @description 从表单读取用户 ID 与目标角色；仅超级管理员可用；成功后刷新用户管理列表
 * @param formData - 含 id 与 role 字段的表单数据
 * @returns 无返回值；校验或权限失败时抛出错误
 */
export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("请先登录");
  }
  await userService.updateRole(
    {
      id: String(formData.get("id") ?? ""),
      role: String(formData.get("role") ?? ""),
    },
    user,
  );
  revalidatePath("/admin/manage/users");
}

/**
 * 禁用或启用用户（管理端）
 *
 * @description 从表单读取用户 ID 与目标状态；仅超级管理员可用；成功后刷新用户管理列表
 * @param formData - 含 id 与 disabled 字段的表单数据（disabled 为 "true"/"false"）
 * @returns 无返回值；校验或权限失败时抛出错误
 */
export async function setUserDisabledAction(
  formData: FormData,
): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("请先登录");
  }
  await userService.setDisabled(
    {
      id: String(formData.get("id") ?? ""),
      disabled: formData.get("disabled") === "true",
    },
    user,
  );
  revalidatePath("/admin/manage/users");
}

/**
 * 重置用户密码（管理端）
 *
 * @description 从表单读取用户 ID；仅超级管理员可用；成功后刷新用户管理列表并透传临时密码
 * @param formData - 含 id 字段的表单数据
 * @returns 生成的临时密码；校验或权限失败时抛出错误
 */
export async function resetUserPasswordAction(
  formData: FormData,
): Promise<{ temporaryPassword: string }> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("请先登录");
  }
  const result = await userService.resetPassword(
    { id: String(formData.get("id") ?? "") },
    user,
  );
  revalidatePath("/admin/manage/users");
  return result;
}

/**
 * 删除用户（管理端）
 *
 * @description 从表单读取用户 ID；仅超级管理员可用；级联删除其书签、标签与回收站数据；成功后刷新用户管理列表
 * @param formData - 含 id 字段的表单数据
 * @returns 无返回值；校验或权限失败时抛出错误
 */
export async function deleteUserAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("请先登录");
  }
  await userService.deleteUser({ id: String(formData.get("id") ?? "") }, user);
  revalidatePath("/admin/manage/users");
}
