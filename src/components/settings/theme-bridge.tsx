"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type ThemePreference = "light" | "dark" | "system";

type Props = {
  appTheme: ThemePreference;
  userTheme: ThemePreference | null;
  systemDefault: ThemePreference;
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

export function ThemeBridge({ appTheme, userTheme, systemDefault }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    // PRD 4.4.6 / 6.9.4: cross-domain reads are prohibited.
    // USER-scoped pages use userTheme, falling back to systemDefault (not appTheme).
    // APP-scoped pages use appTheme, falling back to systemDefault.
    const preference = isUserScopePath(pathname)
      ? (userTheme ?? systemDefault)
      : (appTheme ?? systemDefault);
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
  }, [appTheme, pathname, userTheme, systemDefault]);

  return null;
}
