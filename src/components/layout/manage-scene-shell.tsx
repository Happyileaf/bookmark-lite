import Link from "next/link";
import type { DataScope } from "@prisma/client";

type ManageKey = "bookmarks" | "tags" | "import-export" | "trash" | "settings";

type Props = {
  scope: DataScope;
  current: ManageKey;
  children: React.ReactNode;
};

const userMenu: Array<{ key: ManageKey; label: string; href: string }> = [
  { key: "bookmarks", label: "个人书签管理", href: "/manage/bookmarks" },
  { key: "tags", label: "个人标签管理", href: "/manage/tags" },
  { key: "import-export", label: "导入导出", href: "/manage/import-export" },
  { key: "trash", label: "回收站", href: "/manage/trash" },
  { key: "settings", label: "个人设置", href: "/settings" },
];

const appMenu: Array<{ key: ManageKey; label: string; href: string }> = [
  { key: "bookmarks", label: "应用书签管理", href: "/admin/manage/bookmarks" },
  { key: "tags", label: "应用标签管理", href: "/admin/manage/tags" },
  { key: "import-export", label: "导入导出", href: "/admin/manage/import-export" },
  { key: "trash", label: "应用回收站", href: "/admin/manage/trash" },
  { key: "settings", label: "应用设置", href: "/admin/settings" },
];

export function ManageSceneShell({ scope, current, children }: Props) {
  const isAppScope = scope === "APP";
  const menu = isAppScope ? appMenu : userMenu;

  return (
    <section className="grid gap-4 md:grid-cols-[240px_1fr]">
      <aside className="h-fit rounded border border-slate-200 bg-white p-3">
        <div className="border-b border-slate-100 pb-2">
          <h2 className="text-sm font-semibold text-slate-900">
            {isAppScope ? "应用管理菜单" : "个人管理菜单"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isAppScope ? "当前数据域：应用级" : "当前数据域：个人"}
          </p>
        </div>

        <nav className="mt-3 grid gap-1 text-sm">
          {menu.map((item) => {
            const active = item.key === current;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`rounded px-2 py-1.5 ${
                  active
                    ? "bg-slate-100 font-medium text-slate-900"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">{children}</div>
    </section>
  );
}
