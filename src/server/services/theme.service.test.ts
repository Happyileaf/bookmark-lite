import assert from "node:assert/strict";
import test from "node:test";
import { resolveEffectiveTheme, resolveThemeScopeFromPathname } from "../../lib/theme";
import { resolveThemeForRequest } from "./theme.service";
import type { SessionUser } from "../auth/session";

const demoUser: SessionUser = {
  id: "u-1",
  role: "user",
  email: "demo@example.com",
  name: "Demo",
};

test("resolves theme scope by route pathname", () => {
  assert.equal(resolveThemeScopeFromPathname("/bookmarks"), "APP");
  assert.equal(resolveThemeScopeFromPathname("/my-bookmarks"), "USER");
  assert.equal(resolveThemeScopeFromPathname("/manage/bookmarks"), "USER");
  assert.equal(resolveThemeScopeFromPathname("/settings"), "USER");
  assert.equal(resolveThemeScopeFromPathname("/admin/settings"), "APP");
});

test("resolves effective theme from stored mode and system preference", () => {
  assert.equal(resolveEffectiveTheme("light", true), "light");
  assert.equal(resolveEffectiveTheme("dark", false), "dark");
  assert.equal(resolveEffectiveTheme("system", false), "light");
  assert.equal(resolveEffectiveTheme("system", true), "dark");
});

test("falls back to system when user-scoped route is unauthenticated", async () => {
  let called = false;
  const theme = await resolveThemeForRequest({
    pathname: "/settings",
    user: null,
    readTheme: async () => {
      called = true;
      return "dark";
    },
  });

  assert.equal(theme, "system");
  assert.equal(called, false);
});

test("reads and persists updated theme across repeated requests", async () => {
  let persistedTheme: "light" | "dark" | "system" = "light";

  const readTheme = async () => persistedTheme;
  const first = await resolveThemeForRequest({
    pathname: "/my-bookmarks",
    user: demoUser,
    readTheme,
  });
  assert.equal(first, "light");

  persistedTheme = "dark";
  const second = await resolveThemeForRequest({
    pathname: "/my-bookmarks",
    user: demoUser,
    readTheme,
  });
  assert.equal(second, "dark");

  const refreshed = await resolveThemeForRequest({
    pathname: "/my-bookmarks",
    user: demoUser,
    readTheme,
  });
  assert.equal(refreshed, "dark");
});

test("falls back to system when theme read throws", async () => {
  const theme = await resolveThemeForRequest({
    pathname: "/bookmarks",
    user: null,
    readTheme: async () => {
      throw new Error("db offline");
    },
  });
  assert.equal(theme, "system");
});
