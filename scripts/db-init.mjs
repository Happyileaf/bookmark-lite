import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

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
      stdio: captureStdout ? ["inherit", "pipe", "inherit"] : "inherit"
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

function toPsqlUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  // Prisma connection URLs often include `schema`, but psql/libpq doesn't support it.
  url.searchParams.delete("schema");
  return url.toString();
}

function quoteSqlString(value) {
  return value.replace(/'/g, "''");
}

function quoteIdentifier(value) {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

async function main() {
  loadEnvFile();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Please set it in your environment or .env.");
  }
  const psqlUrl = toPsqlUrl(databaseUrl);

  const backupArg = process.argv[2];
  if (!backupArg) {
    throw new Error("Usage: npm run db:init -- <backup-file.sql>");
  }

  const backupPath = resolve(backupArg);
  if (!existsSync(backupPath)) {
    throw new Error(`Backup file does not exist: ${backupPath}`);
  }

  const url = new URL(psqlUrl);
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!databaseName) {
    throw new Error("DATABASE_URL has no database name in path.");
  }

  const psql = resolveBinary("psql", "PSQL_PATH");

  const adminUrl = new URL(psqlUrl);
  adminUrl.pathname = "/postgres";

  const checkSql = `SELECT 1 FROM pg_database WHERE datname='${quoteSqlString(databaseName)}';`;
  const existsRaw = await run(
    psql,
    [adminUrl.toString(), "-tAc", checkSql],
    true
  );
  const exists = existsRaw.trim() === "1";

  if (!exists) {
    console.log(`Database not found, creating: ${databaseName}`);
    const createSql = `CREATE DATABASE ${quoteIdentifier(databaseName)};`;
    await run(psql, [adminUrl.toString(), "-v", "ON_ERROR_STOP=1", "-c", createSql]);
  } else {
    console.log(`Database already exists: ${databaseName}`);
  }

  await run(psql, [psqlUrl, "-v", "ON_ERROR_STOP=1", "-f", backupPath]);
  console.log(`Database initialized from backup: ${backupPath}`);
}

main().catch((error) => {
  console.error(error.message);
  if (error.code === "ENOENT") {
    console.error("psql not found. Install PostgreSQL client tools and set PATH, or set PSQL_PATH.");
  }
  process.exit(1);
});
