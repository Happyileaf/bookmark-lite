"use client";

import { useActionState } from "react";
import { registerAction, type RegisterActionState } from "@/actions/auth.actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState<RegisterActionState, FormData>(
    registerAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-3">
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
          minLength={8}
          type="password"
          className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-slate-700 dark:text-slate-300">确认密码</span>
        <input
          name="confirmPassword"
          required
          minLength={8}
          type="password"
          className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>

      {state?.message ? (
        <p className={`text-sm ${state.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {pending ? "提交中..." : "注册"}
      </button>
    </form>
  );
}