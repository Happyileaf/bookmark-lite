import Link from "next/link";
import type { DataScope } from "@prisma/client";

type ManageKey = "bookmarks" | "tags" | "import-export" | "trash" | "settings" | "extension";

type Props = {
  scope: DataScope;
  current: ManageKey;
  children: React.ReactNode;
};

const sceneMenu: Array<{ label: string; href: string }> = [
  { label: "我的书签", href: "/my-bookmarks" },
  { label: "网站首页", href: "/" },
];

const userMenu: Array<{ key: ManageKey; label: string; href: string }> = [
  { key: "bookmarks", label: "书签管理", href: "/manage/bookmarks" },
  { key: "tags", label: "标签管理", href: "/manage/tags" },
  { key: "import-export", label: "导入导出", href: "/manage/import-export" },
  { key: "trash", label: "回收站", href: "/manage/trash" },
  { key: "settings", label: "设置", href: "/settings" },
  { key: "extension", label: "API Token", href: "/api-tokens" },
];

const appMenu: Array<{ key: ManageKey; label: string; href: string }> = [
  { key: "bookmarks", label: "书签管理", href: "/admin/manage/bookmarks" },
  { key: "tags", label: "标签管理", href: "/admin/manage/tags" },
  { key: "import-export", label: "导入导出", href: "/admin/manage/import-export" },
  { key: "trash", label: "回收站", href: "/admin/manage/trash" },
  { key: "settings", label: "设置", href: "/admin/settings" },
  { key: "extension", label: "API Token", href: "/admin/api-tokens" },
];

export function ManageSceneShell({ scope, current, children }: Props) {
  const isAppScope = scope === "APP";
  const menu = isAppScope ? appMenu : userMenu;

  return (
    <section className="flex min-h-0 w-full flex-1 items-stretch overflow-y-auto">
      <aside className="sticky top-0 w-[200px] shrink-0 self-stretch border-r border-slate-200 bg-white px-3 py-4 dark:border-slate-800 dark:bg-card">
        <p className="nav-group">快速入口</p>
        <nav className="mb-5">
          {sceneMenu.map((item) => (
            <Link key={item.href} href={item.href} className="nav-item">
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="nav-group">{isAppScope ? "平台管理" : "管理菜单"}</p>
        <nav>
          {menu.map((item) => {
            const active = item.key === current;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`nav-item${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 self-start px-8 py-6">{children}</div>
    </section>
  );
}
