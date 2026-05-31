"use server";

import { revalidatePath } from "next/cache";
import type { DataScope } from "@prisma/client";
import { getSessionUser } from "@/server/auth/session";
import { trashService } from "@/server/services/trash.service";

function revalidateTrashViews(scope: DataScope) {
  if (scope === "APP") {
    revalidatePath("/admin/manage/trash");
    revalidatePath("/admin/manage/bookmarks");
    revalidatePath("/bookmarks");
    return;
  }
  revalidatePath("/manage/trash");
  revalidatePath("/manage/bookmarks");
  revalidatePath("/my-bookmarks");
}

export async function restoreTrashAction(scope: DataScope, formData: FormData) {
  const user = await getSessionUser();
  const id = String(formData.get("id") ?? "");
  await trashService.restore([id], scope, user);
  revalidateTrashViews(scope);
}

export async function deleteTrashForeverAction(
  scope: DataScope,
  formData: FormData,
) {
  const user = await getSessionUser();
  const id = String(formData.get("id") ?? "");
  await trashService.deleteForever([id], scope, user);
  revalidateTrashViews(scope);
}

export async function clearTrashAction(scope: DataScope) {
  const user = await getSessionUser();
  await trashService.clear(scope, user);
  revalidateTrashViews(scope);
}
