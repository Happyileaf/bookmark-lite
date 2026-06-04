"use server";

import { revalidatePath } from "next/cache";
import type { DataScope } from "@prisma/client";
import { bookmarkService } from "@/server/services/bookmark.service";
import { getSessionUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

function splitTagNames(raw: string): string[] {
  return raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function readOptionalString(formData: FormData, key: string): string | undefined {
  if (!formData.has(key)) return undefined;
  return String(formData.get(key) ?? "");
}

function readOptionalBoolean(formData: FormData, key: string): boolean | undefined {
  if (!formData.has(key)) return undefined;
  const raw = String(formData.get(key) ?? "").trim().toLowerCase();
  return raw === "on" || raw === "true" || raw === "1";
}

function revalidateBookmarkViews(scope: DataScope) {
  if (scope === "APP") {
    revalidatePath("/bookmarks");
    revalidatePath("/admin/manage/bookmarks");
    return;
  }
  revalidatePath("/my-bookmarks");
  revalidatePath("/manage/bookmarks");
}

export async function createBookmarkAction(scope: DataScope, formData: FormData) {
  const user = await getSessionUser();
  await bookmarkService.create(
    {
      scope,
      title: String(formData.get("title") ?? ""),
      url: String(formData.get("url") ?? ""),
      description: String(formData.get("description") ?? ""),
      tagNames: splitTagNames(String(formData.get("tags") ?? "")),
    },
    user,
  );
  revalidateBookmarkViews(scope);
}

export async function updateBookmarkAction(scope: DataScope, formData: FormData) {
  const user = await getSessionUser();
  const id = String(formData.get("id") ?? "");
  const title = readOptionalString(formData, "title");
  const url = readOptionalString(formData, "url");
  const description = readOptionalString(formData, "description");
  const tags = readOptionalString(formData, "tags");
  const isFavorite = readOptionalBoolean(formData, "isFavorite");
  const isPinned = readOptionalBoolean(formData, "isPinned");
  const isVisible = readOptionalBoolean(formData, "isVisible");

  await bookmarkService.update({
    id,
    scope,
    ...(title !== undefined ? { title } : {}),
    ...(url !== undefined ? { url } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(tags !== undefined ? { tagNames: splitTagNames(tags) } : {}),
    ...(isFavorite !== undefined ? { isFavorite } : {}),
    ...(isPinned !== undefined ? { isPinned } : {}),
    ...(isVisible !== undefined ? { isVisible } : {}),
  }, user);
  revalidateBookmarkViews(scope);
}

export async function deleteBookmarkAction(scope: DataScope, formData: FormData) {
  const user = await getSessionUser();
  const id = String(formData.get("id") ?? "");
  await bookmarkService.deleteMany([id], scope, user);
  revalidateBookmarkViews(scope);
}

export async function saveAppBookmarkToUserAction(formData: FormData) {
  const user = await getSessionUser();
  const bookmarkId = String(formData.get("bookmarkId") ?? "");
  const tags = splitTagNames(String(formData.get("tags") ?? ""));
  await bookmarkService.saveAppBookmarkToUser(bookmarkId, user, tags);
  revalidatePath("/my-bookmarks");
}

export async function visitBookmarkAction(scope: DataScope, formData: FormData) {
  const user = await getSessionUser();
  const id = String(formData.get("id") ?? "");
  const bookmark = await prisma.bookmark.findUnique({
    where: { id },
  });
  if (!bookmark) {
    return;
  }
  if (
    (scope === "USER" && bookmark.ownerUserId !== user?.id) ||
    bookmark.scope !== scope
  ) {
    return;
  }
  await prisma.bookmark.update({
    where: { id },
    data: { lastVisitedAt: new Date() },
  });
}
