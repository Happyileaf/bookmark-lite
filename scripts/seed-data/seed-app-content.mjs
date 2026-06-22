import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  APP_SCOPE_KEY,
  EXPECTED_BOOKMARK_COUNT,
  EXPECTED_TAG_COUNT,
  buildSeedData
} from "./seed-app-content-shared.mjs";

function loadEnvFile() {
  if (process.env.DATABASE_URL) return;

  const envPath = resolve(".env");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function seedAppData() {
  loadEnvFile();
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Please set it in your environment or .env.");
  }

  const { tags, bookmarks } = buildSeedData();
  const prisma = new PrismaClient();

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.bookmarkTag.deleteMany({
        where: {
          OR: [
            { bookmark: { scope: "APP" } },
            { tag: { scope: "APP" } }
          ]
        }
      });

      await tx.bookmark.deleteMany({ where: { scope: "APP" } });
      await tx.tag.deleteMany({ where: { scope: "APP" } });

      await tx.tag.createMany({
        data: tags.map((tag) => ({
          id: tag.id,
          scope: "APP",
          ownerUserId: null,
          name: tag.name,
          color: tag.color,
          description: tag.description,
          sortOrder: tag.sortOrder,
          bookmarkCount: 0,
          scopeOwnerKey: APP_SCOPE_KEY
        }))
      });

      await tx.bookmark.createMany({
        data: bookmarks.map((bookmark) => ({
          id: bookmark.id,
          scope: "APP",
          ownerUserId: null,
          title: bookmark.title,
          url: bookmark.url,
          normalizedUrl: bookmark.normalizedUrl,
          description: bookmark.description,
          isFavorite: bookmark.isFavorite,
          isVisible: bookmark.isVisible,
          scopeOwnerKey: APP_SCOPE_KEY,
          createdAt: new Date(bookmark.createdAt),
          updatedAt: new Date(bookmark.createdAt)
        }))
      });

      const tagIdByKey = new Map(tags.map((tag) => [tag.key, tag.id]));
      const bookmarkTagRows = bookmarks.flatMap((bookmark) => (
        bookmark.tagKeys.map((tagKey) => {
          const tagId = tagIdByKey.get(tagKey);
          if (!tagId) {
            throw new Error(`Missing tag id for key: ${tagKey}`);
          }
          return {
            bookmarkId: bookmark.id,
            tagId
          };
        })
      ));

      await tx.bookmarkTag.createMany({
        data: bookmarkTagRows
      });

      const grouped = await tx.bookmarkTag.groupBy({
        by: ["tagId"],
        _count: { _all: true }
      });
      const countByTagId = new Map(grouped.map((row) => [row.tagId, row._count._all]));

      for (const tag of tags) {
        await tx.tag.update({
          where: { id: tag.id },
          data: { bookmarkCount: countByTagId.get(tag.id) ?? 0 }
        });
      }

      const counts = {
        tags: await tx.tag.count({ where: { scope: "APP" } }),
        bookmarks: await tx.bookmark.count({ where: { scope: "APP" } }),
        bookmarkTags: await tx.bookmarkTag.count({
          where: {
            OR: [
              { bookmark: { scope: "APP" } },
              { tag: { scope: "APP" } }
            ]
          }
        })
      };

      return { counts, tagCountRequested: tags.length, bookmarkCountRequested: bookmarks.length };
    });

    if (result.counts.tags !== EXPECTED_TAG_COUNT || result.counts.bookmarks !== EXPECTED_BOOKMARK_COUNT) {
      throw new Error(
        `Seed count mismatch. expected tags=${EXPECTED_TAG_COUNT}, bookmarks=${EXPECTED_BOOKMARK_COUNT}; got tags=${result.counts.tags}, bookmarks=${result.counts.bookmarks}`
      );
    }

    console.log(`Seed completed. APP tags=${result.counts.tags}, bookmarks=${result.counts.bookmarks}, bookmarkTags=${result.counts.bookmarkTags}`);
    return result;
  } finally {
    await prisma.$disconnect();
  }
}

seedAppData().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
