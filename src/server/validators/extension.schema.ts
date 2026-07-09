import { z } from "zod";

/**
 * 浏览器插件收藏书签请求体校验
 */
export const extensionBookmarkCreateSchema = z.object({
  url: z.string().trim().min(1, "URL 不能为空").max(2048),
  title: z.string().trim().min(1).max(300).optional(),
  favicon: z.string().url().max(1000).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(80)).optional(),
});
