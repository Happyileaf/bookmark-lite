import { THEME_OPTIONS } from "@/lib/constants";

export type ThemeMode = (typeof THEME_OPTIONS)[number];
export type ThemeScope = "APP" | "USER";

const USER_THEME_PATH_PREFIXES = ["/my-bookmarks", "/manage", "/settings"] as const;

export function resolveThemeScopeFromPathname(pathname: string): ThemeScope {
  if (USER_THEME_PATH_PREFIXES.some((prefix) => isPrefixMatch(pathname, prefix))) {
    return "USER";
  }
  return "APP";
}

export function resolveEffectiveTheme(mode: ThemeMode, prefersDark: boolean): "light" | "dark" {
  if (mode === "system") {
    return prefersDark ? "dark" : "light";
  }
  return mode;
}

function isPrefixMatch(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
