import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/layout/forgot-password-form";
import {
  AuthBrandPanel,
  AuthMobileBrand,
  AuthMobileCopyright,
} from "@/components/layout/auth-brand-panel";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/my-bookmarks");
  }

  return (
    <div className="grid min-h-full w-full lg:grid-cols-2">
      <AuthBrandPanel />

      <section className="relative flex min-h-full flex-col items-center justify-start px-6 py-10 sm:px-10 lg:justify-center lg:px-16">
        <AuthMobileBrand withIntro={false} />

        <div className="bm-card relative z-10 w-full max-w-[420px] p-6 sm:p-7">
          <div className="mb-5">
            <h2 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">
              重置你的密码
            </h2>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
              输入注册邮箱，我们会向你发送一封重置密码的邮件
            </p>
          </div>

          <ForgotPasswordForm />

          <p className="mt-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
            想起密码了？
            <Link href="/login" className="bm-link ml-1 font-medium">
              返回登录
            </Link>
          </p>
        </div>

        <AuthMobileCopyright />
      </section>
    </div>
  );
}
