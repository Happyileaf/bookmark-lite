import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/layout/reset-password-form";
import { AuthBrandPanel } from "@/components/layout/auth-brand-panel";
import { getSessionUser } from "@/server/auth/session";
import { passwordResetService } from "@/server/services/password-reset.service";
import { isAppError } from "@/server/types/errors";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  if (user) {
    redirect("/my-bookmarks");
  }

  const params = await searchParams;
  const token = readParam(params.token) ?? "";

  let verifyResult: { email: string } | null = null;
  let errorMessage: string | null = null;

  if (token) {
    try {
      verifyResult = await passwordResetService.verifyToken(token);
    } catch (error) {
      errorMessage = isAppError(error) ? error.message : "重置链接无效或已失效";
    }
  } else {
    errorMessage = "重置链接无效";
  }

  return (
    <div className="grid h-full w-full lg:grid-cols-2">
      <AuthBrandPanel />

      <section className="relative flex h-full flex-col items-center justify-start overflow-y-auto px-6 py-10 sm:px-10 [scrollbar-gutter:stable] lg:justify-center lg:px-16">
        <div className="relative z-10 mb-8 w-full max-w-[440px] lg:hidden">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#0d9488]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span
              className="text-[24px] font-extrabold text-[#0d9488]"
              style={{ letterSpacing: "-0.02em" }}
            >
              Bookmark Lite
            </span>
          </div>
        </div>

        <div className="bm-card relative z-10 w-full max-w-[440px] p-6 sm:p-8">
          {verifyResult ? (
            <>
              <div className="mb-6">
                <h2 className="text-[22px] font-semibold text-[#0f1f1c] dark:text-[#e8f3ef]">
                  设置新密码
                </h2>
                <p className="mt-1 text-[13px] text-[#4b5c58] dark:text-[#a9bcb6]">
                  为你的账户设置一个新的登录密码
                </p>
              </div>
              <ResetPasswordForm token={token} email={verifyResult.email} />
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-[22px] font-semibold text-[#0f1f1c] dark:text-[#e8f3ef]">
                  重置链接无效
                </h2>
                <p className="mt-1 text-[13px] text-[#4b5c58] dark:text-[#a9bcb6]">
                  {errorMessage}
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-[13px] leading-[1.6] text-[#4b5c58] dark:text-[#a9bcb6]">
                  重置链接可能已过期或已被使用。你可以重新发起一次密码重置请求。
                </p>
                <Link
                  href="/forgot-password"
                  className="bm-btn-primary flex h-[44px] w-full items-center justify-center gap-2 text-[15px]"
                >
                  重新申请重置链接
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="relative z-10 mt-8 block w-full max-w-[440px] text-center lg:hidden">
          <p className="text-[12px] text-[#7a8a86] dark:text-[#7d9089]">
            © 2026 Bookmark Lite · 保留所有权利
          </p>
        </div>
      </section>
    </div>
  );
}
