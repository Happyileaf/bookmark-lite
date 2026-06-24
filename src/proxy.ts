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

  if (isUserArea && !token) {
    return loginRedirect(request);
  }

  if (isAdminArea) {
    if (!token) {
      return loginRedirect(request);
    }
    if (token.role !== "super_admin") {
      return NextResponse.redirect(new URL("/my-bookmarks?forbidden=1", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/my-bookmarks/:path*", "/manage/:path*", "/settings", "/admin/:path*"],
};
