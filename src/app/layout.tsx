import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookmark Lite",
  description: "标签驱动的书签管理工具",
};

const THEME_INLINE_SCRIPT = `(function(){try{var t=document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/);var v=t?decodeURIComponent(t[1]):null;var n=v==='dark'||v==='light'||v==='system'?v:null;var p=window.matchMedia('(prefers-color-scheme:dark)').matches;var d=n==='dark'||((n==='system'||n===null)&&p);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INLINE_SCRIPT }} />
      </head>
      <body className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-background text-foreground">
        <ToastProvider>
          <AppHeader />
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
