import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookmark Lite",
  description: "标签驱动的书签管理工具",
};

const THEME_INLINE_SCRIPT = `(function(){try{var t=document.cookie.match(/(?:^|;\\s*)theme=(\\S+)/);var v=t?t[1]:null;var d;if(v==='dark')d=true;else if(v==='light')d=false;else d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

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
      <body className="flex h-dvh min-h-dvh flex-col overflow-hidden">
        <AppHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
