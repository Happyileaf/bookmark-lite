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
