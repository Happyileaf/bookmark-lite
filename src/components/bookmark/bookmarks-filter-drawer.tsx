"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Settings } from "lucide-react";
import { SideDrawer } from "@/components/layout/side-drawer";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { CountBadge } from "@/components/ui";

/**
 * 抽屉筛选项（快捷导航或标签）。
 */
export type BookmarksFilterDrawerItem = {
  /** 唯一标识。 */
  key: string;
  /** 跳转链接（已携带筛选参数）。 */
  href: string;
  /** 展示名称。 */
  label: string;
  /** 书签计数。 */
  count: number;
  /** 是否为当前激活项。 */
  active: boolean;
  /** 快捷导航图标元素。 */
  icon?: ReactNode;
  /** 标签色点颜色。 */
  color?: string | null;
};

/**
 * 书签筛选抽屉入参。
 */
type BookmarksFilterDrawerProps = {
  /** 快捷导航筛选项。 */
  aggregateItems: BookmarksFilterDrawerItem[];
  /** 标签筛选项。 */
  tagItems: BookmarksFilterDrawerItem[];
};

/**
 * 移动端书签筛选抽屉：由顶部栏汉堡按钮通过全局事件触发，从左侧滑出，集中管理快捷导航与标签筛选。
 * 使用方需以当前筛选参数作为 key，导航后组件重挂载、抽屉自动收起。
 */
export function BookmarksFilterDrawer({ aggregateItems, tagItems }: BookmarksFilterDrawerProps) {
  /**
   * 渲染单个筛选项；compact 为 true 时保持紧凑间距（用于标签项）。
   */
  const renderItem = (item: BookmarksFilterDrawerItem, closeDrawer: () => void, compact = false) => (
    <Link
      key={item.key}
      href={item.href}
      onClick={closeDrawer}
      aria-current={item.active ? "page" : undefined}
      className={`flex items-center rounded-sm text-sm transition-colors ${
        compact ? "gap-2 px-2 py-2" : "gap-2.5 px-3 py-2.5"
      } ${
        item.active ? "bg-primary font-medium text-primary-foreground" : "text-foreground hover:bg-muted"
      }`}
    >
      {item.icon}
      {item.color !== undefined ? (
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: item.color ?? "#cbd5e1" }}
        />
      ) : null}
      <span className="flex-1 truncate">{item.label}</span>
      {compact ? (
        <span className={`text-xs ${item.active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {item.count}
        </span>
      ) : (
        <CountBadge count={item.count} active={item.active} />
      )}
    </Link>
  );

  return (
    <SideDrawer
      ariaLabel="书签筛选"
      footer={(closeDrawer) => (
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/settings"
            onClick={closeDrawer}
            className="flex min-w-0 items-center gap-2 rounded-sm px-2 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <Settings className="h-[18px] w-[18px] shrink-0" />
            <span>设置</span>
          </Link>
          <ThemeSwitch />
        </div>
      )}
    >
      {(closeDrawer) => (
        <>
          <div className="mb-2 px-3 pt-2 text-xs tracking-wide text-muted-foreground">快捷导航</div>
          <nav aria-label="快捷导航" className="flex flex-col gap-1.5">
            {aggregateItems.map((item) => renderItem(item, closeDrawer))}
          </nav>

          <div className="mx-2 my-4 border-t border-border/50" />

          <div className="mb-2 px-2 text-xs tracking-wide text-muted-foreground">标签</div>
          <nav aria-label="标签筛选" className="flex flex-col gap-1.5">
            {tagItems.map((item) => renderItem(item, closeDrawer, true))}
          </nav>
        </>
      )}
    </SideDrawer>
  );
}
