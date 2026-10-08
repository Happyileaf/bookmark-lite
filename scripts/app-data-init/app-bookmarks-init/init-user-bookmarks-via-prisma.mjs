import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  EXPECTED_BOOKMARK_COUNT,
  EXPECTED_TAG_COUNT,
  buildSeedData,
} from "./build-init-dataset.mjs";

function uuidFromSeed(seed) {
  const hex = createHash("md5").update(seed).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function seedUserData(userEmail) {
  loadEnvFile();
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Please set it in your environment or .env.");
  }

  if (!userEmail) {
    throw new Error("Usage: node init-user-bookmarks-via-prisma.mjs <user-email>");
  }

  const prisma = new PrismaClient();

  try {
    // 1. 查找目标用户
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) {
      throw new Error(`User not found: ${userEmail}`);
    }
    const userId = user.id;
    console.log(`Target user: ${user.email} (id=${userId})`);

    // 2. 构建种子数据（复用公共书签库的数据源）
    const { tags, bookmarks } = buildSeedData();

    // 3. 在事务中写入用户个人数据（scope=USER, ownerUserId=userId, scopeOwnerKey=userId）
    const result = await prisma.$transaction(
      async (tx) => {
      // 先清空该用户现有的个人书签和标签
      await tx.bookmarkTag.deleteMany({
        where: {
          OR: [
            { bookmark: { scope: "USER", ownerUserId: userId } },
            { tag: { scope: "USER", ownerUserId: userId } },
          ],
        },
      });
      await tx.bookmark.deleteMany({ where: { scope: "USER", ownerUserId: userId } });
      await tx.tag.deleteMany({ where: { scope: "USER", ownerUserId: userId } });

      // 生成用户作用域的独立 ID（基于用户 ID + 原始 key 生成，避免与 APP 作用域冲突）
      const userTagIds = new Map(tags.map((tag) => [tag.key, uuidFromSeed(`user:${userId}:tag:${tag.key}`)]));
      const userBookmarkIds = new Map(bookmarks.map((b) => [b.normalizedUrl, uuidFromSeed(`user:${userId}:bookmark:${b.normalizedUrl}`)]));

      // 插入标签（scope=USER，归属该用户）
      await tx.tag.createMany({
        data: tags.map((tag) => ({
          id: userTagIds.get(tag.key),
          scope: "USER",
          ownerUserId: userId,
          name: tag.name,
          color: tag.color,
          description: tag.description,
          sortOrder: tag.sortOrder,
          bookmarkCount: 0,
          scopeOwnerKey: userId,
        })),
      });

      // 插入书签（scope=USER，归属该用户）
      await tx.bookmark.createMany({
        data: bookmarks.map((bookmark) => ({
          id: userBookmarkIds.get(bookmark.normalizedUrl),
          scope: "USER",
          ownerUserId: userId,
          title: bookmark.title,
          url: bookmark.url,
          normalizedUrl: bookmark.normalizedUrl,
          description: bookmark.description,
          isFavorite: bookmark.isFavorite,
          isVisible: bookmark.isVisible,
          scopeOwnerKey: userId,
          createdAt: new Date(bookmark.createdAt),
          updatedAt: new Date(bookmark.createdAt),
        })),
      });

      // 插入书签-标签关联
      const bookmarkTagRows = bookmarks.flatMap((bookmark) =>
        bookmark.tagKeys.map((tagKey) => {
          const tagId = userTagIds.get(tagKey);
          if (!tagId) {
            throw new Error(`Missing tag id for key: ${tagKey}`);
          }
          return {
            bookmarkId: userBookmarkIds.get(bookmark.normalizedUrl),
            tagId,
          };
        })
      );

      await tx.bookmarkTag.createMany({
        data: bookmarkTagRows,
      });

      // 更新每个标签的 bookmark_count
      const grouped = await tx.bookmarkTag.groupBy({
        by: ["tagId"],
        _count: { _all: true },
      });
      const countByTagId = new Map(grouped.map((row) => [row.tagId, row._count._all]));

      for (const tag of tags) {
        const tagId = userTagIds.get(tag.key);
        await tx.tag.update({
          where: { id: tagId },
          data: { bookmarkCount: countByTagId.get(tagId) ?? 0 },
        });
      }

      const counts = {
        tags: await tx.tag.count({ where: { scope: "USER", ownerUserId: userId } }),
        bookmarks: await tx.bookmark.count({ where: { scope: "USER", ownerUserId: userId } }),
        bookmarkTags: await tx.bookmarkTag.count({
          where: {
            OR: [
              { bookmark: { scope: "USER", ownerUserId: userId } },
              { tag: { scope: "USER", ownerUserId: userId } },
            ],
          },
        }),
      };

      return { counts, tagCountRequested: tags.length, bookmarkCountRequested: bookmarks.length };
      },
      {
        maxWait: 30000,
        timeout: 60000,
      }
    );

    // 校验数量
    if (
      result.counts.tags !== EXPECTED_TAG_COUNT ||
      result.counts.bookmarks !== EXPECTED_BOOKMARK_COUNT
    ) {
      throw new Error(
        `Seed count mismatch. expected tags=${EXPECTED_TAG_COUNT}, bookmarks=${EXPECTED_BOOKMARK_COUNT}; got tags=${result.counts.tags}, bookmarks=${result.counts.bookmarks}`
      );
    }

    console.log(
      `Seed completed for ${userEmail}: tags=${result.counts.tags}, bookmarks=${result.counts.bookmarks}, bookmarkTags=${result.counts.bookmarkTags}`
    );
    return result;
  } finally {
    await prisma.$disconnect();
  }
}

const userEmail = process.argv[2];
seedUserData(userEmail).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
