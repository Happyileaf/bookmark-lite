"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { UserMenu } from "@/components/layout/user-menu";
import { OPEN_SIDE_DRAWER_EVENT } from "@/lib/constants";

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
  // 书签展示页（筛选抽屉）与管理类页面（导航抽屉）提供移动端抽屉入口
  const showDrawerButton =
    pathname === "/bookmarks" ||
    pathname === "/my-bookmarks" ||
    pathname === "/settings" ||
    pathname === "/api-tokens" ||
    pathname.startsWith("/manage") ||
    pathname.startsWith("/admin");

  /**
   * 通知页面内抽屉打开（抽屉组件挂在页面内，通过全局事件解耦）。
   */
  const openDrawer = () => {
    window.dispatchEvent(new CustomEvent(OPEN_SIDE_DRAWER_EVENT));
  };

  /**
   * 渲染品牌链接：桌面端靠左，移动端居中。
   */
  const renderBrand = (className: string) => (
    <Link href="/bookmarks" className={className}>
      <Image
        src="/logo_assets/logo_export.png"
        alt="Bookmark Lite Logo"
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-sm"
        priority
      />
      <span className="truncate text-lg font-semibold text-foreground max-[300px]:hidden">
        Bookmark Lite
      </span>
    </Link>
  );

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
    <header className="app-header sticky top-0 z-40 shrink-0 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="pt-safe flex h-full items-center justify-between gap-3">
        {/* 左区：移动端抽屉按钮 + 桌面端品牌；flex-1 与右区对称保证品牌居中；不用 min-w-0，防止极窄屏下左区塌缩导致抽屉按钮溢出与品牌重叠 */}
        <div className="flex flex-1 items-center gap-2 lg:flex-none">
          {showDrawerButton ? (
            <button
              type="button"
              className="icon-btn shrink-0 lg:hidden"
              aria-label="打开菜单"
              onClick={openDrawer}
            >
              <Menu className="h-4 w-4" />
            </button>
          ) : null}
          {renderBrand("hidden min-w-0 items-center gap-2 lg:flex")}
        </div>

        {renderBrand("flex min-w-0 items-center justify-center gap-2 lg:hidden")}

        <div className="flex flex-1 items-center justify-end gap-3 lg:flex-none">
          {!isGuidePage ? guideLink : null}

          {isAuthPage && !isAuthed ? null : (
            <>
              {/* 移动端的主题切换入口移至筛选抽屉底部 */}
              <div className="hidden lg:block">
                <ThemeSwitch />
              </div>
              {isAuthed ? (
                <UserMenu
                  name={name}
                  email={email}
                  isAdmin={isAdmin}
                  userLabel={userLabel}
                />
              ) : (
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href="/login"
                    className="shrink-0 whitespace-nowrap rounded-sm border border-primary px-3.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-blue-50 dark:hover:bg-blue-950 max-[480px]:px-2.5"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="shrink-0 whitespace-nowrap rounded-sm bg-primary px-3.5 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 max-[480px]:px-2.5"
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
