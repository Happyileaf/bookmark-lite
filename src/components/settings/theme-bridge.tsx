"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type ThemePreference = "light" | "dark" | "system";

type Props = {
  appTheme: ThemePreference;
  userTheme: ThemePreference | null;
};

function isUserScopePath(pathname: string): boolean {
  return (
    pathname.startsWith("/my-bookmarks") ||
    pathname.startsWith("/manage") ||
    pathname === "/settings"
  );
}

function resolveTheme(preference: ThemePreference, prefersDark: boolean): "light" | "dark" {
  if (preference === "system") {
    return prefersDark ? "dark" : "light";
  }
  return preference;
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeBridge({ appTheme, userTheme }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    const preference =
      isUserScopePath(pathname) && userTheme ? userTheme : appTheme;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const update = () => {
      applyTheme(resolveTheme(preference, mediaQuery.matches));
    };

    update();

    if (preference !== "system") {
      return;
    }

    const listener = () => update();
    mediaQuery.addEventListener("change", listener);

    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, [appTheme, pathname, userTheme]);

  return null;
}
