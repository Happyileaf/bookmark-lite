import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

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

  const inputArg = process.argv[2];
  if (!inputArg) {
    throw new Error("Usage: npm run db:import -- <backup-file.sql>");
  }

  const inputPath = resolve(inputArg);
  if (!existsSync(inputPath)) {
    throw new Error(`Backup file does not exist: ${inputPath}`);
  }

  const psql = resolveBinary("psql", "PSQL_PATH");

  await run(psql, [
    databaseUrl,
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    inputPath
  ]);

  console.log(`Database imported from: ${inputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  if (error.code === "ENOENT") {
    console.error("psql not found. Install PostgreSQL client tools and set PATH, or set PSQL_PATH.");
  }
  process.exit(1);
});
