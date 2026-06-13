import { resolveThemeScopeFromPathname, type ThemeMode, type ThemeScope } from "@/lib/theme";
import type { SessionUser } from "@/server/auth/session";
import { settingsService } from "@/server/services/settings.service";

type ThemeReadArgs = {
  scope: ThemeScope;
  user: SessionUser | null;
};

type ThemeReader = (args: ThemeReadArgs) => Promise<ThemeMode>;

type ResolveArgs = {
  pathname: string;
  user: SessionUser | null;
  readTheme: ThemeReader;
};

async function readThemeFromSettings({ scope, user }: ThemeReadArgs): Promise<ThemeMode> {
  const settings = await settingsService.getForRead(scope, user);
  return settings.theme;
}

export async function resolveThemeForRequest({
  pathname,
  user,
  readTheme,
}: ResolveArgs): Promise<ThemeMode> {
  const scope = resolveThemeScopeFromPathname(pathname);
  if (scope === "USER" && !user) {
    return "system";
  }

  try {
    return await readTheme({ scope, user });
  } catch {
    return "system";
  }
}

export async function resolveThemeForRequestFromSettings(pathname: string, user: SessionUser | null) {
  return resolveThemeForRequest({
    pathname,
    user,
    readTheme: readThemeFromSettings,
  });
}
