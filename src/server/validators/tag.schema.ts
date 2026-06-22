import { z } from "zod";
import { dataScopeSchema } from "@/server/validators/bookmark.schema";

export const tagUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  scope: dataScopeSchema,
  name: z.string().trim().min(1, "标签名不能为空").max(80),
  color: z.string().trim().max(20).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const tagQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  sort: z
    .enum([
      "default",
      "name_asc",
      "name_desc",
      "created_desc",
      "created_asc",
      "bookmark_count_desc",
      "bookmark_count_asc",
    ])
    .default("default"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});
