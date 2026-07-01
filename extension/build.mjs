import * as esbuild from "esbuild";
import { cpSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const isWatch = process.argv.includes("--watch");
const __dirname = dirname(fileURLToPath(import.meta.url));
const nodeEnv = process.env.NODE_ENV === "production" ? "production" : "development";

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
  define: {
    "process.env.NODE_ENV": JSON.stringify(nodeEnv),
  },
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

/**
 * 将 dist 内容打包为 zip 并覆盖分发目录下的压缩包
 *
 * description manifest.json 需位于 zip 根目录，故在 dist 内打包其内容；
 * 仅在生产构建时执行，输出到 Next 项目的 public/downloads
 */
function packageExtension() {
  const distDir = resolve(__dirname, "dist");
  const outputZip = resolve(__dirname, "..", "public", "downloads", "bookmark-lite-extension.zip");
  mkdirSync(dirname(outputZip), { recursive: true });
  rmSync(outputZip, { force: true });
  execFileSync("zip", ["-r", "-q", outputZip, "."], { cwd: distDir });
  return outputZip;
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
  const outputZip = packageExtension();
  console.log(`[extension] packaged -> ${outputZip}`);
}
