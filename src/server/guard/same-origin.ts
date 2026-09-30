/**
 * 校验上报请求是否来自本站页面
 *
 * @description 比对 Origin（或降级 Referer）与 Host 是否一致，拦截跨站伪造上报；
 * 浏览器对同源 POST（含 sendBeacon）总会携带 Origin，两者均缺失时视为非法请求
 * @param request - 原始请求对象
 * @returns 同源请求返回 true，否则返回 false
 * @example
 * if (!isSameOriginRequest(request)) throw new AppError(...);
 */
export function isSameOriginRequest(request: Request): boolean {
  const host = request.headers.get("host");
  if (!host) {
    return false;
  }
  const source = request.headers.get("origin") ?? request.headers.get("referer");
  if (!source) {
    return false;
  }
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}
