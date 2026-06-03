import Link from "next/link";
import { auth } from "@/server/auth/auth";
import { UserMenu } from "@/components/layout/user-menu";

export async function AppHeader() {
  const session = await auth();
  const isAuthed = !!session?.user;
  const isAdmin = session?.user?.role === "super_admin";
  const userLabel =
    session?.user?.email?.[0]?.toUpperCase() ??
    session?.user?.name?.[0]?.toUpperCase() ??
    "U";

  return (
    <header className="relative z-50 border-b border-slate-200 bg-white">
      <div className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-4 py-3">
        <div className="min-w-0">
          <Link href="/bookmarks" className="truncate text-base font-semibold text-slate-900">
            Bookmark Lite
          </Link>
        </div>

        <div className="flex items-center justify-end gap-2 text-sm">
          {isAuthed ? (
            <UserMenu email={session?.user?.email ?? "已登录用户"} isAdmin={isAdmin} userLabel={userLabel} />
          ) : (
            <>
              <Link
                href="/login"
                className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
