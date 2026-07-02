import Image from "next/image";
import Link from "next/link";
import { auth } from "@/server/auth/auth";
import { HeaderActions } from "@/components/layout/header-actions";

export async function AppHeader() {
  const session = await auth();
  const isAuthed = !!session?.user;
  const isAdmin = session?.user?.role === "super_admin";
  const userLabel =
    session?.user?.email?.[0]?.toUpperCase() ??
    session?.user?.name?.[0]?.toUpperCase() ??
    "U";

  return (
    <header className="relative z-50 border-b border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-800/70">
      <div className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center">
          <Link href="/bookmarks" className="inline-flex max-w-full items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-200">
            <Image
              src="/logo_assets/logo_export.png"
              alt="Bookmark Lite Logo"
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 rounded-sm"
              priority
            />
            <span className="truncate">Bookmark Lite</span>
          </Link>
        </div>

        <div className="flex items-center justify-end gap-2 text-sm">
          <HeaderActions
            isAuthed={isAuthed}
            email={session?.user?.email ?? "已登录用户"}
            isAdmin={isAdmin}
            userLabel={userLabel}
          />
        </div>
      </div>
    </header>
  );
}
