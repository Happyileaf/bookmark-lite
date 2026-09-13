"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
      <div className="space-y-4">
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-[13px] leading-[1.6] text-emerald-700 dark:text-emerald-300">
            {state.message}
          </p>
        </div>
        <Link
          href="/login"
          className="bm-btn-primary flex h-9 w-full items-center justify-center gap-1.5 text-[13.5px]"
        >
          返回登录
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <EmailField
        id="forgot-password-email"
        label="注册邮箱"
        autoComplete="email"
        placeholder="输入你的注册邮箱"
      />

      {state?.message ? (
        <p className="text-[12.5px] text-rose-600 dark:text-rose-400">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="bm-btn-primary flex h-9 w-full items-center justify-center gap-1.5 text-[13.5px]"
      >
        {pending ? "发送中..." : "发送重置链接"}
        {!pending ? <ArrowRight className="h-4 w-4" /> : null}
      </button>
    </form>
  );
}
