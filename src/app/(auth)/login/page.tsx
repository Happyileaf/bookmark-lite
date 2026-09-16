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
  const registered = readParam(params.registered);
  const email = readParam(params.email);
  /** 注册成功回跳（registered=1）时带入的邮箱，用于预填与成功提示 */
  const registeredEmail = registered === "1" && email ? email : undefined;

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
              你的书签库一切如常，随时继续
            </p>
          </div>

          <LoginForm nextUrl={nextUrl} registeredEmail={registeredEmail} />

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
