import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/layout/register-form";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/my-bookmarks");
  }

  return (
    <section className="flex h-full w-full items-center justify-center p-6">
      <div className="-translate-y-12 w-full max-w-md rounded border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
      <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">注册</h1>
      <RegisterForm />
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        已有账号？
        <Link href="/login" className="ml-1 text-slate-900 hover:underline dark:text-slate-100">
          去登录
        </Link>
      </p>
      </div>
    </section>
  );
}
