import { NextRequest } from "next/server";
import * as cheerio from "cheerio";

const TIMEOUT = 8000;
const MAX_CONTENT_LENGTH = 2 * 1024 * 1024; // 2MB

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body?.url;

    if (typeof url !== "string" || !url.trim()) {
      return Response.json(
        { ok: false, error: { message: "缺少有效的 URL 参数" } },
        { status: 400 },
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(url.trim());
    } catch {
      return Response.json(
        { ok: false, error: { message: "URL 格式不正确" } },
        { status: 400 },
      );
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return Response.json(
        { ok: false, error: { message: "仅支持 HTTP/HTTPS 协议" } },
        { status: 400 },
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(parsed.href, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BookmarkLite/1.0)",
      },
    });

    clearTimeout(timer);

    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          error: { message: `请求失败，状态码 ${response.status}` },
        },
        { status: 422 },
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return Response.json(
        {
          ok: false,
          error: { message: "目标地址不是 HTML 页面" },
        },
        { status: 422 },
      );
    }

    const html = await response.text();

    if (html.length > MAX_CONTENT_LENGTH) {
      return Response.json(
        {
          ok: false,
          error: { message: "页面内容过大，无法解析" },
        },
        { status: 422 },
      );
    }

    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").text() ||
      $("h1").first().text() ||
      "";

    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    // 解析 favicon
    let favicon =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      $('link[rel="apple-touch-icon"]').attr("href") ||
      $('meta[property="og:image"]').attr("content") ||
      "";

    if (favicon) {
      favicon = resolveUrl(parsed.href, favicon);
    } else {
      // fallback: 尝试根目录 favicon.ico
      favicon = `${parsed.protocol}//${parsed.host}/favicon.ico`;
    }

    return Response.json({
      ok: true,
      data: {
        title: title.trim(),
        description: description.trim(),
        favicon,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(
        { ok: false, error: { message: "请求超时，请检查网络或目标网站" } },
        { status: 504 },
      );
    }

    const message = error instanceof Error ? error.message : "解析失败";
    return Response.json(
      { ok: false, error: { message } },
      { status: 500 },
    );
  }
}
