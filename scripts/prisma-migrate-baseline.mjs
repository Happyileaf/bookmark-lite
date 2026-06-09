import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

function resolvePrismaBin() {
  const localBin = resolve(
    "node_modules",
    ".bin",
    process.platform === "win32" ? "prisma.cmd" : "prisma"
  );
  if (existsSync(localBin)) return localBin;
  return "prisma";
}

function runPrisma(args, env) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(resolvePrismaBin(), args, {
      stdio: "inherit",
      env
    });

    child.on("error", rejectPromise);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(`prisma exited with code ${code}`));
    });
  });
}

async function main() {
  const migrationName = process.argv[2] ?? "20260609193000_init";
  const env = { ...process.env };
  if (env.DIRECT_URL) {
    env.DATABASE_URL = env.DIRECT_URL;
  }

  const status = spawnSync(
    resolvePrismaBin(),
    ["migrate", "status", "--schema", "prisma/schema.prisma"],
    {
      env,
      encoding: "utf8"
    }
  );
  const statusOutput = `${status.stdout ?? ""}${status.stderr ?? ""}`;
  if (status.status === 0 && statusOutput.includes("Database schema is up to date!")) {
    console.log("Migration history is already in sync. Skip baseline.");
    return;
  }

  await runPrisma(
    [
      "migrate",
      "resolve",
      "--applied",
      migrationName,
      "--schema",
      "prisma/schema.prisma"
    ],
    env
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
