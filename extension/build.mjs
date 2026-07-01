import * as esbuild from "esbuild";
import { cpSync, mkdirSync, existsSync, rmSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";

const isWatch = process.argv.includes("--watch");
const __dirname = dirname(fileURLToPath(import.meta.url));
const nodeEnv = process.env.NODE_ENV === "production" ? "production" : "development";

/** 版本号单一来源：读取 package.json，注入 manifest 与 zip 文件名 */
const { version } = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8"));

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
 * description popup.html / icons 直接拷贝；manifest.json 注入 package.json 的版本号后写入
 */
function copyStaticAssets() {
  mkdirSync(resolve(__dirname, "dist"), { recursive: true });
  cpSync(resolve(__dirname, "popup.html"), resolve(__dirname, "dist", "popup.html"));
  const manifest = JSON.parse(readFileSync(resolve(__dirname, "manifest.json"), "utf8"));
  manifest.version = version;
  writeFileSync(resolve(__dirname, "dist", "manifest.json"), JSON.stringify(manifest, null, 2));
  const iconsSrc = resolve(__dirname, "icons");
  if (existsSync(iconsSrc)) {
    cpSync(iconsSrc, resolve(__dirname, "dist", "icons"), { recursive: true });
  }
}

/**
 * 将 dist 内容打包为 zip 并覆盖分发目录下的压缩包
 *
 * description manifest.json 需位于 zip 根目录，故在 dist 内打包其内容；
 * 输出带版本号的包与一个固定名的 latest 包，均写入 Next 项目的 public/downloads；
 * 使用纯 JS 的 adm-zip 打包，避免依赖系统 zip 命令，保证跨平台可移植
 */
function packageExtension() {
  const distDir = resolve(__dirname, "dist");
  const downloadsDir = resolve(__dirname, "..", "public", "downloads");
  const versionedZip = resolve(downloadsDir, `bookmark-lite-extension-${version}.zip`);
  const latestZip = resolve(downloadsDir, "bookmark-lite-extension.zip");
  mkdirSync(downloadsDir, { recursive: true });
  rmSync(versionedZip, { force: true });
  rmSync(latestZip, { force: true });

  const zip = new AdmZip();
  addDirToZip(zip, distDir, "");
  zip.writeZip(versionedZip);
  cpSync(versionedZip, latestZip);
  return { versionedZip, latestZip };
}

/**
 * 递归将目录加入 zip
 *
 * @param zip - adm-zip 实例
 * @param absDir - 待打包的绝对目录
 * @param zipDir - 在 zip 内的相对目录
 */
function addDirToZip(zip, absDir, zipDir) {
  for (const entry of readdirSync(absDir)) {
    const absPath = join(absDir, entry);
    if (statSync(absPath).isDirectory()) {
      const subZipDir = zipDir ? `${zipDir}/${entry}` : entry;
      addDirToZip(zip, absPath, subZipDir);
    } else {
      zip.addLocalFile(absPath, zipDir);
    }
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
  const { versionedZip, latestZip } = packageExtension();
  console.log(`[extension] packaged v${version} -> ${versionedZip}`);
  console.log(`[extension] latest -> ${latestZip}`);
}
