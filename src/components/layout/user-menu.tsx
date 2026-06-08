"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
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

  const handleSignOut = async () => {
    closeMenu();
    await signOut({ callbackUrl: "/" });
  };

  return (
    <details ref={detailsRef} className="relative z-50">
      <summary className="flex cursor-pointer list-none items-center p-0 text-slate-700">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          {userLabel}
        </span>
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-60 rounded border border-slate-200 bg-white p-2.5 shadow-lg">
        <div className="space-y-2 border-b border-slate-100 px-2.5 pt-1.5 pb-4">
          <div className="break-all text-sm leading-5 font-medium text-slate-800">{email}</div>
          <div className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs leading-4 text-slate-600">
            {isAdmin ? "超级管理员" : "普通用户"}
          </div>
        </div>

        <div className="mt-2.5 text-sm">
          <div className="grid gap-1 border-b border-slate-100 px-1 pb-2">
            <Link
              href="/my-bookmarks"
              onClick={closeMenu}
              className="rounded px-2 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              个人空间
            </Link>
            <Link
              href="/manage/bookmarks"
              onClick={closeMenu}
              className="rounded px-2 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              内容管理
            </Link>
            <Link
              href="/bookmarks"
              onClick={closeMenu}
              className="rounded px-2 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              应用空间
            </Link>
            {isAdmin ? (
              <Link
                href="/admin/manage/bookmarks"
                onClick={closeMenu}
                className="rounded px-2 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                应用内容管理
              </Link>
            ) : null}
          </div>

          <div className="mt-2 grid gap-1 px-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded px-2 py-1.5 text-rose-600 hover:bg-rose-50"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}
