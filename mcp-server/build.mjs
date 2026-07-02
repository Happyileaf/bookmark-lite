import * as esbuild from "esbuild";
import { chmodSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const isWatch = process.argv.includes("--watch");
const __dirname = dirname(fileURLToPath(import.meta.url));
const nodeEnv = process.env.NODE_ENV === "production" ? "production" : "development";

const outfile = resolve(__dirname, "dist", "index.js");

/** esbuild 构建配置：打包为单文件 ESM，通过 define 在构建期注入环境 */
const buildOptions = {
  entryPoints: [resolve(__dirname, "src", "index.ts")],
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  sourcemap: false,
  legalComments: "none",
  banner: { js: "#!/usr/bin/env node" },
  packages: "external",
  define: {
    "process.env.NODE_ENV": JSON.stringify(nodeEnv),
  },
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log(`[bookmark-lite-mcp] watching... (NODE_ENV=${nodeEnv})`);
} else {
  await esbuild.build(buildOptions);
  chmodSync(outfile, 0o755);
  console.log(`[bookmark-lite-mcp] build done (NODE_ENV=${nodeEnv}) -> ${outfile}`);
}
