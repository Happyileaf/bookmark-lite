"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Bookmark,
  Globe,
  LayoutDashboard,
  LogOut,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type UserMenuProps = {
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  userLabel: string;
};

type MenuItem = {
  label: string;
  href: string;
  Icon: LucideIcon;
  adminOnly?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { label: "个人主页", href: "/my-bookmarks", Icon: Bookmark },
  { label: "个人空间", href: "/settings", Icon: Settings },
  { label: "平台主页", href: "/bookmarks", Icon: Globe },
  { label: "平台管理", href: "/admin/manage/bookmarks", Icon: LayoutDashboard, adminOnly: true },
];

export function UserMenu({ name, email, isAdmin, userLabel }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const menuId = useId();
  const [previousPathname, setPreviousPathname] = useState(pathname);

  if (previousPathname !== pathname) {
    setPreviousPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const container = containerRef.current;
      const target = event.target;
      if (!container || !(target instanceof Node) || container.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  const displayName = name?.trim() || (email ? email.split("@")[0] : "用户");
  const visibleItems = MENU_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-medium leading-none tracking-tight text-primary-foreground transition-opacity hover:opacity-85"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        title="账户"
        onClick={() => setIsOpen((value) => !value)}
      >
        {userLabel}
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-sm border border-border bg-popover shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium leading-none tracking-tight text-primary-foreground">
              {userLabel}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-semibold text-foreground">
                {displayName}
              </div>
              {email ? (
                <div className="truncate text-[11.5px] text-muted-foreground">{email}</div>
              ) : null}
            </div>
          </div>

          <nav className="flex flex-col gap-[5px] px-2 py-1.5">
            {visibleItems.map(({ label, href, Icon }) => {
              const isCurrent = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  aria-current={isCurrent ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-sm px-3 py-[7px] text-[13px] ${
                    isCurrent
                      ? "pointer-events-none bg-slate-100 font-medium text-foreground dark:bg-slate-800"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border px-2 py-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-sm px-3 py-[7px] text-left text-[13px] text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              退出登录
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
