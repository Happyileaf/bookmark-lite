import { shouldTrack } from "@/lib/analytics/tracker";

/**
 * 上报一次公共书签访问
 *
 * @description 热门书签统计的客户端数据来源：用户打开公共库书签时以 fire-and-forget
 * 方式上报，不等待响应、失败静默放弃——访问统计属于旁路数据，任何失败都不得阻塞
 * 用户打开目标网站；复用埋点模块的 shouldTrack，与页面浏览/点击埋点保持同一
 * 隐私过滤口径（DNT 与自动化流量不上报）
 * @param bookmarkId - 被打开的公共书签 ID
 * @returns 无返回值
 * @example
 * recordPublicBookmarkVisit("0c9a1b2e-5f6d-4a3b-8c2d-1e2f3a4b5c6d");
 */
export function recordPublicBookmarkVisit(bookmarkId: string): void {
  if (typeof window === "undefined" || !shouldTrack()) {
    return;
  }
  fetch("/api/bookmarks/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookmarkId }),
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => {
    /** 新窗口已打开、上报属于事后统计，网络失败时无需提示或重试 */
  });
}
