"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight } from "lucide-react";
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
        className="space-y-4"
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

        <div className="flex items-center justify-end">
          <a href="/forgot-password" className="bm-link whitespace-nowrap text-[13px]">
            忘记密码？
          </a>
        </div>

        {error ? (
          <p className="text-[12.5px] text-rose-600 dark:text-rose-400">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="bm-btn-primary flex h-10 w-full items-center justify-center gap-1.5 text-[13.5px]"
        >
          {loading ? "登录中..." : "进入 Bookmark Lite"}
          {!loading ? <ArrowRight className="h-4 w-4" /> : null}
        </button>
      </form>

      <AuthOAuthSection />
    </>
  );
}
