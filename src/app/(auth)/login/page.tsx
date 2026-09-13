import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/layout/login-form";
import {
  AuthBrandPanel,
  AuthMobileBrand,
  AuthMobileCopyright,
  AuthTrustMarks,
} from "@/components/layout/auth-brand-panel";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  if (user) {
    redirect("/my-bookmarks");
  }
  const params = await searchParams;
  const nextUrl = readParam(params.next);

  return (
    <div className="grid min-h-full w-full lg:grid-cols-2">
      <AuthBrandPanel />

      <section className="relative flex min-h-full flex-col items-center justify-start px-6 py-10 sm:px-10 lg:justify-center lg:px-16">
        <AuthMobileBrand />

        <div className="bm-card relative z-10 w-full max-w-[420px] p-6 sm:p-7">
          <div className="mb-5">
            <h2 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">
              欢迎回来
            </h2>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
              继续进入你的 Bookmark Lite 空间
            </p>
          </div>

          <LoginForm nextUrl={nextUrl} />

          <AuthTrustMarks />

          <p className="mt-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
            还没有账号？
            <Link href="/register" className="bm-link ml-1 font-medium">
              立即注册
            </Link>
          </p>
        </div>

        <AuthMobileCopyright />
      </section>
    </div>
  );
}
