"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics/tracker";

/**
 * 全站埋点挂载组件
 * 在根布局挂载一次（需包裹 Suspense），监听客户端路由变化自动上报页面浏览事件，不渲染任何 UI。
 */
function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackPageView();
  }, [pathname, searchParams]);

  return null;
}

export default AnalyticsTracker;
