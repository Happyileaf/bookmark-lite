import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/layout/login-form";
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
    <section className="mx-auto max-w-md rounded border border-slate-200 bg-white p-6">
      <h1 className="mb-4 text-xl font-semibold text-slate-900">登录</h1>
      <LoginForm nextUrl={nextUrl} />
      <p className="mt-4 text-sm text-slate-600">
        还没有账号？
        <Link href="/register" className="ml-1 text-slate-900 hover:underline">
          去注册
        </Link>
      </p>
    </section>
  );
}
