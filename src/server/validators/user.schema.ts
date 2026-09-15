import { z } from "zod";

/**
 * 用户资料更新入参
 *
 * @description 昵称可空（清空即恢复按邮箱首字母展示头像）；去首尾空格后最长 80 字符
 */
export const userProfileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, "昵称最长 80 个字符")
    .nullable()
    .default(null)
    .transform((value) => (value && value.length > 0 ? value : null)),
});

/**
 * 管理端用户列表查询入参
 *
 * @description q 匹配邮箱/昵称（模糊、忽略大小写）；sort 默认创建时间倒序；分页参数支持字符串协转
 */
export const adminUserQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  role: z.enum(["user", "super_admin"]).optional(),
  sort: z
    .enum(["created_desc", "created_asc", "email_asc"])
    .optional()
    .default("created_desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});

/**
 * 管理端修改用户角色入参
 */
export const adminUserRoleUpdateSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user", "super_admin"]),
});

/**
 * 管理端启用/禁用用户入参
 */
export const adminUserStatusUpdateSchema = z.object({
  id: z.string().uuid(),
  disabled: z.boolean(),
});

/**
 * 管理端重置用户密码入参
 */
export const adminUserPasswordResetSchema = z.object({
  id: z.string().uuid(),
});

/**
 * 管理端删除用户入参
 */
export const adminUserDeleteSchema = z.object({
  id: z.string().uuid(),
});

/** 管理端用户列表查询入参类型 */
export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;

/** 管理端修改用户角色入参类型 */
export type AdminUserRoleUpdateInput = z.infer<typeof adminUserRoleUpdateSchema>;

/** 管理端启用/禁用用户入参类型 */
export type AdminUserStatusUpdateInput = z.infer<typeof adminUserStatusUpdateSchema>;

/** 管理端重置用户密码入参类型 */
export type AdminUserPasswordResetInput = z.infer<typeof adminUserPasswordResetSchema>;

/** 管理端删除用户入参类型 */
export type AdminUserDeleteInput = z.infer<typeof adminUserDeleteSchema>;
