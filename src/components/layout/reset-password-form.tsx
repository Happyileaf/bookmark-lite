"use client";

import { useState, useActionState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  resetPasswordAction,
  type ResetPasswordActionState,
} from "@/actions/auth.actions";
import { PasswordField } from "@/components/layout/auth-fields";
import { FormAlert } from "@/components/ui";
import { getPasswordError } from "@/lib/validation";

type Props = {
  token: string;
  email: string;
};

/** 重置密码表单的字段级错误集合 */
type FieldErrors = {
  /** 新密码字段错误 */
  password?: string;
  /** 确认新密码字段错误 */
  confirmPassword?: string;
};

export function ResetPasswordForm({ token, email }: Props) {
  const [state, action, pending] = useActionState<
    ResetPasswordActionState,
    FormData
  >(resetPasswordAction, undefined);

  /** 新密码与确认密码（受控），用于提交前的客户端一致性校验 */
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  /** 字段级错误（submit 时写入，输入时清除） */
  const [errors, setErrors] = useState<FieldErrors>({});

  /**
   * 提交重置：客户端先校验密码长度与两次输入一致性（noValidate 模式下接管原生校验），
   *  不合法则阻止提交、标出错误并聚焦首个错误字段；合法则放行给 action
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors: FieldErrors = {
      password: getPasswordError(password) ?? undefined,
      confirmPassword: !confirmPassword
        ? "请再次输入新密码"
        : confirmPassword !== password
          ? "两次输入的密码不一致"
          : undefined,
    };
    if (nextErrors.password || nextErrors.confirmPassword) {
      event.preventDefault();
      setErrors(nextErrors);
      const focusId = nextErrors.password
        ? "reset-password"
        : "reset-confirm-password";
      document.getElementById(focusId)?.focus();
      return;
    }
    setErrors({});
  }

  /** 输入时清除对应字段的错误 */
  function handleFieldChange(
    key: keyof FieldErrors,
    setter: (value: string) => void,
  ) {
    return (value: string) => {
      setter(value);
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    };
  }

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <FormAlert variant="success">{state.message}</FormAlert>
        <Link
          href="/login"
          className="bm-btn-primary flex h-10 w-full items-center justify-center gap-1.5 text-[13.5px]"
        >
          前往登录
        </Link>
      </div>
    );
  }

  return (
    <form action={action} noValidate onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="mb-1 block text-[12.5px] font-medium text-slate-500 dark:text-slate-400">
          账号
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
        value={password}
        onChange={handleFieldChange("password", setPassword)}
        error={errors.password}
        autoFocus
      />

      <PasswordField
        id="reset-confirm-password"
        name="confirmPassword"
        label="确认新密码"
        autoComplete="new-password"
        placeholder="再次输入新密码"
        value={confirmPassword}
        onChange={handleFieldChange("confirmPassword", setConfirmPassword)}
        error={errors.confirmPassword}
      />

      {state && !state.ok ? (
        <FormAlert>{state.message}</FormAlert>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="bm-btn-primary flex h-10 w-full items-center justify-center gap-1.5 text-[13.5px]"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            重置中...
          </>
        ) : (
          <>
            重置密码
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
