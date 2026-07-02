import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/layout/login-form";
import { AuthBrandPanel } from "@/components/layout/auth-brand-panel";
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
          <h1
            className="mb-2 text-[26px] font-extrabold leading-[1.25] text-[#0f1f1c] dark:text-[#e8f3ef]"
            style={{ letterSpacing: "-0.02em" }}
          >
            连接信息，轻点收藏
          </h1>
          <p className="text-[15px] leading-[1.6] text-[#4b5c58] dark:text-[#a9bcb6]">
            你看到的每一个网页、灵感或工具，都可以一键保存，并自动变得清晰、有序、可随时回到。
          </p>
        </div>

        <div className="bm-card relative z-10 w-full max-w-[440px] p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-[22px] font-semibold text-[#0f1f1c] dark:text-[#e8f3ef]">
              欢迎回来
            </h2>
            <p className="mt-1 text-[13px] text-[#4b5c58] dark:text-[#a9bcb6]">
              继续进入你的 Bookmark Lite 空间
            </p>
          </div>

          <LoginForm nextUrl={nextUrl} />

          <div className="mt-6 flex items-center justify-center gap-4">
            <TrustItem label="免费使用" />
            <TrustItem label="无需信用卡" />
            <TrustItem label="数据仅属于你" />
          </div>

          <p className="mt-6 text-center text-[13px] text-[#4b5c58] dark:text-[#a9bcb6]">
            还没有账号？
            <Link href="/register" className="bm-link ml-1 font-medium">
              立即注册
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

function TrustItem({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 text-[12px] text-[#7a8a86] dark:text-[#7d9089]">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {label}
    </span>
  );
}
