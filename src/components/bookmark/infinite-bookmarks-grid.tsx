"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CopyBookmarkUrlButton } from "@/components/bookmark/copy-bookmark-url-button";
import { FavoriteBookmarkButton } from "@/components/bookmark/favorite-bookmark-button";
import { SaveAppBookmarkModal } from "@/components/bookmark/save-app-bookmark-modal";
import { TagChip } from "@/components/ui/tag-chip";
import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics/constants";
import { trackAnalyticsEvent } from "@/lib/analytics/tracker";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { DataScope } from "@prisma/client";

type DisplayView = "all" | "favorites" | "untagged" | "recent_added" | "recent_visited";

type BookmarkTag = {
  id: string;
  name: string;
  color: string | null;
};

type BookmarkItem = {
  id: string;
  title: string;
  url: string;
  favicon: string | null;
  description: string | null;
  isFavorite: boolean;
  tags: BookmarkTag[];
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type Query = {
  q?: string;
  tagId?: string;
  view: DisplayView;
};

type Props = {
  scope: DataScope;
  query: Query;
  initialItems: BookmarkItem[];
  initialPagination: Pagination;
  userTagsForSaving: BookmarkTag[];
  canSaveToUser: boolean;
  saveToUserAction?: (formData: FormData) => Promise<void>;
};

type ListResponse = {
  ok: boolean;
  data?: {
    items: BookmarkItem[];
    pagination: Pagination;
  };
  error?: {
    message?: string;
  };
};

const FAVICON_PALETTE = [
  "#1e80ff",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#db2777",
];

function pickFaviconColor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return FAVICON_PALETTE[hash % FAVICON_PALETTE.length];
}

function readFallbackLetter(title: string): string {
  const trimmed = title.trim();
  return trimmed ? Array.from(trimmed)[0].toUpperCase() : "?";
}

/** 站点图标容器的形态变体：brand 为小尺寸品牌色块（默认），card 为书签卡片用的大圆角色块 */
type BookmarkFaviconVariant = "brand" | "card";

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
function readHostname(url: string): string {
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
function readDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${parsed.hostname.replace(/^www\./, "")}${pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

function mergeUniqueById(prev: BookmarkItem[], next: BookmarkItem[]) {
  const ids = new Set(prev.map((item) => item.id));
  const merged = [...prev];
  for (const item of next) {
    if (ids.has(item.id)) continue;
    ids.add(item.id);
    merged.push(item);
  }
  return merged;
}

export function InfiniteBookmarksGrid({
  scope,
  query,
  initialItems,
  initialPagination,
  userTagsForSaving,
  canSaveToUser,
  saveToUserAction,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleToggleFavorite = useCallback((bookmarkId: string, nextIsFavorite: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === bookmarkId ? { ...item, isFavorite: nextIsFavorite } : item,
      ),
    );
  }, []);

  // 打开书签并上报点击埋点（点击与键盘打开共用，保证统计口径一致）
  const openBookmark = useCallback((bookmark: BookmarkItem) => {
    trackAnalyticsEvent(ANALYTICS_EVENT_NAMES.BOOKMARK_CLICKED, {
      bookmarkId: bookmark.id,
      url: bookmark.url,
    });
    window.open(bookmark.url, "_blank", "noopener,noreferrer");
  }, []);

  const handleContentClick = useCallback((e: React.MouseEvent, bookmark: BookmarkItem) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a")) return;

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;

    openBookmark(bookmark);
  }, [openBookmark]);

  const hasMore = pagination.page < pagination.totalPages;

  const queryBase = useMemo(() => {
    const params = new URLSearchParams();
    params.set("scope", scope);
    params.set("view", query.view);
    params.set("pageSize", String(DEFAULT_PAGE_SIZE));
    if (query.q) params.set("q", query.q);
    if (query.tagId) params.set("tagId", query.tagId);
    return params;
  }, [query.q, query.tagId, query.view, scope]);

  const loadNextPage = useCallback(async () => {
    if (loadingRef.current || isLoading || !hasMore) return;
    const nextPage = pagination.page + 1;

    loadingRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams(queryBase);
      params.set("page", String(nextPage));
      const response = await fetch(`/api/bookmarks?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as ListResponse;
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "加载更多书签失败");
      }

      setItems((prev) => mergeUniqueById(prev, payload.data!.items));
      setPagination(payload.data.pagination);
    } catch (error) {
      const message = error instanceof Error ? error.message : "加载更多书签失败";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [hasMore, isLoading, pagination.page, queryBase]);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        void loadNextPage();
      },
      {
        root: null,
        rootMargin: "320px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadNextPage]);

  if (items.length === 0) {
    const emptyText = query.q
      ? `没有找到与「${query.q}」相关的书签`
      : scope === "APP"
        ? "这座库还在生长，第一批优质网站正在路上。"
        : "这里还空着。去公共书签库逛逛，把喜欢的收进来。";
    return (
      <div className="rounded-sm border border-dashed border-slate-300 bg-card p-10 text-center text-sm text-muted-foreground dark:border-slate-700">
        {emptyText}
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] max-[480px]:[grid-template-columns:minmax(0,1fr)]">
        {items.map((bookmark) => (
          <article
            key={bookmark.id}
            tabIndex={0}
            role="link"
            aria-label={`打开书签：${bookmark.title}`}
            onClick={(e) => handleContentClick(e, bookmark)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openBookmark(bookmark);
              }
            }}
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
                      onToggle={handleToggleFavorite}
                    />
                  ) : null}
                  <CopyBookmarkUrlButton url={bookmark.url} />
                  {canSaveToUser && saveToUserAction ? (
                    <SaveAppBookmarkModal
                      action={saveToUserAction}
                      bookmarkId={bookmark.id}
                      tags={userTagsForSaving}
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
        ))}
      </div>

      <div className="mt-6 space-y-2 rounded-sm border border-slate-200 bg-card px-4 py-3 text-sm text-muted-foreground dark:border-slate-700">
        <div className="flex items-center justify-between gap-3">
          <span>
            已加载 {items.length} / {pagination.total} 条
          </span>
          <span>{hasMore ? "滚动加载更多" : "已加载全部"}</span>
        </div>
        {isLoading ? <p className="text-muted-foreground">正在加载更多...</p> : null}
        {errorMessage ? (
          <p className="text-rose-600 dark:text-rose-400">
            {errorMessage}
            <button
              type="button"
              onClick={() => void loadNextPage()}
              className="ml-2 text-rose-700 underline underline-offset-2 hover:text-rose-800 dark:text-rose-300 dark:hover:text-rose-200"
            >
              点击重试
            </button>
          </p>
        ) : null}
      </div>

      <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
    </div>
  );
}
