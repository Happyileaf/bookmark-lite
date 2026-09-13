"use client";

import {
  useEffect,
  useRef,
  useState,
  useActionState,
  startTransition,
} from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import {
  registerAction,
  sendRegisterCodeAction,
  type RegisterActionState,
  type SendRegisterCodeActionState,
} from "@/actions/auth.actions";
import { EmailField, PasswordField } from "@/components/layout/auth-fields";
import { AuthOAuthSection } from "@/components/layout/auth-oauth-section";

/** 发送验证码的客户端冷却时间（秒），与服务端限频保持一致 */
const RESEND_COUNTDOWN_SECONDS = 60;

export function RegisterForm() {
  const [registerState, registerFormAction, registerPending] =
    useActionState<RegisterActionState, FormData>(registerAction, undefined);

  const [codeState, sendCodeFormAction, codePending] =
    useActionState<SendRegisterCodeActionState, FormData>(
      sendRegisterCodeAction,
      undefined,
    );

  /** 表单数据（受控），避免发送验证码触发表单提交后字段被 React 重置 */
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /** 重新发送验证码的倒计时（秒），0 表示可发送 */
  const [cooldown, setCooldown] = useState(0);

  /** 表单元素引用，用于构造发送验证码所需的 FormData */
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  /** 点击发送验证码：仅调用发码 action，不提交整个表单（避免字段被重置）。
   *  邮箱格式合法才发送并启动冷却倒计时；结果提示由 codeState 渲染。 */
  function handleSendCode() {
    if (!formRef.current || codePending || cooldown > 0) {
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return;
    }
    const formData = new FormData(formRef.current);
    startTransition(() => {
      sendCodeFormAction(formData);
    });
    setCooldown(RESEND_COUNTDOWN_SECONDS);
  }

  const sendCodeDisabled = codePending || cooldown > 0;

  return (
    <>
      <form
        ref={formRef}
        action={registerFormAction}
        className="space-y-4"
      >
        <EmailField
          id="register-email"
          label="邮箱"
          value={email}
          onChange={setEmail}
        />

        <div>
          <label
            htmlFor="register-code"
            className="mb-1 block text-[12.5px] font-medium text-slate-500 dark:text-slate-400"
          >
            验证码
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <input
                id="register-code"
                name="code"
                type="text"
                inputMode="numeric"
                required
                autoComplete="one-time-code"
                maxLength={6}
                pattern="\d{6}"
                title="请输入 6 位数字验证码"
                placeholder="输入 6 位验证码"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="bm-input h-9 w-full pl-9 pr-3 text-[13px] tracking-widest"
              />
            </div>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sendCodeDisabled}
              className="bm-btn-code h-9 shrink-0 px-3.5 text-[13px]"
            >
              {codePending
                ? "发送中..."
                : cooldown > 0
                  ? `${cooldown}s 后重发`
                  : "发送验证码"}
            </button>
          </div>
          {codeState?.message ? (
            <p
              className={`mt-1 text-[12.5px] ${
                codeState.ok
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {codeState.message}
            </p>
          ) : null}
        </div>

        <PasswordField
          id="register-password"
          name="password"
          label="密码"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />

        <PasswordField
          id="register-confirm-password"
          name="confirmPassword"
          label="确认密码"
          autoComplete="new-password"
          placeholder="再次输入密码"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />

        <div>
          <label className="flex cursor-pointer select-none items-start gap-2">
            <input
              type="checkbox"
              name="agreeTerms"
              required
              className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px] accent-blue-600"
            />
            <span className="text-[13px] text-slate-500 dark:text-slate-400">
              我已阅读并同意
              <a href="/terms" className="bm-link mx-0.5 font-medium">
                《服务条款》
              </a>
              和
              <a href="/privacy" className="bm-link mx-0.5 font-medium">
                《隐私政策》
              </a>
            </span>
          </label>
        </div>

        {registerState?.message ? (
          <p
            className={`text-[12.5px] ${
              registerState.ok
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {registerState.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={registerPending}
          className="bm-btn-primary flex h-9 w-full items-center justify-center gap-1.5 text-[13.5px]"
        >
          {registerPending ? "提交中..." : "进入 Bookmark Lite"}
          {!registerPending ? (
            <ArrowRight className="h-4 w-4" />
          ) : null}
        </button>
      </form>

      <AuthOAuthSection />
    </>
  );
}
