"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type Props = {
  nextUrl?: string;
};

export function LoginForm({ nextUrl }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-3"
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
      <label className="block space-y-1 text-sm">
        <span className="text-slate-700 dark:text-slate-300">邮箱</span>
        <input
          name="email"
          required
          type="email"
          className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-slate-700 dark:text-slate-300">密码</span>
        <input
          name="password"
          required
          type="password"
          className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>

      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        {loading ? "登录中..." : "登录"}
      </button>
    </form>
  );
}
