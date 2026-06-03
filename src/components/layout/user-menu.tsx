"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type UserMenuProps = {
  email: string;
  isAdmin: boolean;
  userLabel: string;
};

export function UserMenu({ email, isAdmin, userLabel }: UserMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (!details?.open) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!details.contains(target)) {
        details.open = false;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const details = detailsRef.current;
      if (details?.open) {
        details.open = false;
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const closeMenu = () => {
    if (detailsRef.current?.open) {
      detailsRef.current.open = false;
    }
  };

  return (
    <details ref={detailsRef} className="relative z-50">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded border border-slate-300 bg-white px-2 py-1.5 text-slate-700 hover:bg-slate-50">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          {userLabel}
        </span>
        <span className="hidden truncate text-xs text-slate-500 sm:block">{email}</span>
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-56 rounded border border-slate-200 bg-white p-2 shadow-lg">
        <div className="border-b border-slate-100 px-2 pb-2 text-xs text-slate-500">
          <div className="truncate">{email}</div>
          <div>{isAdmin ? "超级管理员" : "普通用户"}</div>
        </div>

        <div className="mt-2 grid gap-1 text-sm">
          <Link href="/settings" onClick={closeMenu} className="rounded px-2 py-1.5 text-slate-700 hover:bg-slate-50">
            设置
          </Link>
          <Link
            href="/manage/bookmarks"
            onClick={closeMenu}
            className="rounded px-2 py-1.5 text-slate-700 hover:bg-slate-50"
          >
            我的书签管理
          </Link>
          {isAdmin ? (
            <Link
              href="/admin/manage/bookmarks"
              onClick={closeMenu}
              className="rounded px-2 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              全局书签管理
            </Link>
          ) : null}
          <Link
            href="/api/auth/signout"
            onClick={closeMenu}
            className="rounded px-2 py-1.5 text-rose-600 hover:bg-rose-50"
          >
            退出登录
          </Link>
        </div>
      </div>
    </details>
  );
}
