import { requireApiTokenUser } from "@/server/auth/api-token-guard";
import { bookmarkService } from "@/server/services/bookmark.service";
import { extensionBookmarkCreateSchema } from "@/server/validators/extension.schema";
import { AppError, isAppError } from "@/server/types/errors";

export const dynamic = "force-dynamic";

/** 允许的扩展来源（生产填固定扩展 ID 来源，开发期放宽） */
const ALLOWED_ORIGIN = process.env.EXTENSION_ALLOWED_ORIGIN ?? "*";

/**
 * 设置 CORS 响应头
 *
 * @description 插件 service worker 跨域调用所需；接口仅接受 Bearer，不读 Cookie，放宽 Origin 无会话劫持风险
 * @param response - 原始 Response
 * @returns 带有 CORS 头的新 Response
 */
function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * 处理 CORS 预检请求
 *
 * @description 返回 204 及 CORS 头
 * @returns 204 空响应
 */
function handlePreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

export async function OPTIONS() {
  return handlePreflight();
}

/**
 * 收藏书签（浏览器插件专用）
 *
 * @description Bearer Token 鉴权，scope 固定 USER，复用 bookmarkService.create；
 * URL 重复（BOOKMARK_DUPLICATE_URL）转换为 200 + alreadyExists，符合"已存在则跳过"约定
 * @param request - HTTP 请求
 * @returns 统一信封响应
 */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireApiTokenUser(request);

    const body = await request.json();
    const parsed = extensionBookmarkCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "书签参数校验失败",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    // title 缺省时回退为 URL host，保证非空
    const title =
      parsed.data.title ||
      (() => {
        try {
          return new URL(parsed.data.url).host;
        } catch {
          return parsed.data.url.slice(0, 300);
        }
      })();

    try {
      const bookmark = await bookmarkService.create(
        {
          scope: "USER",
          title,
          url: parsed.data.url,
          favicon: parsed.data.favicon || "",
          tagNames: parsed.data.tags ?? [],
        },
        user,
      );
      return withCors(
        Response.json(
          { ok: true, data: { id: bookmark.id, alreadyExists: false }, requestId },
          { status: 200 },
        ),
      );
    } catch (error) {
      // 去重命中：转换为已存在语义
      if (isAppError(error) && error.code === "BOOKMARK_DUPLICATE_URL") {
        return withCors(
          Response.json(
            { ok: true, data: { alreadyExists: true }, requestId },
            { status: 200 },
          ),
        );
      }
      throw error;
    }
  } catch (error) {
    if (isAppError(error)) {
      return withCors(
        Response.json(
          {
            ok: false,
            error: {
              code: error.code,
              message: error.message,
              fieldErrors: error.fieldErrors,
            },
            requestId,
          },
          { status: error.status },
        ),
      );
    }

    return withCors(
      Response.json(
        {
          ok: false,
          error: { code: "INTERNAL_ERROR", message: "收藏书签失败" },
          requestId,
        },
        { status: 500 },
      ),
    );
  }
}
