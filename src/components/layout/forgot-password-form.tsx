"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  requestPasswordResetAction,
  type RequestPasswordResetActionState,
} from "@/actions/auth.actions";
import { EmailField } from "@/components/layout/auth-fields";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<
    RequestPasswordResetActionState,
    FormData
  >(requestPasswordResetAction, undefined);

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
          返回登录
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <EmailField
        id="forgot-password-email"
        label="注册邮箱"
        autoComplete="email"
        placeholder="输入你的注册邮箱"
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
        {pending ? "发送中..." : "发送重置链接"}
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
