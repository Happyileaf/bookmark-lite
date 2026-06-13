import assert from "node:assert/strict";
import test from "node:test";
import { resolveScopeContext } from "./scope";
import { AppError } from "@/server/types/errors";

test("resolveScopeContext: APP scope returns null ownerUserId and APP key", () => {
  const ctx = resolveScopeContext("APP", "any-user-id");
  assert.equal(ctx.scope, "APP");
  assert.equal(ctx.ownerUserId, null);
  assert.equal(ctx.scopeOwnerKey, "APP");
});

test("resolveScopeContext: APP scope works without userId", () => {
  const ctx = resolveScopeContext("APP", null);
  assert.equal(ctx.scope, "APP");
  assert.equal(ctx.ownerUserId, null);
  assert.equal(ctx.scopeOwnerKey, "APP");
});

test("resolveScopeContext: USER scope returns session userId as owner", () => {
  const ctx = resolveScopeContext("USER", "u-1");
  assert.equal(ctx.scope, "USER");
  assert.equal(ctx.ownerUserId, "u-1");
  assert.equal(ctx.scopeOwnerKey, "u-1");
});

test("resolveScopeContext: USER scope rejects missing userId", () => {
  assert.throws(
    () => resolveScopeContext("USER", null),
    (err: unknown) => err instanceof AppError && err.code === "AUTH_REQUIRED",
  );
});

test("resolveScopeContext: USER scope rejects undefined userId", () => {
  assert.throws(
    () => resolveScopeContext("USER"),
    (err: unknown) => err instanceof AppError && err.code === "AUTH_REQUIRED",
  );
});