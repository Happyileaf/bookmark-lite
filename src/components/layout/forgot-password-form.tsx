"use client";

import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { requestPasswordResetAction } from "@/actions/auth.actions";
import { EmailField } from "@/components/layout/auth-fields";
import { FormAlert, useToast } from "@/components/ui";
import { isValidEmail } from "@/lib/validation";

/** 重新发送重置邮件的客户端冷却时间（秒），与服务端限频保持一致 */
const RESEND_COUNTDOWN_SECONDS = 60;

type Props = {
  /** 从登录页等入口带入的邮箱（用于预填，减少重复输入） */
  initialEmail?: string;
};

export function ForgotPasswordForm({ initialEmail }: Props) {
  /** 提交/重发的过渡状态；结果在事件回调中直接处理（避免在 effect 中同步 setState） */
  const [pending, startTransition] = useTransition();

  const { toast } = useToast();

  /** 邮箱（受控），成功视图中的重新发送也使用该值 */
  const [email, setEmail] = useState(initialEmail ?? "");
  /** 邮箱的字段级错误（submit 时写入，输入时清除） */
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  /** 表单视图中的服务端错误（重发失败不回弹表单，走 resendError） */
  const [formError, setFormError] = useState<string | null>(null);
  /** 是否已成功发送过（成功后即使重发失败也停留在成功视图，不回弹表单） */
  const [sent, setSent] = useState(false);
  /** 首次成功时服务端返回的防枚举提示文案 */
  const [sentMessage, setSentMessage] = useState("");
  /** 成功视图中重发失败的错误信息 */
  const [resendError, setResendError] = useState<string | null>(null);
  /** 重新发送的倒计时（秒），0 表示可发送 */
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  /**
   * 在过渡中请求发送重置邮件并直接处理结果
   *
   * @description 首次提交与成功视图中的重发共用；成功进入成功视图并启动冷却，
   *  失败按 isResend 决定展示位置（表单级 FormAlert 或成功视图就近提示）
   * @param isResend - 是否为成功视图中的重发
   */
  function requestReset(isResend: boolean) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", email.trim());
      const result = await requestPasswordResetAction(undefined, formData);
      if (result?.ok) {
        setSent(true);
        setSentMessage(result.message);
        setResendError(null);
        setCooldown(RESEND_COUNTDOWN_SECONDS);
        if (isResend) {
          toast({ title: "重置邮件已重新发送", variant: "success" });
        }
        return;
      }
      const message = result?.message ?? "发送失败，请稍后重试";
      if (isResend) {
        setResendError(message);
      } else {
        setFormError(message);
      }
    });
  }

  /**
   * 提交发送重置链接：接管提交（noValidate + preventDefault），
   *  客户端先校验邮箱格式，不合法则聚焦邮箱字段；合法才调用 action
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setEmailError("请输入正确的邮箱");
      document.getElementById("forgot-password-email")?.focus();
      return;
    }
    setEmailError(undefined);
    setFormError(null);
    requestReset(false);
  }

  /** 成功视图中重新发送：以当前邮箱再次调用同一个 action，不离开成功视图 */
  function handleResend() {
    if (pending || cooldown > 0) {
      return;
    }
    requestReset(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <FormAlert variant="success">{sentMessage}</FormAlert>
        <p className="text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
          没有收到邮件？请检查垃圾邮件文件夹，或
          <button
            type="button"
            onClick={handleResend}
            disabled={pending || cooldown > 0}
            className="bm-link ml-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
          >
            {pending
              ? "发送中..."
              : cooldown > 0
                ? `重新发送（${cooldown}s）`
                : "重新发送"}
          </button>
        </p>
        {resendError ? (
          <p className="text-[12.5px] text-rose-600 dark:text-rose-400">
            {resendError}
          </p>
        ) : null}
        <Link
          href="/login"
          className="bm-btn-primary flex h-10 w-full items-center justify-center gap-1.5 text-[13.5px]"
        >
          返回登录
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <EmailField
        id="forgot-password-email"
        label="注册邮箱"
        autoComplete="email"
        placeholder="输入你的注册邮箱"
        value={email}
        onChange={(value) => {
          setEmail(value);
          if (emailError) setEmailError(undefined);
        }}
        error={emailError}
        autoFocus={!initialEmail}
      />

      {formError ? <FormAlert>{formError}</FormAlert> : null}

      <button
        type="submit"
        disabled={pending}
        className="bm-btn-primary flex h-10 w-full items-center justify-center gap-1.5 text-[13.5px]"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            发送中...
          </>
        ) : (
          <>
            发送重置链接
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
