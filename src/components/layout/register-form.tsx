"use client";

import {
  useEffect,
  useRef,
  useState,
  useActionState,
  useTransition,
  type FormEvent,
} from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import {
  registerAction,
  sendRegisterCodeAction,
  type RegisterActionState,
} from "@/actions/auth.actions";
import { EmailField, PasswordField } from "@/components/layout/auth-fields";
import { AuthOAuthSection } from "@/components/layout/auth-oauth-section";
import { FormAlert, useToast } from "@/components/ui";
import { getPasswordError, isValidEmail } from "@/lib/validation";

/** 发送验证码的客户端冷却时间（秒），与服务端限频保持一致 */
const RESEND_COUNTDOWN_SECONDS = 60;

/** 注册表单的字段级错误集合 */
type FieldErrors = {
  /** 邮箱字段错误 */
  email?: string;
  /** 验证码字段错误 */
  code?: string;
  /** 密码字段错误 */
  password?: string;
  /** 确认密码字段错误 */
  confirmPassword?: string;
};

/**
 * 获取邮箱的字段级错误文案
 *
 * @description 非空且通过格式校验时返回 undefined
 * @param value - 邮箱输入值
 * @returns 错误文案或 undefined
 * @example
 * getEmailError("a@b.com"); // undefined
 */
function getEmailError(value: string): string | undefined {
  if (!value.trim()) return "请输入邮箱";
  if (!isValidEmail(value)) return "请输入正确的邮箱";
  return undefined;
}

/**
 * 获取验证码的字段级错误文案
 *
 * @description 6 位数字时返回 undefined
 * @param value - 验证码输入值
 * @returns 错误文案或 undefined
 * @example
 * getCodeError("123456"); // undefined
 */
function getCodeError(value: string): string | undefined {
  if (!value) return "请输入验证码";
  if (!/^\d{6}$/.test(value)) return "请输入 6 位数字验证码";
  return undefined;
}

/**
 * 获取确认密码的字段级错误文案
 *
 * @description 非空且与密码一致时返回 undefined
 * @param password - 密码输入值
 * @param confirmPassword - 确认密码输入值
 * @returns 错误文案或 undefined
 * @example
 * getConfirmPasswordError("abc12345", "abc12345"); // undefined
 */
function getConfirmPasswordError(
  password: string,
  confirmPassword: string,
): string | undefined {
  if (!confirmPassword) return "请再次输入密码";
  if (confirmPassword !== password) return "两次输入的密码不一致";
  return undefined;
}

export function RegisterForm() {
  const [registerState, registerFormAction, registerPending] =
    useActionState<RegisterActionState, FormData>(registerAction, undefined);

  /** 发送验证码的过渡状态；结果在点击回调中直接处理（避免在 effect 中同步 setState） */
  const [codePending, startCodeTransition] = useTransition();

  const { toast } = useToast();

  /** 表单数据（受控），避免发送验证码触发表单提交后字段被 React 重置 */
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /** 字段级错误（blur/submit 时写入，输入时清除） */
  const [errors, setErrors] = useState<FieldErrors>({});
  /** 发送验证码通道的错误信息（成功反馈走 Toast，失败就近展示在验证码行） */
  const [sendError, setSendError] = useState<string | null>(null);
  /** 服务条款勾选的校验错误 */
  const [termsError, setTermsError] = useState<string | null>(null);

  /** 重新发送验证码的倒计时（秒），0 表示可发送 */
  const [cooldown, setCooldown] = useState(0);

  /** 自动登录是否已发起，防止注册成功后重复调用 signIn */
  const autoLoginStartedRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  /** 注册成功副作用：用当前表单凭据自动登录；失败则降级回跳登录页（带成功提示与邮箱预填） */
  useEffect(() => {
    if (!registerState?.ok || autoLoginStartedRef.current) {
      return;
    }
    autoLoginStartedRef.current = true;
    void (async () => {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (result && !result.error) {
        window.location.href = "/my-bookmarks";
        return;
      }
      window.location.href = `/login?registered=1&email=${encodeURIComponent(email.trim())}`;
    })();
  }, [registerState, email, password]);

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

  /** 失焦时校验已填写内容的字段（空字段留给提交时统一拦截，避免过度打扰） */
  function handleFieldBlur(key: keyof FieldErrors) {
    return () => {
      if (key === "email" && email) {
        setErrors((prev) => ({ ...prev, email: getEmailError(email) }));
      }
      if (key === "password" && password) {
        setErrors((prev) => ({
          ...prev,
          password: getPasswordError(password) ?? undefined,
        }));
      }
      if (key === "confirmPassword" && confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: getConfirmPasswordError(password, confirmPassword),
        }));
      }
    };
  }

  /**
   * 点击发送验证码：仅调用发码 action，不提交整个表单（避免字段被重置）。
   *  邮箱格式合法才发送；冷却在服务端确认成功后启动，
   *  失败时若是限流文案（含秒数）则按服务端剩余时间同步冷却，其余错误就近展示。
   */
  function handleSendCode() {
    if (codePending || cooldown > 0) {
      return;
    }
    const emailError = getEmailError(email);
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      document.getElementById("register-email")?.focus();
      return;
    }
    const formData = new FormData();
    formData.set("email", email.trim());
    startCodeTransition(async () => {
      const result = await sendRegisterCodeAction(undefined, formData);
      if (result?.ok) {
        setSendError(null);
        setCooldown(RESEND_COUNTDOWN_SECONDS);
        toast({ title: result.message, variant: "success" });
        return;
      }
      const message = result?.message ?? "发送失败，请稍后重试";
      const waitMatch = message.match(/(\d+)\s*秒/);
      if (waitMatch) {
        setCooldown(Number(waitMatch[1]));
      }
      setSendError(message);
    });
  }

  /**
   * 提交注册：客户端先完整校验（noValidate 模式下接管原生校验），
   *  不合法则阻止提交、标出全部错误并聚焦首个错误字段；合法则放行给 registerFormAction
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors: FieldErrors = {
      email: getEmailError(email),
      code: getCodeError(code),
      password: getPasswordError(password) ?? undefined,
      confirmPassword: getConfirmPasswordError(password, confirmPassword),
    };
    const agreed = new FormData(event.currentTarget).get("agreeTerms") === "on";
    const nextTermsError = agreed ? null : "请先阅读并同意服务条款和隐私政策";

    const hasFieldError = Object.values(nextErrors).some(Boolean);
    if (hasFieldError || nextTermsError) {
      event.preventDefault();
      setErrors(nextErrors);
      setTermsError(nextTermsError);
      const focusTargets: Array<[keyof FieldErrors, string]> = [
        ["email", "register-email"],
        ["code", "register-code"],
        ["password", "register-password"],
        ["confirmPassword", "register-confirm-password"],
      ];
      const firstInvalid = focusTargets.find(([key]) => nextErrors[key]);
      if (firstInvalid) {
        document.getElementById(firstInvalid[1])?.focus();
      } else {
        document.getElementById("register-terms")?.focus();
      }
      return;
    }
    setErrors({});
    setTermsError(null);
  }

  const sendCodeDisabled = codePending || cooldown > 0;
  /** 注册已成功：在原位置展示成功提示并自动登录（不再整卡替换），期间禁止重复提交 */
  const succeeded = registerState?.ok === true;

  return (
    <>
      <form
        action={registerFormAction}
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <EmailField
          id="register-email"
          label="邮箱"
          value={email}
          onChange={handleFieldChange("email", setEmail)}
          onBlur={handleFieldBlur("email")}
          error={errors.email}
          autoFocus
        />

        <div>
          <label
            htmlFor="register-code"
            className="mb-1 block text-[12.5px] font-medium text-slate-500 dark:text-slate-400"
          >
            验证码
          </label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
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
                  handleFieldChange("code", setCode)(
                    event.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                aria-invalid={errors.code ? true : undefined}
                aria-describedby={errors.code ? "register-code-error" : undefined}
                className="bm-input h-10 w-full pl-9 pr-3 text-[13px] tracking-widest"
              />
            </div>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sendCodeDisabled}
              className="bm-btn-code h-10 shrink-0 px-3.5 text-[13px]"
            >
              {codePending
                ? "发送中..."
                : cooldown > 0
                  ? `${cooldown}s 后重发`
                  : "发送验证码"}
            </button>
          </div>
          {errors.code ? (
            <p
              id="register-code-error"
              className="mt-1 text-[12.5px] text-rose-600 dark:text-rose-400"
            >
              {errors.code}
            </p>
          ) : sendError ? (
            <p className="mt-1 text-[12.5px] text-rose-600 dark:text-rose-400">
              {sendError}
            </p>
          ) : null}
        </div>

        <PasswordField
          id="register-password"
          name="password"
          label="密码"
          autoComplete="new-password"
          value={password}
          onChange={handleFieldChange("password", setPassword)}
          onBlur={handleFieldBlur("password")}
          error={errors.password}
        />

        <PasswordField
          id="register-confirm-password"
          name="confirmPassword"
          label="确认密码"
          autoComplete="new-password"
          placeholder="再次输入密码"
          value={confirmPassword}
          onChange={handleFieldChange("confirmPassword", setConfirmPassword)}
          onBlur={handleFieldBlur("confirmPassword")}
          error={errors.confirmPassword}
        />

        <div>
          <label className="flex cursor-pointer select-none items-start gap-2">
            <input
              id="register-terms"
              type="checkbox"
              name="agreeTerms"
              required
              onChange={() => setTermsError(null)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px] accent-primary"
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
          {termsError ? (
            <p className="mt-1 text-[12.5px] text-rose-600 dark:text-rose-400">
              {termsError}
            </p>
          ) : null}
        </div>

        {succeeded ? (
          <FormAlert variant="success">注册成功，正在为你登录…</FormAlert>
        ) : registerState ? (
          <FormAlert>{registerState.message}</FormAlert>
        ) : null}

        <button
          type="submit"
          disabled={registerPending || succeeded}
          className="bm-btn-primary flex h-10 w-full items-center justify-center gap-1.5 text-[13.5px]"
        >
          {succeeded ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              登录中...
            </>
          ) : registerPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              提交中...
            </>
          ) : (
            <>
              开启我的书签库
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <AuthOAuthSection />
    </>
  );
}
