"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark" | "system";

const THEME_OPTIONS: Array<{
  mode: ThemeMode;
  label: string;
  Icon: LucideIcon;
}> = [
  { mode: "light", label: "浅色模式", Icon: Sun },
  { mode: "dark", label: "深色模式", Icon: Moon },
  { mode: "system", label: "跟随系统", Icon: Monitor },
];

const SLIDER_CLASS: Record<ThemeMode, string> = {
  light: "translate-x-0",
  dark: "translate-x-[28px]",
  system: "translate-x-[56px]",
};

const THEME_COOKIE_MAX_AGE = 31536000;

function readThemeMode(): ThemeMode {
  if (typeof document === "undefined") {
    return "system";
  }
  const match = document.cookie.match(/(?:^|;\s*)theme=([^;]+)/);
  const value = match ? decodeURIComponent(match[1]) : null;
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
}

function resolveDark(mode: ThemeMode, prefersDark: boolean): boolean {
  return mode === "dark" || (mode === "system" && prefersDark);
}

function persistTheme(mode: ThemeMode): void {
  document.cookie = `theme=${mode};path=/;max-age=${THEME_COOKIE_MAX_AGE};SameSite=Lax`;
  document.dispatchEvent(new Event("cookiechange"));
}

function subscribeCookieChange(callback: () => void): () => void {
  document.addEventListener("cookiechange", callback);
  return () => document.removeEventListener("cookiechange", callback);
}

export function ThemeSwitch() {
  const mode = useSyncExternalStore(
    subscribeCookieChange,
    readThemeMode,
    () => "system" as ThemeMode,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = (event: MediaQueryListEvent) => {
      if (readThemeMode() !== "system") {
        return;
      }
      document.documentElement.classList.toggle("dark", event.matches);
    };

    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  const handleSelect = (nextMode: ThemeMode) => {
    persistTheme(nextMode);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", resolveDark(nextMode, prefersDark));
  };

  return (
    <div
      role="group"
      aria-label="主题切换"
      className="relative inline-flex rounded-full border border-[#e3e3e6] bg-[#ededf0] p-[2px] dark:border-[#29292d] dark:bg-[#1b1b1e]"
    >
      <span
        aria-hidden="true"
        className={`absolute left-[2px] top-[2px] h-6 w-7 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.07)] transition-transform duration-[220ms] ease-out dark:bg-[#2d2d32] ${SLIDER_CLASS[mode]}`}
      />
      {THEME_OPTIONS.map(({ mode: optionMode, label, Icon }) => {
        const isActive = mode === optionMode;
        return (
          <button
            key={optionMode}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={isActive}
            onClick={() => handleSelect(optionMode)}
            className={`relative z-[2] flex h-6 w-7 items-center justify-center rounded-full transition-colors active:scale-95 ${
              isActive
                ? "text-[#18181b] dark:text-[#fafafa]"
                : "text-[#71717a] hover:text-[#18181b] dark:text-[#a1a1aa] dark:hover:text-[#fafafa]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
