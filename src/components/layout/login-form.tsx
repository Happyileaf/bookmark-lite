"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { EmailField, PasswordField } from "@/components/layout/auth-fields";
import { AuthOAuthSection } from "@/components/layout/auth-oauth-section";

type Props = {
  nextUrl?: string;
};

export function LoginForm({ nextUrl }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          setError(null);
          setLoading(true);
          const result = await signIn("credentials", {
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
            redirect: false,
          });
          setLoading(false);
          if (!result || result.error) {
            setError("邮箱或密码错误");
            return;
          }
          window.location.href = nextUrl || "/my-bookmarks";
        }}
      >
        <EmailField id="login-email" label="邮箱" />

        <PasswordField
          id="login-password"
          name="password"
          label="密码"
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded-[4px]"
              style={{ accentColor: "#0d9488" }}
            />
            <span className="text-[13px] text-[#4b5c58] dark:text-[#a9bcb6]">
              记住我
            </span>
          </label>
          <a href="/forgot-password" className="bm-link whitespace-nowrap text-[13px]">
            忘记密码？
          </a>
        </div>

        {error ? (
          <p className="text-[13px] text-rose-600 dark:text-rose-400">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="bm-btn-primary flex h-[44px] w-full items-center justify-center gap-2 text-[15px]"
        >
          {loading ? "登录中..." : "进入 Bookmark Lite"}
          {!loading ? (
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
