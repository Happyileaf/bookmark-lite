import assert from "node:assert/strict";
import test from "node:test";
import { assertCanManageScope, assertCanReadScope } from "./authorize";
import { AppError } from "@/server/types/errors";
import type { SessionUser } from "@/server/auth/session";

const superAdmin: SessionUser = {
  id: "sa-1",
  role: "super_admin",
  email: "admin@example.com",
  name: "SuperAdmin",
};

const regularUser: SessionUser = {
  id: "u-1",
  role: "user",
  email: "user@example.com",
  name: "RegularUser",
};

// ─── assertCanReadScope ───

test("assertCanReadScope: APP scope allows unauthenticated", () => {
  assertCanReadScope("APP", null);
});

test("assertCanReadScope: APP scope allows regular user", () => {
  assertCanReadScope("APP", regularUser);
});

test("assertCanReadScope: USER scope rejects unauthenticated", () => {
  assert.throws(
    () => assertCanReadScope("USER", null),
    (err: unknown) => err instanceof AppError && err.code === "AUTH_REQUIRED",
  );
});

test("assertCanReadScope: USER scope allows authenticated user", () => {
  assertCanReadScope("USER", regularUser);
});

// ─── assertCanManageScope ───

test("assertCanManageScope: APP scope rejects unauthenticated", () => {
  assert.throws(
    () => assertCanManageScope("APP", null),
    (err: unknown) => err instanceof AppError && err.code === "AUTH_REQUIRED",
  );
});

test("assertCanManageScope: APP scope rejects regular user", () => {
  assert.throws(
    () => assertCanManageScope("APP", regularUser),
    (err: unknown) => err instanceof AppError && err.code === "FORBIDDEN",
  );
});

test("assertCanManageScope: APP scope allows super admin", () => {
  assertCanManageScope("APP", superAdmin);
});

test("assertCanManageScope: USER scope rejects unauthenticated", () => {
  assert.throws(
    () => assertCanManageScope("USER", null),
    (err: unknown) => err instanceof AppError && err.code === "AUTH_REQUIRED",
  );
});

test("assertCanManageScope: USER scope allows owner (self)", () => {
  assertCanManageScope("USER", regularUser, "u-1");
});

test("assertCanManageScope: USER scope rejects cross-user (different targetUserId)", () => {
  assert.throws(
    () => assertCanManageScope("USER", regularUser, "u-2"),
    (err: unknown) => err instanceof AppError && err.code === "FORBIDDEN",
  );
});

test("assertCanManageScope: USER scope allows regular user without targetUserId", () => {
  assertCanManageScope("USER", regularUser);
});

test("assertCanManageScope: USER scope allows super admin managing own settings", () => {
  assertCanManageScope("USER", superAdmin, "sa-1");
});

test("assertCanManageScope: USER scope rejects super admin managing different user", () => {
  assert.throws(
    () => assertCanManageScope("USER", superAdmin, "u-1"),
    (err: unknown) => err instanceof AppError && err.code === "FORBIDDEN",
  );
});