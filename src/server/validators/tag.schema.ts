import { z } from "zod";
import { dataScopeSchema } from "@/server/validators/bookmark.schema";

export const tagUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  scope: dataScopeSchema,
  name: z.string().trim().min(1, "标签名不能为空").max(80),
  color: z.string().trim().max(20).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});
