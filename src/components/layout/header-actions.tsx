"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { UserMenu } from "@/components/layout/user-menu";

type Props = {
  isAuthed: boolean;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  userLabel: string;
};

export function HeaderActions({ isAuthed, name, email, isAdmin, userLabel }: Props) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isGuidePage = pathname === "/guide";

  const guideLink = (
    <Link
      href="/guide"
      className="hidden items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:flex"
    >
      <BookOpen className="h-4 w-4" aria-hidden="true" />
      使用指南
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 h-[60px] shrink-0 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-full items-center justify-between gap-3">
        <Link href="/bookmarks" className="flex min-w-0 items-center gap-2">
          <Image
            src="/logo_assets/logo_export.png"
            alt="Bookmark Lite Logo"
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 rounded-sm"
            priority
          />
          <span className="truncate text-lg font-semibold text-foreground">
            Bookmark Lite
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {!isGuidePage ? guideLink : null}

          {isAuthPage && !isAuthed ? null : (
            <>
              <ThemeSwitch />
              {isAuthed ? (
                <UserMenu
                  name={name}
                  email={email}
                  isAdmin={isAdmin}
                  userLabel={userLabel}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-sm border border-primary px-3.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-sm bg-primary px-3.5 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    注册
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
