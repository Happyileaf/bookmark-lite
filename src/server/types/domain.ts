import type { DataScope, Role, Theme } from "@prisma/client";

export type Scope = DataScope;
export type UserRole = Role;
export type ThemeMode = Theme;

export type ScopeContext = {
  scope: Scope;
  ownerUserId: string | null;
  scopeOwnerKey: string;
};
