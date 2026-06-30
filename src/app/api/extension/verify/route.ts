import { requireApiTokenUser } from "@/server/auth/api-token-guard";
import { isAppError } from "@/server/types/errors";

export const dynamic = "force-dynamic";

/** 允许的扩展来源（生产填固定扩展 ID 来源，开发期放宽） */
const ALLOWED_ORIGIN = process.env.EXTENSION_ALLOWED_ORIGIN ?? "*";

/** CORS 响应头 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * 校验 API Token 有效性
 *
 * @description 供浏览器插件保存 Token 时调用；Bearer 鉴权通过返回 200，无效返回 401
 * @param request - HTTP 请求
 * @returns 统一信封响应
 */
export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    await requireApiTokenUser(request);
    return Response.json(
      { ok: true, data: { valid: true }, requestId },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (error) {
    const status = isAppError(error) ? error.status : 500;
    const code = isAppError(error) ? error.code : "INTERNAL_ERROR";
    const message = isAppError(error) ? error.message : "校验失败";
    return Response.json(
      { ok: false, error: { code, message }, requestId },
      { status, headers: CORS_HEADERS },
    );
  }
}
