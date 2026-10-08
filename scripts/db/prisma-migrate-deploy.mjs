import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

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
  const env = { ...process.env };
  if (env.DIRECT_URL) {
    // For Neon/Supabase/RDS with poolers, run migrations on direct connection.
    env.DATABASE_URL = env.DIRECT_URL;
  }

  await runPrisma(["migrate", "deploy", "--schema", "prisma/schema.prisma"], env);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
