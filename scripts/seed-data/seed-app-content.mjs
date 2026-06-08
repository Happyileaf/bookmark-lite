import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { APP_SEED_BOOKMARK_GROUPS, APP_SEED_TAGS } from "./app-initial-content.mjs";

const APP_SCOPE_KEY = "APP";
const EXPECTED_TAG_COUNT = 10;
const EXPECTED_BOOKMARK_COUNT = 150;

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

function uuidFromSeed(seed) {
  const hex = createHash("md5").update(seed).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function canonicalizeUrl(rawUrl) {
  const url = new URL(rawUrl);
  url.hash = "";
  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  return url.toString();
}

function buildSeedData() {
  if (APP_SEED_TAGS.length !== EXPECTED_TAG_COUNT) {
    throw new Error(`Tag count must be ${EXPECTED_TAG_COUNT}, got ${APP_SEED_TAGS.length}.`);
  }

  const tagKeySet = new Set();
  const tags = APP_SEED_TAGS.map((tag, index) => {
    if (tagKeySet.has(tag.key)) {
      throw new Error(`Duplicate tag key: ${tag.key}`);
    }
    tagKeySet.add(tag.key);

    return {
      id: uuidFromSeed(`app-tag:${tag.key}`),
      key: tag.key,
      name: tag.name,
      color: tag.color,
      description: tag.description ?? "",
      sortOrder: (index + 1) * 10
    };
  });

  const bookmarks = [];
  for (const group of APP_SEED_BOOKMARK_GROUPS) {
    if (!tagKeySet.has(group.tagKey)) {
      throw new Error(`Unknown group tagKey: ${group.tagKey}`);
    }
    for (const item of group.bookmarks) {
      const normalizedUrl = canonicalizeUrl(item.url);
      const combinedTagKeys = Array.from(new Set([group.tagKey, ...(item.tagKeys ?? [])]));
      for (const tagKey of combinedTagKeys) {
        if (!tagKeySet.has(tagKey)) {
          throw new Error(`Bookmark "${item.title}" references unknown tag key: ${tagKey}`);
        }
      }

      bookmarks.push({
        id: uuidFromSeed(`app-bookmark:${normalizedUrl}`),
        title: item.title,
        url: item.url,
        normalizedUrl,
        description: item.description ?? "",
        isFavorite: item.isFavorite ?? false,
        isVisible: item.isVisible ?? true,
        tagKeys: combinedTagKeys
      });
    }
  }

  if (bookmarks.length !== EXPECTED_BOOKMARK_COUNT) {
    throw new Error(`Bookmark count must be ${EXPECTED_BOOKMARK_COUNT}, got ${bookmarks.length}.`);
  }

  const normalizedSet = new Set();
  for (const bookmark of bookmarks) {
    if (!bookmark.url.startsWith("http://") && !bookmark.url.startsWith("https://")) {
      throw new Error(`Bookmark URL must start with http(s): ${bookmark.url}`);
    }
    if (normalizedSet.has(bookmark.normalizedUrl)) {
      throw new Error(`Duplicate normalized URL: ${bookmark.normalizedUrl}`);
    }
    normalizedSet.add(bookmark.normalizedUrl);
  }

  return { tags, bookmarks };
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
          scopeOwnerKey: APP_SCOPE_KEY
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
