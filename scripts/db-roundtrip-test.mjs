import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { PrismaClient } from "@prisma/client";

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
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
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function run(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { stdio: "inherit" });

    child.on("error", (error) => {
      rejectPromise(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(`${command} exited with code ${code}`));
    });
  });
}

function sameCounts(left, right) {
  return (
    left.bookmarks === right.bookmarks
    && left.tags === right.tags
    && left.bookmarkTags === right.bookmarkTags
  );
}

async function countAppDataRaw(client) {
  return {
    bookmarks: await client.bookmark.count({ where: { scope: "APP" } }),
    tags: await client.tag.count({ where: { scope: "APP" } }),
    bookmarkTags: await client.bookmarkTag.count({
      where: {
        OR: [
          { bookmark: { scope: "APP" } },
          { tag: { scope: "APP" } }
        ]
      }
    })
  };
}

async function countAppData(prisma) {
  return prisma.$transaction(async (tx) => countAppDataRaw(tx));
}

async function clearAppData(prisma) {
  return prisma.$transaction(async (tx) => {
    const deletedBookmarkTags = await tx.bookmarkTag.deleteMany({
      where: {
        OR: [
          { bookmark: { scope: "APP" } },
          { tag: { scope: "APP" } }
        ]
      }
    });
    const deletedBookmarks = await tx.bookmark.deleteMany({ where: { scope: "APP" } });
    const deletedTags = await tx.tag.deleteMany({ where: { scope: "APP" } });

    const remaining = await countAppDataRaw(tx);

    return {
      deleted: {
        bookmarkTags: deletedBookmarkTags.count,
        bookmarks: deletedBookmarks.count,
        tags: deletedTags.count
      },
      remaining
    };
  });
}

async function main() {
  loadEnvFile();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Please set it in your environment or .env.");
  }

  const backupArg = process.argv[2];
  const backupPath = resolve(backupArg ?? `backups/roundtrip-${timestamp()}.sql`);
  mkdirSync(dirname(backupPath), { recursive: true });

  const prisma = new PrismaClient();
  const node = process.execPath;
  const exportScript = resolve("scripts/db-export.mjs");
  const importScript = resolve("scripts/db-import.mjs");

  try {
    const before = await countAppData(prisma);
    console.log(`[roundtrip] APP counts before export: ${JSON.stringify(before)}`);
    console.log(`[roundtrip] Exporting backup to: ${backupPath}`);
    await run(node, [exportScript, backupPath]);

    const cleared = await clearAppData(prisma);
    console.log(`[roundtrip] APP rows deleted: ${JSON.stringify(cleared.deleted)}`);
    console.log(`[roundtrip] APP counts after clear: ${JSON.stringify(cleared.remaining)}`);

    if (!sameCounts(cleared.remaining, { bookmarks: 0, tags: 0, bookmarkTags: 0 })) {
      throw new Error(`APP data cleanup failed, remaining rows: ${JSON.stringify(cleared.remaining)}`);
    }

    console.log(`[roundtrip] Importing backup from: ${backupPath}`);
    await run(node, [importScript, backupPath]);

    const afterImport = await countAppData(prisma);
    console.log(`[roundtrip] APP counts after import: ${JSON.stringify(afterImport)}`);

    if (!sameCounts(before, afterImport)) {
      throw new Error(
        `Roundtrip mismatch for APP counts. before=${JSON.stringify(before)}, afterImport=${JSON.stringify(afterImport)}`
      );
    }

    console.log(`[roundtrip] PASS. APP counts restored and verified. backup=${backupPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
