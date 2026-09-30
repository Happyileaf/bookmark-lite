import {
  DEFAULT_RANDOM_BATCH_SIZE,
  MAX_RANDOM_EXCLUDE_IDS,
} from "@/lib/constants";
import { z } from "zod";

export const dataScopeSchema = z.enum(["APP", "USER"]);

export const bookmarkCreateSchema = z.object({
  scope: dataScopeSchema,
  title: z.string().trim().min(1, "标题不能为空").max(300, "标题长度不能超过 300"),
  url: z.string().trim().min(1, "URL 不能为空"),
  favicon: z.string().url().max(1000).optional().or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(2000, "描述长度不能超过 2000")
    .optional()
    .or(z.literal("")),
  tagNames: z.array(z.string().trim().min(1).max(80)).default([]),
});

export const bookmarkUpdateSchema = z.object({
  id: z.string().uuid(),
  scope: dataScopeSchema,
  title: z.string().trim().min(1).max(300).optional(),
  url: z.string().trim().optional(),
  favicon: z.string().url().max(1000).optional().or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("")),
  isFavorite: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  tagNames: z.array(z.string().trim().min(1).max(80)).optional(),
});

export const bookmarkQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  tagId: z.string().uuid().optional(),
  view: z
    .enum([
      "all",
      "favorites",
      "untagged",
      "recent_added",
      "recent_visited",
      "hot",
      "random",
    ])
    .default("all"),
  sort: z
    .enum([
      "default",
      "created_desc",
      "created_asc",
      "updated_desc",
      "visited_desc",
      "title_asc",
      "title_desc",
    ])
    .default("default"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});

/**
 * 公共书签访问上报请求体
 *
 * @description 仅接收被访问的书签 ID；访问者标识由服务端从 HttpOnly Cookie 解析，
 * 不信任客户端上报的身份信息
 */
export const bookmarkVisitSchema = z.object({
  bookmarkId: z.string().uuid(),
});

/**
 * 随机发现书签的查询参数
 *
 * @description tagId 用于按标签圈定随机候选池；exclude 为希望排除的书签 ID 列表
 * （去重后最多 MAX_RANDOM_EXCLUDE_IDS 个，用于「再来一批」时避免短期内重复出现）；
 * count 为本批抽取数量（默认 DEFAULT_RANDOM_BATCH_SIZE，上限 50 防止滥用拉取全库）
 */
export const bookmarkRandomQuerySchema = z.object({
  tagId: z.string().uuid().optional(),
  exclude: z.array(z.string().uuid()).max(MAX_RANDOM_EXCLUDE_IDS).optional(),
  count: z.coerce.number().int().min(1).max(50).default(DEFAULT_RANDOM_BATCH_SIZE),
});
