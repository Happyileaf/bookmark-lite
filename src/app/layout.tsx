import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import AnalyticsTracker from "@/components/analytics-tracker";
import { AppHeader } from "@/components/layout/app-header";
import TextureSwitch from "@/components/layout/texture-switch";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookmark Lite",
  description: "标签驱动的书签管理工具",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

const THEME_INLINE_SCRIPT = `(function(){try{var t=document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/);var v=t?decodeURIComponent(t[1]):null;var n=v==='dark'||v==='light'||v==='system'?v:null;var p=window.matchMedia('(prefers-color-scheme:dark)').matches;var d=n==='dark'||((n==='system'||n===null)&&p);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

/** 防闪烁内联脚本：首屏绘制前从 Cookie 恢复背景纹理，非法值回退细点阵（取值需与 texture-switch 常量保持同步） */
const TEXTURE_INLINE_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)texture=([^;]+)/);var v=m?m[1]:null;var ok=v==='None'||v==='Dots'||v==='Grid'||v==='Noise';document.documentElement.setAttribute('data-texture',ok?v:'Dots')}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INLINE_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: TEXTURE_INLINE_SCRIPT }} />
      </head>
      <body className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-background text-foreground">
        <ToastProvider>
          <AppHeader />
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
        </ToastProvider>
        {/* 背景纹理切换器：右下角浮动入口，偏好写入 Cookie */}
        <TextureSwitch />
        {/* 全站埋点：useSearchParams 需包裹 Suspense，避免阻塞静态渲染 */}
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
      </body>
    </html>
  );
}
