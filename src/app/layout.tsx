import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { ThemeBridge } from "@/components/settings/theme-bridge";
import { getSessionUser } from "@/server/auth/session";
import { settingsService } from "@/server/services/settings.service";
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
  const user = await getSessionUser();
  const themeContext = await settingsService.getThemePreferences(user?.id);

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-slate-50 text-slate-900">
        <ThemeBootstrapScript
          appTheme={themeContext.appTheme}
          userTheme={themeContext.userTheme}
        />
        <ThemeBridge
          appTheme={themeContext.appTheme}
          userTheme={themeContext.userTheme}
        />
        <AppHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
      </body>
    </html>
  );
}

function ThemeBootstrapScript({
  appTheme,
  userTheme,
}: {
  appTheme: "light" | "dark" | "system";
  userTheme: "light" | "dark" | "system" | null;
}) {
  const script = `
    (function () {
      var appTheme = ${JSON.stringify(appTheme)};
      var userTheme = ${JSON.stringify(userTheme)};
      var pathname = window.location.pathname;
      var isUserScopePath =
        pathname.indexOf("/my-bookmarks") === 0 ||
        pathname.indexOf("/manage") === 0 ||
        pathname === "/settings";
      var preference = isUserScopePath && userTheme ? userTheme : appTheme;
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var resolved = preference === "system" ? (prefersDark ? "dark" : "light") : preference;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
