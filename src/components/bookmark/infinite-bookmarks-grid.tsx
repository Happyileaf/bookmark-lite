"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CopyBookmarkUrlButton } from "@/components/bookmark/copy-bookmark-url-button";
import { FavoriteBookmarkButton } from "@/components/bookmark/favorite-bookmark-button";
import { SaveAppBookmarkModal } from "@/components/bookmark/save-app-bookmark-modal";
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
  "#2563eb",
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

export function BookmarkFavicon({
  src,
  title,
  className,
}: {
  src: string | null;
  title: string;
  className?: string;
}) {
  const [imageOk, setImageOk] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(src) && !imageFailed;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-sm ${className ?? ""}`}
      style={{ backgroundColor: pickFaviconColor(title) }}
    >
      {!imageOk ? (
        <span className="text-xs font-bold text-white">{readFallbackLetter(title)}</span>
      ) : null}
      {showImage ? (
        <img
          src={src ?? undefined}
          alt=""
          loading="lazy"
          onLoad={() => setImageOk(true)}
          onError={() => setImageFailed(true)}
          className={`absolute inset-0 m-auto h-4 w-4 rounded-[2px] object-contain ${
            imageOk ? "" : "opacity-0"
          }`}
        />
      ) : null}
    </span>
  );
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

  const handleContentClick = useCallback((e: React.MouseEvent, url: string) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a")) return;

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;

    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

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
    return (
      <div className="rounded-sm border border-dashed border-slate-300 bg-card p-10 text-center text-sm text-muted-foreground dark:border-slate-700">
        当前视图下暂无书签
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))] max-[480px]:[grid-template-columns:1fr]">
        {items.map((bookmark) => (
          <article
            key={bookmark.id}
            tabIndex={0}
            role="link"
            aria-label={`打开书签：${bookmark.title}`}
            onClick={(e) => handleContentClick(e, bookmark.url)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                window.open(bookmark.url, "_blank", "noopener,noreferrer");
              }
            }}
            className="group relative flex cursor-pointer flex-col rounded-sm border border-background bg-card p-5 outline-none transition-all hover:border-primary hover:bg-white hover:shadow-md focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:bg-muted dark:focus-visible:outline-primary"
          >
            <div
              className="relative flex min-w-0 cursor-pointer select-text flex-col"
            >
              <div className="pointer-events-auto mb-4 flex items-center gap-3">
                <BookmarkFavicon src={bookmark.favicon} title={bookmark.title} className="h-7 w-7" />
                <h3
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground"
                  title={bookmark.title}
                >
                  {bookmark.title}
                </h3>
                <div
                  className="-mr-1 -mt-1 flex shrink-0 items-center gap-0.5"
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

              <p
                className="mb-3 truncate text-xs text-muted-foreground"
                title={bookmark.url}
              >
                {bookmark.url}
              </p>

              <p
                className="mb-4 min-h-0 flex-1 text-xs leading-relaxed text-card-foreground/80 line-clamp-2"
                title={bookmark.description ?? ""}
              >
                {bookmark.description || "\u00A0"}
              </p>

              {bookmark.tags.length > 0 ? (
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {bookmark.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-auto" />
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
          <span>{hasMore ? "滚动到底自动加载" : "已全部加载完成"}</span>
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
