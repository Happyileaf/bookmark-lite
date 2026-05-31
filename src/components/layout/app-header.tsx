import Link from "next/link";
import { auth } from "@/server/auth/auth";

export async function AppHeader() {
  const session = await auth();
  const isAuthed = !!session?.user;
  const isAdmin = session?.user?.role === "super_admin";
  const userLabel =
    session?.user?.email?.[0]?.toUpperCase() ??
    session?.user?.name?.[0]?.toUpperCase() ??
    "U";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-4 py-3">
        <div className="min-w-0">
          <Link href="/bookmarks" className="truncate text-base font-semibold text-slate-900">
            Bookmark Lite
          </Link>
        </div>

        <div className="flex items-center justify-end gap-2 text-sm">
          {isAuthed ? (
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded border border-slate-300 bg-white px-2 py-1.5 text-slate-700 hover:bg-slate-50">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {userLabel}
                </span>
                <span className="hidden truncate text-xs text-slate-500 sm:block">
                  {session?.user?.email}
                </span>
              </summary>

              <div className="absolute right-0 z-20 mt-2 w-56 rounded border border-slate-200 bg-white p-2 shadow-lg">
                <div className="border-b border-slate-100 px-2 pb-2 text-xs text-slate-500">
                  <div className="truncate">{session?.user?.email}</div>
                  <div>{isAdmin ? "超级管理员" : "普通用户"}</div>
                </div>

                <div className="mt-2 grid gap-1 text-sm">
                  <Link
                    href="/settings"
                    className="rounded px-2 py-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    设置
                  </Link>
                  <Link
                    href="/manage/bookmarks"
                    className="rounded px-2 py-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    我的书签管理
                  </Link>
                  {isAdmin ? (
                    <Link
                      href="/admin/manage/bookmarks"
                      className="rounded px-2 py-1.5 text-slate-700 hover:bg-slate-50"
                    >
                      全局书签管理
                    </Link>
                  ) : null}
                  <Link
                    href="/api/auth/signout"
                    className="rounded px-2 py-1.5 text-rose-600 hover:bg-rose-50"
                  >
                    退出登录
                  </Link>
                </div>
              </div>
            </details>
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
