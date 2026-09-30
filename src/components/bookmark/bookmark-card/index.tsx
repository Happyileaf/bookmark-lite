"use client";

import { useState } from "react";
import { CopyBookmarkUrlButton } from "@/components/bookmark/copy-bookmark-url-button";
import { FavoriteBookmarkButton } from "@/components/bookmark/favorite-bookmark-button";
import { SaveAppBookmarkModal } from "@/components/bookmark/save-app-bookmark-modal";
import { TagChip } from "@/components/ui/tag-chip";
import type { DataScope } from "@prisma/client";

/**
 * 书签条目携带的标签
 * 与列表、随机发现等接口返回的标签结构一致；颜色缺省（null）时由展示层以兜底色渲染
 */
export type BookmarkTag = {
  /** 标签 ID（React key 与保存、筛选等操作的定位依据） */
  id: string;
  /** 标签名称（卡片标签位与保存弹窗选项的展示文本） */
  name: string;
  /** 标签颜色，未设置时为 null，展示层兜底为中性色 */
  color: string | null;
};

/**
 * 书签条目
 * 列表网格与随机发现视图共用的展示结构，字段与 bookmarkService.list /
 * getRandomList 返回的条目一致（含 tags），统一类型避免各视图口径漂移
 */
export type BookmarkItem = {
  /** 书签 ID */
  id: string;
  /** 书签标题（卡片主文案） */
  title: string;
  /** 书签 URL（点击打开的目标与复制按钮的内容） */
  url: string;
  /** favicon 地址，未抓取到时为 null，由首字母色块兜底 */
  favicon: string | null;
  /** 书签描述，无内容时为 null，卡片上以占位空白维持布局稳定 */
  description: string | null;
  /** 是否收藏，仅个人库（USER）范围渲染收藏按钮时使用 */
  isFavorite: boolean;
  /** 书签挂载的标签列表 */
  tags: BookmarkTag[];
};

/**
 * favicon 缺失或加载失败时的兜底色板
 * 以标题哈希从色板取色：同一书签颜色稳定，七种高区分度色彩让卡片头部不至
 * 于清一色灰块
 */
const FAVICON_PALETTE = [
  "#1e80ff",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#db2777",
];

/** 以种子做 31 进制滚动哈希选色，保证同一书签兜底色稳定且分布均匀 */
function pickFaviconColor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return FAVICON_PALETTE[hash % FAVICON_PALETTE.length];
}

/** 取标题首字母作图标占位符，空标题兜底为问号 */
function readFallbackLetter(title: string): string {
  const trimmed = title.trim();
  return trimmed ? Array.from(trimmed)[0].toUpperCase() : "?";
}

/** 站点图标容器的形态变体：brand 为小尺寸品牌色块（默认），card 为书签卡片用的大圆角色块 */
type BookmarkFaviconVariant = "brand" | "card";

/**
 * 站点图标（favicon 展示 + 首字母色块兜底）
 *
 * @description favicon 加载成功前先以「标题首字母 + 哈希色块」占位，图片就绪后
 * 原位替换；加载失败则停留在色块形态，保证卡片头部不会出现空白或碎图
 * @param props.src - favicon 地址，为 null 时不发起图片加载，恒定渲染首字母色块
 * @param props.title - 书签标题，用于取首字母与兜底色
 * @param props.className - 尺寸等外观类，由调用方按展示场景指定（如 h-8 w-8）
 * @param props.variant - 形态变体：brand 为小尺寸品牌位色块（默认），card 为书签卡片的大圆角色块
 * @returns 站点图标 JSX
 */
export function BookmarkFavicon({
  src,
  title,
  className,
  variant = "brand",
}: {
  src: string | null;
  title: string;
  className?: string;
  variant?: BookmarkFaviconVariant;
}) {
  const [imageOk, setImageOk] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(src) && !imageFailed;
  const isCard = variant === "card";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${
        isCard ? "rounded-[8px]" : "rounded-sm"
      } ${className ?? ""}`}
      style={imageOk ? undefined : { backgroundColor: pickFaviconColor(title) }}
    >
      {!imageOk ? (
        <span className={`font-bold text-white ${isCard ? "text-sm" : "text-xs"}`}>
          {readFallbackLetter(title)}
        </span>
      ) : null}
      {showImage ? (
        <img
          src={src ?? undefined}
          alt=""
          loading="lazy"
          onLoad={() => setImageOk(true)}
          onError={() => setImageFailed(true)}
          className={`absolute inset-0 h-full w-full object-contain ${
            imageOk ? "" : "opacity-0"
          }`}
        />
      ) : null}
    </span>
  );
}

/**
 * 提取站点主机名
 *
 * @description 从书签 URL 解析主机名并去除 www. 前缀，解析失败时回退为原始 URL
 * @param url - 书签 URL
 * @returns 用于展示的主机名
 * @example
 * const hostname = readHostname("https://www.github.com/facebook/react");
 * // "github.com"
 */
export function readHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * 生成展示用 URL 文本
 *
 * @description 去掉书签 URL 的协议前缀与末尾斜杠，解析失败时回退为原始 URL
 * @param url - 书签 URL
 * @returns 用于展示的 URL 文本
 * @example
 * const displayUrl = readDisplayUrl("https://github.com/facebook/react/");
 * // "github.com/facebook/react"
 */
export function readDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${parsed.hostname.replace(/^www\./, "")}${pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

type BookmarkCardProps = {
  /** 书签条目数据 */
  bookmark: BookmarkItem;
  /** 数据范围，仅 USER（个人库）渲染收藏按钮 */
  scope: DataScope;
  /** 打开书签回调（点击与键盘 Enter/空格共用，埋点与访问上报由调用方负责） */
  onOpen: (bookmark: BookmarkItem) => void;
  /** 收藏状态切换成功后的本地同步回调（仅 USER 范围的收藏按钮使用） */
  onToggleFavorite?: (bookmarkId: string, nextIsFavorite: boolean) => void;
  /** 是否允许保存到个人空间（公共库且已登录时为 true） */
  canSaveToUser: boolean;
  /** 保存到个人空间的 server action（与 canSaveToUser 同时提供时渲染保存弹窗） */
  saveToUserAction?: (formData: FormData) => Promise<void>;
  /** 保存到个人空间弹窗中供选择的个人标签列表 */
  userTagsForSaving?: BookmarkTag[];
};

/**
 * 书签卡片
 *
 * @description 列表网格与随机发现视图共用的单条书签卡片：展示 favicon、域名、
 * 展示 URL、操作按钮区（收藏/复制/保存到个人空间）、标题、描述与标签；点击
 * 卡片主体（命中按钮、链接或存在文本选区时不触发）或按 Enter/空格调用
 * onOpen 打开书签。打开行为（埋点、访问上报、新窗口）由调用方注入，
 * 保证各视图统计口径一致
 * @param props.bookmark - 书签条目数据
 * @param props.scope - 数据范围，仅 USER 时渲染收藏按钮
 * @param props.onOpen - 打开书签回调（点击与键盘共用同一入口）
 * @param props.onToggleFavorite - 收藏状态切换成功后的本地同步回调
 * @param props.canSaveToUser - 是否允许保存到个人空间
 * @param props.saveToUserAction - 保存到个人空间的 server action
 * @param props.userTagsForSaving - 保存弹窗中供选择的个人标签列表
 * @returns 书签卡片 JSX
 */
function BookmarkCard({
  bookmark,
  scope,
  onOpen,
  onToggleFavorite,
  canSaveToUser,
  saveToUserAction,
  userTagsForSaving,
}: BookmarkCardProps) {
  /**
   * 卡片整块点击打开书签：命中按钮/链接（操作件有自己的交互）或存在文本
   * 选区（用户正在复制描述文本）时不触发，避免误开新窗口
   */
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a")) return;

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;

    onOpen(bookmark);
  };

  /** 键盘访问（Enter/空格）与点击打开同一入口，保证可访问性 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(bookmark);
    }
  };

  return (
    <article
      tabIndex={0}
      role="link"
      aria-label={`打开书签：${bookmark.title}`}
      onClick={handleContentClick}
      onKeyDown={handleKeyDown}
      className="group relative min-w-0 flex cursor-pointer flex-col rounded-sm border border-background bg-card p-5 shadow-[0_1px_2px_rgba(20,30,45,0.025),0_6px_18px_rgba(20,30,45,0.03)] outline-none transition-all hover:border-primary hover:bg-white hover:shadow-[0_2px_6px_rgba(20,30,45,0.05),0_12px_28px_rgba(20,30,45,0.07)] focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:bg-muted dark:focus-visible:outline-primary"
    >
      <div
        className="relative flex min-w-0 cursor-pointer select-text flex-col"
      >
        <div className="pointer-events-auto flex items-center gap-3">
          <BookmarkFavicon
            src={bookmark.favicon}
            title={bookmark.title}
            variant="card"
            className="h-8 w-8"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-5 text-foreground">
              {readHostname(bookmark.url)}
            </p>
            <p
              className="truncate text-xs leading-4 text-muted-foreground"
              title={bookmark.url}
            >
              {readDisplayUrl(bookmark.url)}
            </p>
          </div>
          <div
            className="flex shrink-0 items-center gap-0.5 [&_button]:h-7 [&_button]:w-7 [&_svg]:h-4 [&_svg]:w-4"
          >
            {scope === "USER" ? (
              <FavoriteBookmarkButton
                bookmarkId={bookmark.id}
                isFavorite={bookmark.isFavorite}
                scope={scope}
                onToggle={onToggleFavorite}
              />
            ) : null}
            <CopyBookmarkUrlButton url={bookmark.url} />
            {canSaveToUser && saveToUserAction ? (
              <SaveAppBookmarkModal
                action={saveToUserAction}
                bookmarkId={bookmark.id}
                tags={userTagsForSaving ?? []}
              />
            ) : null}
          </div>
        </div>

        <h3
          className="mt-3 h-10 break-words text-sm font-semibold leading-5 tracking-[-0.01em] text-foreground line-clamp-2"
          title={bookmark.title}
        >
          {bookmark.title}
        </h3>

        <p
          className="mt-1 min-h-0 flex-1 break-words text-xs leading-normal text-muted-foreground line-clamp-2"
          title={bookmark.description ?? ""}
        >
          {bookmark.description || "\u00A0"}
        </p>

        {bookmark.tags.length > 0 ? (
          <div className="mt-3.5 flex flex-wrap gap-2">
            {bookmark.tags.map((tag) => (
              <TagChip
                key={tag.id}
                color={tag.color ?? "#94a3b8"}
                className="max-w-full"
                title={tag.name}
              >
                {tag.name}
              </TagChip>
            ))}
          </div>
        ) : (
          <div className="mt-3.5" />
        )}
      </div>
    </article>
  );
}

export default BookmarkCard;
