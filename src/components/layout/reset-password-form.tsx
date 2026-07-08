"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  resetPasswordAction,
  type ResetPasswordActionState,
} from "@/actions/auth.actions";
import { PasswordField } from "@/components/layout/auth-fields";

type Props = {
  token: string;
  email: string;
};

export function ResetPasswordForm({ token, email }: Props) {
  const [state, action, pending] = useActionState<
    ResetPasswordActionState,
    FormData
  >(resetPasswordAction, undefined);

  if (state?.ok) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-[14px] leading-[1.6] text-emerald-700 dark:text-emerald-300">
            {state.message}
          </p>
        </div>
        <Link
          href="/login"
          className="bm-btn-primary flex h-[44px] w-full items-center justify-center gap-2 text-[15px]"
        >
          前往登录
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[#4b5c58] dark:text-[#a9bcb6]">
          账户
        </label>
        <p className="text-[14px] font-medium text-[#0f1f1c] dark:text-[#e8f3ef]">
          {email}
        </p>
      </div>

      <PasswordField
        id="reset-password"
        name="password"
        label="新密码"
        autoComplete="new-password"
      />

      <PasswordField
        id="reset-confirm-password"
        name="confirmPassword"
        label="确认新密码"
        autoComplete="new-password"
        placeholder="再次输入新密码"
      />

      {state?.message ? (
        <p className="text-[13px] text-rose-600 dark:text-rose-400">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="bm-btn-primary flex h-[44px] w-full items-center justify-center gap-2 text-[15px]"
      >
        {pending ? "重置中..." : "重置密码"}
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
  );
}
