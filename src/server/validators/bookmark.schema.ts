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
