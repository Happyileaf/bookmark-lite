import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function run(command, args, captureStdout = false) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      stdio: captureStdout ? ["inherit", "pipe", "inherit"] : "inherit",
    });

    let stdout = "";
    if (captureStdout && child.stdout) {
      child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
      });
    }

    child.on("error", (error) => {
      rejectPromise(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise(stdout);
        return;
      }
      rejectPromise(new Error(`${command} exited with code ${code}`));
    });
  });
}

function resolveBinary(binaryName, envVarName) {
  const envPath = process.env[envVarName];
  if (envPath && existsSync(envPath)) {
    return envPath;
  }

  if (process.platform === "win32") {
    const candidates = [
      `C:\\Program Files\\PostgreSQL\\17\\bin\\${binaryName}.exe`,
      `C:\\Program Files\\PostgreSQL\\16\\bin\\${binaryName}.exe`,
      `C:\\Program Files\\PostgreSQL\\15\\bin\\${binaryName}.exe`,
      `C:\\Program Files\\PostgreSQL\\14\\bin\\${binaryName}.exe`,
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return binaryName;
}

function toPsqlUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  url.searchParams.delete("schema");
  return url.toString();
}

function quoteSqlString(value) {
  return value.replace(/'/g, "''");
}

function quoteIdentifier(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildTempDbUrl(originalUrl, tempDbName) {
  const url = new URL(originalUrl);
  url.pathname = `/${tempDbName}`;
  return url.toString();
}

async function countAppData(databaseUrl) {
  const prisma = new PrismaClient({
    datasourceUrl: databaseUrl,
  });
  try {
    return await prisma.$transaction(async (tx) => ({
      bookmarks: await tx.bookmark.count({ where: { scope: "APP" } }),
      tags: await tx.tag.count({ where: { scope: "APP" } }),
      bookmarkTags: await tx.bookmarkTag.count({
        where: {
          OR: [{ bookmark: { scope: "APP" } }, { tag: { scope: "APP" } }],
        },
      }),
    }));
  } finally {
    await prisma.$disconnect();
  }
}

function sameCounts(left, right) {
  return (
    left.bookmarks === right.bookmarks &&
    left.tags === right.tags &&
    left.bookmarkTags === right.bookmarkTags
  );
}

async function createTempDatabase(psql, adminUrl, tempDbName) {
  const createSql = `CREATE DATABASE ${quoteIdentifier(tempDbName)};`;
  await run(psql, [adminUrl, "-v", "ON_ERROR_STOP=1", "-c", createSql]);
}

async function dropTempDatabase(psql, adminUrl, tempDbName) {
  // 断开所有连接后再删
  const terminateSql = `
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = '${quoteSqlString(tempDbName)}' AND pid <> pg_backend_pid();
  `;
  await run(psql, [adminUrl, "-c", terminateSql]).catch(() => {});

  const dropSql = `DROP DATABASE IF EXISTS ${quoteIdentifier(tempDbName)};`;
  await run(psql, [adminUrl, "-v", "ON_ERROR_STOP=1", "-c", dropSql]);
}

async function main() {
  loadEnvFile();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Please set it in your environment or .env.");
  }

  const psqlUrl = toPsqlUrl(databaseUrl);
  const originalDbName = decodeURIComponent(new URL(psqlUrl).pathname.replace(/^\//, ""));
  if (!originalDbName) {
    throw new Error("DATABASE_URL has no database name in path.");
  }

  const backupArg = process.argv[2];
  const backupPath = resolve(backupArg ?? `backups/roundtrip-${timestamp()}.sql`);
  mkdirSync(dirname(backupPath), { recursive: true });

  const psql = resolveBinary("psql", "PSQL_PATH");
  const pgDump = resolveBinary("pg_dump", "PG_DUMP_PATH");

  const node = process.execPath;
  const exportScript = resolve("scripts/db/db-export.mjs");
  const importScript = resolve("scripts/db/db-import.mjs");

  // 临时库名：原库名 + _roundtrip_ + 随机后缀
  const tempDbName = `${originalDbName}_roundtrip_${randomBytes(4).toString("hex")}`;
  const tempDbUrl = buildTempDbUrl(psqlUrl, tempDbName);

  // 管理库连接（连到 postgres 系统库来建/删库）
  const adminUrl = new URL(psqlUrl);
  adminUrl.pathname = "/postgres";

  let cleanupDone = false;
  const cleanup = async () => {
    if (cleanupDone) return;
    cleanupDone = true;
    console.log(`[roundtrip] Cleaning up temp database: ${tempDbName}`);
    try {
      await dropTempDatabase(psql, adminUrl.toString(), tempDbName);
      console.log(`[roundtrip] Temp database dropped.`);
    } catch (err) {
      console.error(`[roundtrip] Warning: failed to drop temp database: ${err.message}`);
    }
  };

  // 进程异常退出时也要清理
  process.on("SIGINT", async () => {
    await cleanup();
    process.exit(1);
  });
  process.on("SIGTERM", async () => {
    await cleanup();
    process.exit(1);
  });

  try {
    // 1. 统计原库 APP 数据
    console.log(`[roundtrip] Counting APP data in source database (${originalDbName})...`);
    const before = await countAppData(psqlUrl);
    console.log(`[roundtrip] Source APP counts: ${JSON.stringify(before)}`);

    // 2. 导出备份
    console.log(`[roundtrip] Exporting backup to: ${backupPath}`);
    await run(node, [exportScript, backupPath]);

    // 3. 创建临时数据库
    console.log(`[roundtrip] Creating temp database: ${tempDbName}`);
    try {
      await createTempDatabase(psql, adminUrl.toString(), tempDbName);
    } catch (err) {
      if (err.message.includes("permission denied") || err.message.includes("CREATE DATABASE")) {
        console.error(
          "[roundtrip] Error: Unable to create temporary database. " +
            "Your database user may not have CREATEDB permission. " +
            "This is common with managed databases like Neon/Supabase."
        );
      }
      throw err;
    }

    // 4. 导入到临时库
    console.log(`[roundtrip] Importing backup into temp database...`);
    const originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = tempDbUrl; // db-import.mjs 读 DATABASE_URL
    try {
      await run(node, [importScript, backupPath]);
    } finally {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }

    // 5. 统计临时库 APP 数据
    console.log(`[roundtrip] Counting APP data in temp database...`);
    const afterImport = await countAppData(tempDbUrl);
    console.log(`[roundtrip] Temp APP counts: ${JSON.stringify(afterImport)}`);

    // 6. 对比
    if (!sameCounts(before, afterImport)) {
      throw new Error(
        `Roundtrip mismatch. source=${JSON.stringify(before)}, temp=${JSON.stringify(afterImport)}`
      );
    }

    console.log(`[roundtrip] PASS. APP counts match. backup=${backupPath}`);
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error.message);
  if (error.code === "ENOENT") {
    console.error("psql/pg_dump not found. Install PostgreSQL client tools and set PATH, or set PSQL_PATH/PG_DUMP_PATH.");
  }
  process.exit(1);
});
