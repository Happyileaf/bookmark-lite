"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { DataScope } from "@prisma/client";
import { getSessionUser } from "@/server/auth/session";
import { settingsService } from "@/server/services/settings.service";
import { settingsUpdateSchema } from "@/server/validators/settings.schema";

export async function updateSettingsAction(scope: DataScope, formData: FormData) {
  const user = await getSessionUser();
  await settingsService.update(scope, user, {
    theme: String(formData.get("theme") ?? "") || undefined,
    trashRetentionDays:
      Number(String(formData.get("trashRetentionDays") ?? "")) || undefined,
    auditRetentionDays:
      Number(String(formData.get("auditRetentionDays") ?? "")) || undefined,
  });

  // 设置主题 cookie，供前端 FOUC 防护脚本读取
  const rawTheme = String(formData.get("theme") ?? "");
  const parsed = settingsUpdateSchema.shape.theme.safeParse(rawTheme || undefined);
  if (parsed.success && parsed.data) {
    const cookieStore = await cookies();
    cookieStore.set("theme", parsed.data, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  }

  if (scope === "APP") {
    revalidatePath("/admin/settings");
  } else {
    revalidatePath("/settings");
  }
}
