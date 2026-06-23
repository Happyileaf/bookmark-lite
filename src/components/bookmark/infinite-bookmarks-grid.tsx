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
      <div className="rounded border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
        当前视图下暂无书签
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5">
        {items.map((bookmark) => (
          <li
            key={bookmark.id}
            className="group relative h-full cursor-pointer overflow-hidden rounded border border-slate-200 bg-white p-4 hover:border-slate-300 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-600/70"
          >
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:inset-0 focus-visible:z-50 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              打开书签：{bookmark.title}
            </a>

            <div className="pointer-events-auto absolute right-4 top-4 z-30 flex items-center gap-1">
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

            <div
              className="pointer-events-auto relative z-20 grid h-full min-w-0 cursor-pointer content-start gap-2 select-text"
              onClick={(e) => handleContentClick(e, bookmark.url)}
            >
              <div className="flex min-w-0 items-center gap-2 pr-20">
                <img
                  src={bookmark.favicon || "/logo_assets/logo_export.ico"}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded object-contain"
                />
                <h3
                  className="min-w-0 flex-1 truncate text-base font-medium leading-6 text-slate-900 group-hover:text-slate-700 dark:text-slate-200 dark:group-hover:text-slate-300"
                  title={bookmark.title}
                >
                  {bookmark.title}
                </h3>
              </div>

              <p className="h-4 min-w-0 w-full truncate text-xs leading-4 text-slate-500 dark:text-slate-400" title={bookmark.url}>
                {bookmark.url}
              </p>

              <p
                className="h-10 min-w-0 w-full overflow-hidden break-words text-sm leading-5 text-slate-700 dark:text-slate-300/80 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                title={bookmark.description ?? ""}
              >
                {bookmark.description || "\u00A0"}
              </p>

              <div className="h-12 overflow-hidden" title={bookmark.tags.map((tag) => tag.name).join(" / ")}>
                <div className="flex flex-wrap gap-1">
                  {bookmark.tags.slice(0, 6).map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700/50 dark:text-slate-300"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {bookmark.tags.length > 6 ? (
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">...</span>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-2 rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-400">
        <div className="flex items-center justify-between gap-3">
          <span>
            已加载 {items.length} / {pagination.total} 条
          </span>
          <span>{hasMore ? "滚动到底自动加载" : "已全部加载完成"}</span>
        </div>
        {isLoading ? <p className="text-slate-500 dark:text-slate-400">正在加载更多...</p> : null}
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
