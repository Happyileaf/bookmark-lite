import { z } from "zod";

export const settingsUpdateSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  trashRetentionDays: z.coerce.number().int().min(1).max(3650).optional(),
  auditRetentionDays: z.coerce.number().int().min(1).max(3650).optional(),
});
