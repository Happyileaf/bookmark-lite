import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/layout/reset-password-form";
import {
  AuthBrandPanel,
  AuthMobileBrand,
  AuthMobileCopyright,
} from "@/components/layout/auth-brand-panel";
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
    <div className="grid min-h-full w-full lg:grid-cols-2">
      <AuthBrandPanel />

      <section className="relative flex min-h-full flex-col items-center justify-start px-6 py-10 sm:px-10 lg:justify-center lg:px-16">
        <AuthMobileBrand withIntro={false} />

        <div className="bm-card relative z-10 w-full max-w-[420px] p-6 sm:p-7">
          {verifyResult ? (
            <>
              <div className="mb-5">
                <h2 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">
                  设置新密码
                </h2>
                <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                  为你的账户设置一个新的登录密码
                </p>
              </div>
              <ResetPasswordForm token={token} email={verifyResult.email} />
            </>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">
                  重置链接无效
                </h2>
                <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                  {errorMessage}
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-[13px] leading-[1.6] text-slate-500 dark:text-slate-400">
                  重置链接可能已过期或已被使用。你可以重新发起一次密码重置请求。
                </p>
                <Link
                  href="/forgot-password"
                  className="bm-btn-primary flex h-9 w-full items-center justify-center gap-1.5 text-[13.5px]"
                >
                  重新申请重置链接
                </Link>
              </div>
            </>
          )}
        </div>

        <AuthMobileCopyright />
      </section>
    </div>
  );
}
