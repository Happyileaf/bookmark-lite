import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/layout/forgot-password-form";
import { AuthBrandPanel } from "@/components/layout/auth-brand-panel";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/my-bookmarks");
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
          <div className="mb-6">
            <h2 className="text-[22px] font-semibold text-[#0f1f1c] dark:text-[#e8f3ef]">
              重置你的密码
            </h2>
            <p className="mt-1 text-[13px] text-[#4b5c58] dark:text-[#a9bcb6]">
              输入注册邮箱，我们会向你发送一封重置密码的邮件
            </p>
          </div>

          <ForgotPasswordForm />

          <p className="mt-6 text-center text-[13px] text-[#4b5c58] dark:text-[#a9bcb6]">
            想起密码了？
            <Link href="/login" className="bm-link ml-1 font-medium">
              返回登录
            </Link>
          </p>
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
