import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getNextAuthSecret } from "@/server/auth/secret";

function loginRedirect(request: NextRequest) {
  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = await getToken({
    req: request,
    secret: getNextAuthSecret(),
  });

  const isUserArea =
    pathname.startsWith("/my-bookmarks") ||
    pathname.startsWith("/manage") ||
    pathname === "/settings";
  const isAdminArea = pathname.startsWith("/admin");

  /** 会话被服务端作废（如用户被禁用后 jwt 回调清空 id）时 JWT 仍然存在，但不再代表有效登录态 */
  const isAuthenticated = Boolean(token?.id);

  if (isUserArea && !isAuthenticated) {
    return loginRedirect(request);
  }

  if (isAdminArea) {
    if (!isAuthenticated) {
      return loginRedirect(request);
    }
    if (token?.role !== "super_admin") {
      return NextResponse.redirect(new URL("/my-bookmarks?forbidden=1", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/my-bookmarks/:path*", "/manage/:path*", "/settings", "/admin/:path*"],
};
