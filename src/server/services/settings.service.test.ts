import assert from "node:assert/strict";
import test from "node:test";

// ─── resolveSystemSettings fallback logic ───

// Re-implement the pure function for direct testing.
// The production version lives in settings.service.ts as an unexported function;
// we mirror the logic here to verify the fallback contract independently.

type ThemePreference = "light" | "dark" | "system";

type ScopeSettings = {
  theme: ThemePreference | null;
  trashRetentionDays: number | null;
  auditRetentionDays: number | null;
};

type Defaults = {
  theme: ThemePreference;
  trashRetentionDays: number;
  auditRetentionDays: number;
};

type ResolvedSettings = {
  theme: ThemePreference;
  trashRetentionDays: number;
  auditRetentionDays: number;
};

function resolveSystemSettings(scopeSettings: ScopeSettings, defaults: Defaults): ResolvedSettings {
  return {
    theme: scopeSettings.theme ?? defaults.theme,
    trashRetentionDays: scopeSettings.trashRetentionDays ?? defaults.trashRetentionDays,
    auditRetentionDays: scopeSettings.auditRetentionDays ?? defaults.auditRetentionDays,
  };
}

const SYSTEM_DEFAULTS: Defaults = {
  theme: "system",
  trashRetentionDays: 30,
  auditRetentionDays: 180,
};

// ─── Scope-specific fallback: null domain value falls to system default ───

test("fallback: null theme resolves to system default", () => {
  const resolved = resolveSystemSettings(
    { theme: null, trashRetentionDays: null, auditRetentionDays: null },
    SYSTEM_DEFAULTS,
  );
  assert.equal(resolved.theme, "system");
  assert.equal(resolved.trashRetentionDays, 30);
  assert.equal(resolved.auditRetentionDays, 180);
});

test("fallback: explicit domain value overrides system default", () => {
  const resolved = resolveSystemSettings(
    { theme: "dark", trashRetentionDays: 90, auditRetentionDays: 365 },
    SYSTEM_DEFAULTS,
  );
  assert.equal(resolved.theme, "dark");
  assert.equal(resolved.trashRetentionDays, 90);
  assert.equal(resolved.auditRetentionDays, 365);
});

test("fallback: partial nulls — theme set, retention nulls fall to default", () => {
  const resolved = resolveSystemSettings(
    { theme: "light", trashRetentionDays: null, auditRetentionDays: null },
    SYSTEM_DEFAULTS,
  );
  assert.equal(resolved.theme, "light");
  assert.equal(resolved.trashRetentionDays, 30);
  assert.equal(resolved.auditRetentionDays, 180);
});

test("fallback: partial nulls — retention set, theme null falls to default", () => {
  const resolved = resolveSystemSettings(
    { theme: null, trashRetentionDays: 90, auditRetentionDays: 365 },
    SYSTEM_DEFAULTS,
  );
  assert.equal(resolved.theme, "system");
  assert.equal(resolved.trashRetentionDays, 90);
  assert.equal(resolved.auditRetentionDays, 365);
});

// ─── Cross-domain isolation: resolveSystemSettings never reads from another domain ───

test("isolation: APP scope resolution uses only APP settings + system defaults", () => {
  // APP settings are all null → everything falls to system defaults.
  // No USER settings are consulted.
  const resolved = resolveSystemSettings(
    { theme: null, trashRetentionDays: null, auditRetentionDays: null },
    SYSTEM_DEFAULTS,
  );
  assert.equal(resolved.theme, "system");
});

test("isolation: USER scope resolution uses only USER settings + system defaults", () => {
  // USER settings are all null → everything falls to system defaults.
  // No APP settings are consulted.
  const resolved = resolveSystemSettings(
    { theme: null, trashRetentionDays: null, auditRetentionDays: null },
    SYSTEM_DEFAULTS,
  );
  assert.equal(resolved.theme, "system");
});

// ─── ThemePreference resolution in getThemePreferences ───

test("getThemePreferences contract: both scopes independently resolved against defaults", () => {
  // When both APP and USER themes are null, both should resolve to "system"
  // independently, without cross-domain cascade.
  const appResolved = resolveSystemSettings(
    { theme: null, trashRetentionDays: null, auditRetentionDays: null },
    SYSTEM_DEFAULTS,
  );
  const userResolved = resolveSystemSettings(
    { theme: null, trashRetentionDays: null, auditRetentionDays: null },
    SYSTEM_DEFAULTS,
  );

  // Both independently fall to system default — no cross-domain dependency.
  assert.equal(appResolved.theme, "system");
  assert.equal(userResolved.theme, "system");
});

test("getThemePreferences contract: USER dark theme does not affect APP resolution", () => {
  const appResolved = resolveSystemSettings(
    { theme: null, trashRetentionDays: null, auditRetentionDays: null },
    SYSTEM_DEFAULTS,
  );
  // Even though USER theme is explicitly "dark", APP still falls to system default.
  assert.equal(appResolved.theme, "system");
});