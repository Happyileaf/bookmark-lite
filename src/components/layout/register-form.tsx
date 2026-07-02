"use client";

import { useActionState } from "react";
import { registerAction, type RegisterActionState } from "@/actions/auth.actions";
import { EmailField, PasswordField } from "@/components/layout/auth-fields";
import { AuthOAuthSection } from "@/components/layout/auth-oauth-section";

export function RegisterForm() {
  const [state, action, pending] = useActionState<RegisterActionState, FormData>(
    registerAction,
    undefined,
  );

  return (
    <>
      <form action={action} className="space-y-5">
        <EmailField id="register-email" label="邮箱" />

        <PasswordField
          id="register-password"
          name="password"
          label="密码"
          autoComplete="new-password"
        />

        <PasswordField
          id="register-confirm-password"
          name="confirmPassword"
          label="确认密码"
          autoComplete="new-password"
          placeholder="再次输入密码"
        />

        <div>
          <label className="flex cursor-pointer select-none items-start gap-2">
            <input
              type="checkbox"
              name="agreeTerms"
              required
              className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px]"
              style={{ accentColor: "#0d9488" }}
            />
            <span className="text-[13px] text-[#4b5c58] dark:text-[#a9bcb6]">
              我已阅读并同意
              <a href="/terms" className="bm-link mx-0.5 font-medium">
                《服务条款》
              </a>
              和
              <a href="/privacy" className="bm-link mx-0.5 font-medium">
                《隐私政策》
              </a>
            </span>
          </label>
        </div>

        {state?.message ? (
          <p
            className={`text-[13px] ${
              state.ok
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="bm-btn-primary flex h-[44px] w-full items-center justify-center gap-2 text-[15px]"
        >
          {pending ? "提交中..." : "进入 Bookmark Lite"}
          {!pending ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          ) : null}
        </button>
      </form>

      <AuthOAuthSection />
    </>
  );
}
