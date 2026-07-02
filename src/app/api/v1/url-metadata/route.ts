import { NextRequest } from "next/server";
import * as cheerio from "cheerio";
import { requireApiTokenUser } from "@/server/auth/api-token-guard";
import { AppError } from "@/server/types/errors";
import { successResponse, errorResponse } from "@/app/api/v1/_lib";

export const dynamic = "force-dynamic";

const TIMEOUT = 8000;
const MAX_CONTENT_LENGTH = 2 * 1024 * 1024; // 2MB

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

async function fetchUrlMetadata(rawUrl: unknown): Promise<{
  title: string;
  description: string;
  favicon: string;
}> {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    throw new AppError("VALIDATION_FAILED", "缺少有效的 URL 参数", 422);
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new AppError("VALIDATION_FAILED", "URL 格式不正确", 422);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new AppError("VALIDATION_FAILED", "仅支持 HTTP/HTTPS 协议", 422);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  let response: Response;
  try {
    response = await fetch(parsed.href, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BookmarkLite/1.0)",
      },
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new AppError(
      "FETCH_FAILED",
      `请求失败，状态码 ${response.status}`,
      422,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new AppError("FETCH_FAILED", "目标地址不是 HTML 页面", 422);
  }

  const html = await response.text();

  if (html.length > MAX_CONTENT_LENGTH) {
    throw new AppError("FETCH_FAILED", "页面内容过大，无法解析", 422);
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

  return {
    title: title.trim(),
    description: description.trim(),
    favicon,
  };
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    await requireApiTokenUser(request);

    const body = await request.json();
    const data = await fetchUrlMetadata(body?.url);

    return successResponse(data, requestId);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(
        {
          ok: false,
          error: {
            code: "FETCH_TIMEOUT",
            message: "请求超时，请检查网络或目标网站",
          },
          requestId,
        },
        { status: 504 },
      );
    }

    return errorResponse(error, requestId, "解析失败");
  }
}
