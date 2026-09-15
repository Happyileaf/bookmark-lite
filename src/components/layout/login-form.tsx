"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { EmailField, PasswordField } from "@/components/layout/auth-fields";
import { AuthOAuthSection } from "@/components/layout/auth-oauth-section";
import { FormAlert } from "@/components/ui";

type Props = {
  nextUrl?: string;
  /** 注册成功回跳时带入的邮箱（用于预填并展示一次性的成功提示） */
  registeredEmail?: string;
};

/**
 * 计算安全的回跳地址
 *
 * @description 仅允许站内相对路径（以 / 开头且非 // 协议相对地址），防止开放重定向
 * @param nextUrl - URL 查询参数中的回跳地址
 * @returns 合法时原样返回，否则回退到默认页 /my-bookmarks
 * @example
 * getSafeNextUrl("/my-bookmarks"); // "/my-bookmarks"
 * getSafeNextUrl("https://evil.com"); // "/my-bookmarks"
 */
function getSafeNextUrl(nextUrl: string | undefined): string {
  if (nextUrl && nextUrl.startsWith("/") && !nextUrl.startsWith("//")) {
    return nextUrl;
  }
  return "/my-bookmarks";
}

export function LoginForm({ nextUrl, registeredEmail }: Props) {
  const [email, setEmail] = useState(registeredEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /** 注册成功提示仅展示到用户开始编辑为止 */
  const [showRegisteredNotice, setShowRegisteredNotice] = useState(
    Boolean(registeredEmail),
  );

  const safeNextUrl = getSafeNextUrl(nextUrl);
  /** 忘记密码链接携带已输入的邮箱，减少重复输入 */
  const forgotHref = email.trim()
    ? `/forgot-password?email=${encodeURIComponent(email.trim())}`
    : "/forgot-password";

  /** 用户继续输入时清除表单级错误与注册成功提示 */
  function handleFieldChange(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      if (error) setError(null);
      if (showRegisteredNotice) setShowRegisteredNotice(false);
    };
  }

  /**
   * 提交登录
   *
   * @description 凭据登录成功后整页跳转至 safeNextUrl；成功路径保持 loading 直至页面卸载，
   * 避免跳转窗口期按钮可重复点击，仅失败路径解除 loading
   * @param event - 表单提交事件
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });
    if (!result || result.error) {
      setLoading(false);
      setError("邮箱或密码错误");
      return;
    }
    window.location.href = safeNextUrl;
  }

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <EmailField
          id="login-email"
          label="邮箱"
          value={email}
          onChange={handleFieldChange(setEmail)}
          autoFocus={!registeredEmail}
        />

        <PasswordField
          id="login-password"
          name="password"
          label="密码"
          autoComplete="current-password"
          value={password}
          onChange={handleFieldChange(setPassword)}
          autoFocus={Boolean(registeredEmail)}
        />

        <div className="flex items-center justify-end">
          <a href={forgotHref} className="bm-link whitespace-nowrap text-[13px]">
            忘记密码？
          </a>
        </div>

        {error ? (
          <FormAlert>{error}</FormAlert>
        ) : showRegisteredNotice ? (
          <FormAlert variant="success">
            注册成功，请使用邮箱和密码登录
          </FormAlert>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="bm-btn-primary flex h-10 w-full items-center justify-center gap-1.5 text-[13.5px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              登录中...
            </>
          ) : (
            <>
              进入 Bookmark Lite
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <AuthOAuthSection />
    </>
  );
}
