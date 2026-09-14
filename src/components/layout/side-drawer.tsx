"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Bookmark, X } from "lucide-react";
import { OPEN_SIDE_DRAWER_EVENT } from "@/lib/constants";

/**
 * 通用侧边抽屉入参。
 */
type SideDrawerProps = {
  /** 抽屉的无障碍名称（dialog aria-label）。 */
  ariaLabel: string;
  /** 抽屉主体内容，接收 closeDrawer 以便内部导航后关闭抽屉。 */
  children: (closeDrawer: () => void) => ReactNode;
  /** 底部固定区域内容，接收 closeDrawer 以便内部导航后关闭抽屉（布局由内容方自控）。 */
  footer?: (closeDrawer: () => void) => ReactNode;
};

/**
 * 移动端通用侧边抽屉外壳：提供遮罩、面板、头部、开关与滚动锁定逻辑。
 * 由顶部栏汉堡按钮通过全局事件触发，从左侧滑出；桌面端（lg 及以上）不渲染交互。
 * 同一时刻页面只挂载一个抽屉实例，因此多个业务抽屉可共用同一打开事件。
 */
export function SideDrawer({ ariaLabel, children, footer }: SideDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * 关闭抽屉。
   */
  const closeDrawer = () => {
    setIsOpen(false);
  };

  // 监听顶部栏汉堡按钮的打开事件（两处组件分属不同子树，通过全局事件解耦）
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener(OPEN_SIDE_DRAWER_EVENT, handleOpen);
    return () => {
      window.removeEventListener(OPEN_SIDE_DRAWER_EVENT, handleOpen);
    };
  }, []);

  // 抽屉打开期间：支持 Escape 关闭，并锁定背景页面滚动
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* 遮罩：点击关闭抽屉 */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-[opacity,visibility] duration-300 lg:hidden ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden="true"
        onClick={closeDrawer}
      />

      {/* 抽屉面板 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[280px] max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-2xl transition-[transform,visibility] duration-300 dark:border-slate-800 dark:bg-card lg:hidden ${
          isOpen ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-safe">
          <div className="flex items-center gap-2 pt-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bookmark className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-foreground">Bookmark Lite</span>
          </div>
          <button
            type="button"
            className="icon-btn mt-3"
            aria-label="关闭"
            onClick={closeDrawer}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]"
          style={{ overscrollBehavior: "contain" }}
        >
          {children(closeDrawer)}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-border/50 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
            {footer(closeDrawer)}
          </div>
        ) : null}
      </div>
    </>
  );
}
