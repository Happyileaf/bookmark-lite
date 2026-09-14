"use client";

import Link from "next/link";
import { SideDrawer } from "@/components/layout/side-drawer";
import { ThemeSwitch } from "@/components/layout/theme-switch";

/**
 * 管理导航抽屉菜单项。
 */
export type ManageNavDrawerItem = {
  /** 唯一标识。 */
  key: string;
  /** 展示名称。 */
  label: string;
  /** 跳转链接。 */
  href: string;
  /** 是否为当前激活项。 */
  active: boolean;
};

/**
 * 管理导航抽屉入参。
 */
type ManageNavDrawerProps = {
  /** 快速入口菜单项。 */
  sceneItems: ManageNavDrawerItem[];
  /** 管理菜单项。 */
  menuItems: ManageNavDrawerItem[];
  /** 管理菜单分组名称（如“管理菜单”/“平台管理”）。 */
  menuGroupLabel: string;
};

/**
 * 移动端管理导航抽屉：由顶部栏汉堡按钮通过全局事件触发，从左侧滑出，
 * 集中呈现快速入口与管理菜单，替代移动端的横向滚动导航条。
 */
export function ManageNavDrawer({ sceneItems, menuItems, menuGroupLabel }: ManageNavDrawerProps) {
  /**
   * 渲染单个菜单项。
   */
  const renderItem = (item: ManageNavDrawerItem, closeDrawer: () => void) => (
    <Link
      key={item.key}
      href={item.href}
      onClick={closeDrawer}
      aria-current={item.active ? "page" : undefined}
      className={`flex items-center gap-2 rounded-sm px-2 py-2 text-sm transition-colors ${
        item.active ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-muted"
      }`}
    >
      <span className="flex-1 truncate">{item.label}</span>
    </Link>
  );

  return (
    <SideDrawer
      ariaLabel="管理导航"
      footer={() => (
        <div className="flex items-center justify-end">
          <ThemeSwitch />
        </div>
      )}
    >
      {(closeDrawer) => (
        <>
          <div className="mb-3 px-2 pt-2 text-sm font-semibold text-foreground">快速入口</div>
          <nav aria-label="快速入口" className="flex flex-col gap-1.5">
            {sceneItems.map((item) => renderItem(item, closeDrawer))}
          </nav>

          <div className="mx-2 my-4 border-t border-border/50" />

          <div className="mb-3 px-2 text-sm font-semibold text-foreground">{menuGroupLabel}</div>
          <nav aria-label={menuGroupLabel} className="flex flex-col gap-1.5">
            {menuItems.map((item) => renderItem(item, closeDrawer))}
          </nav>
        </>
      )}
    </SideDrawer>
  );
}
