"use server";

import { revalidatePath } from "next/cache";
import type { DataScope } from "@prisma/client";
import { getSessionUser } from "@/server/auth/session";
import { tagService } from "@/server/services/tag.service";

function revalidateTagViews(scope: DataScope) {
  if (scope === "APP") {
    revalidatePath("/bookmarks");
    revalidatePath("/admin/manage/tags");
    return;
  }
  revalidatePath("/my-bookmarks");
  revalidatePath("/manage/tags");
}

export async function upsertTagAction(scope: DataScope, formData: FormData) {
  const user = await getSessionUser();
  await tagService.upsert(
    {
      id: String(formData.get("id") ?? "") || undefined,
      scope,
      name: String(formData.get("name") ?? ""),
      color: String(formData.get("color") ?? ""),
      description: String(formData.get("description") ?? ""),
    },
    user,
  );
  revalidateTagViews(scope);
}

export async function deleteTagAction(scope: DataScope, formData: FormData) {
  const user = await getSessionUser();
  const id = String(formData.get("id") ?? "");
  await tagService.delete(id, scope, user);
  revalidateTagViews(scope);
}
