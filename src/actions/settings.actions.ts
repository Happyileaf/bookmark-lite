"use server";

import { revalidatePath } from "next/cache";
import type { DataScope } from "@prisma/client";
import { getSessionUser } from "@/server/auth/session";
import { settingsService } from "@/server/services/settings.service";

export async function updateSettingsAction(scope: DataScope, formData: FormData) {
  const user = await getSessionUser();
  await settingsService.update(scope, user, {
    theme: String(formData.get("theme") ?? "") || undefined,
    trashRetentionDays:
      Number(String(formData.get("trashRetentionDays") ?? "")) || undefined,
    auditRetentionDays:
      Number(String(formData.get("auditRetentionDays") ?? "")) || undefined,
  });

  revalidatePath("/", "layout");
  if (scope === "APP") {
    revalidatePath("/admin/settings");
  } else {
    revalidatePath("/settings");
  }
}
