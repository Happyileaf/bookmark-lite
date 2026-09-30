import { cookies } from "next/headers";
import { getSessionUser } from "@/server/auth/session";
import { isSameOriginRequest } from "@/server/guard/same-origin";
import { bookmarkService } from "@/server/services/bookmark.service";
import { AppError, isAppError } from "@/server/types/errors";
import { bookmarkVisitSchema } from "@/server/validators/bookmark.schema";

export const dynamic = "force-dynamic";

/** 匿名访客标识 Cookie 名：HttpOnly 仅供服务端读取，前端不感知其存在 */
const VISIT_VISITOR_COOKIE_NAME = "bml_visit_visitor";

/** 访客标识 Cookie 有效期（秒）：取一年与常见访客统计口径一致，过期后重新生成新标识 */
const VISIT_VISITOR_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/** 访客标识最大长度：与 bookmark_visits.visitor_key 列宽（VarChar(64)）对齐 */
const MAX_VISITOR_KEY_LENGTH = 64;

/**
 * 上报公共书签访问事件
 *
 * @description 供前端在用户打开公共书签时调用，作为热门书签统计的数据来源。
 * 出于防刷考虑仅接受同源请求；访客身份取登录会话，匿名访客用 HttpOnly Cookie 中的
 * UUID 标识（首次上报时生成并种入 Cookie）。无论去重跳过、书签不合法还是写库失败，
 * 均静默返回 accepted，避免向调用方暴露内部状态，仅请求体不合法（422）与跨源（403）显式报错
 * @param request - HTTP 请求（需携带同源 Origin/Referer 头与 JSON 请求体）
 * @returns 统一信封响应，data 恒为 { accepted: true }
 */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    if (!isSameOriginRequest(request)) {
      throw new AppError("FORBIDDEN", "仅允许同源页面请求上报访问", 403);
    }

    /** 请求体可能不是合法 JSON（如空请求体），解析失败与字段校验失败同按 422 处理 */
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AppError("VALIDATION_FAILED", "访问上报参数不正确", 422);
    }
    const parsed = bookmarkVisitSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_FAILED",
        "访问上报参数不正确",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const cookieStore = await cookies();
    let visitorKey = cookieStore.get(VISIT_VISITOR_COOKIE_NAME)?.value ?? "";
    /**
     * Cookie 缺失或长度超出 visitor_key 列宽（异常或被篡改的值）时重新生成标识；
     * 仅在首次生成时写回 Cookie，避免每次上报都刷新有效期造成访客标识长期不轮换
     */
    if (visitorKey.length === 0 || visitorKey.length > MAX_VISITOR_KEY_LENGTH) {
      visitorKey = crypto.randomUUID();
      cookieStore.set(VISIT_VISITOR_COOKIE_NAME, visitorKey, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: VISIT_VISITOR_COOKIE_MAX_AGE_SECONDS,
        secure: process.env.NODE_ENV === "production",
      });
    }

    const user = await getSessionUser();
    try {
      await bookmarkService.recordVisit({
        bookmarkId: parsed.data.bookmarkId,
        userId: user?.id ?? null,
        visitorKey,
      });
    } catch (error) {
      console.error("[bookmark-visit] 访问记录写入失败:", error);
    }

    return Response.json({
      ok: true,
      data: { accepted: true },
      requestId,
    });
  } catch (error) {
    if (isAppError(error)) {
      return Response.json(
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
      );
    }

    return Response.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "访问上报失败",
        },
        requestId,
      },
      { status: 500 },
    );
  }
}
