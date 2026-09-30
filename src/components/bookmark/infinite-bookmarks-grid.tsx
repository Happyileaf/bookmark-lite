"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BookmarkCard, {
  type BookmarkItem,
  type BookmarkTag,
} from "@/components/bookmark/bookmark-card";
import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics/constants";
import { trackAnalyticsEvent } from "@/lib/analytics/tracker";
import { recordPublicBookmarkVisit } from "@/lib/bookmark-visit";
import { DEFAULT_PAGE_SIZE, HOT_VISIT_WINDOW_DAYS } from "@/lib/constants";
import type { DataScope } from "@prisma/client";

type DisplayView = "all" | "favorites" | "untagged" | "recent_added" | "recent_visited" | "hot" | "random";

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

  /**
   * 打开书签并上报点击埋点（点击与键盘打开共用，保证统计口径一致）；
   * 公共库书签额外上报访问事件，作为热门书签统计的数据来源，
   * 上报为 fire-and-forget，不阻塞 window.open
   */
  const openBookmark = useCallback((bookmark: BookmarkItem) => {
    trackAnalyticsEvent(ANALYTICS_EVENT_NAMES.BOOKMARK_CLICKED, {
      bookmarkId: bookmark.id,
      url: bookmark.url,
    });
    if (scope === "APP") {
      recordPublicBookmarkVisit(bookmark.id);
    }
    window.open(bookmark.url, "_blank", "noopener,noreferrer");
  }, [scope]);

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
    /** 空态文案优先级：搜索空态 > 热门空态 > 按数据范围的默认空态；热门为 APP 专属视图，无需再分范围 */
    const emptyText = query.q
      ? `没有找到与「${query.q}」相关的书签`
      : query.view === "hot"
        ? `暂无热门书签，最近 ${HOT_VISIT_WINDOW_DAYS} 天还没有公共书签被访问过。`
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
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            scope={scope}
            onOpen={openBookmark}
            onToggleFavorite={handleToggleFavorite}
            canSaveToUser={canSaveToUser}
            saveToUserAction={saveToUserAction}
            userTagsForSaving={userTagsForSaving}
          />
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
