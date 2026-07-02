"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/layout/user-menu";

type Props = {
  isAuthed: boolean;
  email: string;
  isAdmin: boolean;
  userLabel: string;
};

export function HeaderActions({ isAuthed, email, isAdmin, userLabel }: Props) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthed) {
    return <UserMenu email={email} isAdmin={isAdmin} userLabel={userLabel} />;
  }

  if (isAuthPage) {
    return null;
  }

  return (
    <>
      <Link
        href="/login"
        className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
      >
        登录
      </Link>
      <Link
        href="/register"
        className="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500"
      >
        注册
      </Link>
    </>
  );
}
