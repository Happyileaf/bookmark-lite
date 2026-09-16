import Link from "next/link";
import type { DataScope } from "@prisma/client";
import { ManageNavDrawer } from "@/components/layout/manage-nav-drawer";

type ManageKey =
  | "users"
  | "bookmarks"
  | "tags"
  | "import-export"
  | "trash"
  | "settings"
  | "extension"
  | "analytics";

type Props = {
  scope: DataScope;
  current: ManageKey;
  children: React.ReactNode;
};

const sceneMenu: Array<{ label: string; href: string }> = [
  { label: "个人主页", href: "/my-bookmarks" },
  { label: "平台主页", href: "/" },
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
  { key: "users", label: "用户管理", href: "/admin/manage/users" },
  { key: "bookmarks", label: "书签管理", href: "/admin/manage/bookmarks" },
  { key: "tags", label: "标签管理", href: "/admin/manage/tags" },
  { key: "import-export", label: "导入导出", href: "/admin/manage/import-export" },
  { key: "trash", label: "回收站", href: "/admin/manage/trash" },
  { key: "settings", label: "平台设置", href: "/admin/settings" },
];

/** 数据分析菜单（仅平台管理域展示） */
const analyticsMenu: Array<{ key: ManageKey; label: string; href: string }> = [
  { key: "analytics", label: "数据概览", href: "/admin/analytics/overview" },
];

export function ManageSceneShell({ scope, current, children }: Props) {
  const isAppScope = scope === "APP";
  const menu = isAppScope ? appMenu : userMenu;
  const menuGroupLabel = isAppScope ? "平台管理" : "内容管理";

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-clip lg:flex-row lg:items-stretch lg:overflow-x-visible">
      {/* 移动端导航抽屉：由顶部栏汉堡按钮触发 */}
      <ManageNavDrawer
        sceneItems={sceneMenu.map((item) => ({
          key: item.href,
          label: item.label,
          href: item.href,
          active: false,
        }))}
        menuItems={menu.map((item) => ({
          key: item.key,
          label: item.label,
          href: item.href,
          active: item.key === current,
        }))}
        menuGroupLabel={menuGroupLabel}
        analyticsGroup={
          isAppScope
            ? {
                label: "数据分析",
                items: analyticsMenu.map((item) => ({
                  key: item.key,
                  label: item.label,
                  href: item.href,
                  active: item.key === current,
                })),
              }
            : undefined
        }
      />
      {/* 桌面端侧边导航（移动端由抽屉替代） */}
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:w-[200px] lg:shrink-0 lg:self-stretch lg:border-r lg:border-slate-200 lg:bg-white lg:px-3 lg:py-4 lg:dark:border-slate-800 lg:dark:bg-card">
        <p className="nav-group">快速入口</p>
        <nav className="mb-5">
          {sceneMenu.map((item) => (
            <Link key={item.href} href={item.href} className="nav-item mb-[5px]">
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="nav-group">{menuGroupLabel}</p>
        <nav className={isAppScope ? "mb-5" : undefined}>
          {menu.map((item) => {
            const active = item.key === current;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`nav-item mb-[5px]${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {isAppScope ? (
          <>
            <p className="nav-group">数据分析</p>
            <nav>
              {analyticsMenu.map((item) => {
                const active = item.key === current;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`nav-item mb-[5px]${active ? " active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </>
        ) : null}
      </aside>
      <div className="min-w-0 flex-1 self-stretch px-4 py-4 lg:self-start lg:px-8 lg:py-6">{children}</div>
    </section>
  );
}
