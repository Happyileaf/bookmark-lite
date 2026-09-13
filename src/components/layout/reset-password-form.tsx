"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
          前往登录
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="mb-1 block text-[12.5px] font-medium text-slate-500 dark:text-slate-400">
          账户
        </label>
        <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100">
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
        <p className="text-[12.5px] text-rose-600 dark:text-rose-400">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="bm-btn-primary flex h-9 w-full items-center justify-center gap-1.5 text-[13.5px]"
      >
        {pending ? "重置中..." : "重置密码"}
        {!pending ? <ArrowRight className="h-4 w-4" /> : null}
      </button>
    </form>
  );
}
