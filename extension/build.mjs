import * as esbuild from "esbuild";
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const isWatch = process.argv.includes("--watch");
const __dirname = dirname(fileURLToPath(import.meta.url));

/** esbuild 构建上下文配置 */
const buildOptions = {
  entryPoints: {
    background: "src/background.ts",
    popup: "src/popup.ts",
  },
  bundle: true,
  outdir: "dist",
  format: "esm",
  target: "es2020",
  sourcemap: false,
  legalComments: "none",
};

/**
 * 复制静态资源到 dist
 *
 * description manifest.json / popup.html / icons 不需打包，直接拷贝
 */
function copyStaticAssets() {
  mkdirSync(resolve(__dirname, "dist"), { recursive: true });
  for (const file of ["manifest.json", "popup.html"]) {
    cpSync(resolve(__dirname, file), resolve(__dirname, "dist", file));
  }
  const iconsSrc = resolve(__dirname, "icons");
  if (existsSync(iconsSrc)) {
    cpSync(iconsSrc, resolve(__dirname, "dist", "icons"), { recursive: true });
  }
}

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  copyStaticAssets();
  console.log("[extension] watching...");
} else {
  await esbuild.build(buildOptions);
  copyStaticAssets();
  console.log("[extension] build done");
}
