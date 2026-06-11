import type { Metadata } from "next";
import { headers } from "next/headers";
import { AppHeader } from "@/components/layout/app-header";
import { getSessionUser } from "@/server/auth/session";
import { resolveThemeForRequestFromSettings } from "@/server/services/theme.service";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookmark Lite",
  description: "标签驱动的书签管理工具",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-bookmark-pathname") ?? "/";
  const user = await getSessionUser();
  const themeMode = await resolveThemeForRequestFromSettings(pathname, user);

  return (
    <html lang="zh-CN" data-theme-mode={themeMode}>
      <body className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-slate-50 text-slate-900">
        <AppHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
