import { z } from "zod";
import { dataScopeSchema } from "@/server/validators/bookmark.schema";

export const importOptionsSchema = z.object({
  scope: dataScopeSchema,
  dryRun: z.boolean().optional().default(false),
});

export const importRecordSchema = z.object({
  title: z.string().trim().min(1).max(300),
  url: z.string().trim().min(1),
  description: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(80)).optional(),
});

export type ImportRecord = z.infer<typeof importRecordSchema>;
