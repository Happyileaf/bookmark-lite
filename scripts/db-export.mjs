import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
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
      `C:\\Program Files\\PostgreSQL\\14\\bin\\${binaryName}.exe`
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return binaryName;
}

function toPgDumpUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  // Prisma connection URLs often include `schema`, but pg_dump/libpq doesn't support it.
  url.searchParams.delete("schema");
  return url.toString();
}

async function main() {
  if (!process.env.DATABASE_URL) {
    const envPath = resolve(".env");
    if (existsSync(envPath)) {
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
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Please set it in your environment or .env.");
  }

  const outputArg = process.argv[2];
  const outputPath = resolve(outputArg ?? `backups/bookmark-lite-${timestamp()}.sql`);

  mkdirSync(dirname(outputPath), { recursive: true });

  const pgDump = resolveBinary("pg_dump", "PG_DUMP_PATH");

  const pgDumpUrl = toPgDumpUrl(databaseUrl);

  await run(pgDump, [
    "--dbname",
    pgDumpUrl,
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    "--encoding",
    "UTF8",
    "--file",
    outputPath
  ]);

  console.log(`Database exported to: ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  if (error.code === "ENOENT") {
    console.error("pg_dump not found. Install PostgreSQL client tools and set PATH, or set PG_DUMP_PATH.");
  }
  process.exit(1);
});
