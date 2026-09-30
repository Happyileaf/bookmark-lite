"use client";

import { useCallback, useState } from "react";
import { Shuffle } from "lucide-react";
import BookmarkCard, {
  type BookmarkItem,
  type BookmarkTag,
} from "@/components/bookmark/bookmark-card";
import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics/constants";
import { trackAnalyticsEvent } from "@/lib/analytics/tracker";
import { recordPublicBookmarkVisit } from "@/lib/bookmark-visit";
import { DEFAULT_RANDOM_BATCH_SIZE, MAX_RANDOM_EXCLUDE_IDS } from "@/lib/constants";

type RandomDiscoveryViewProps = {
  /** 服务端预取的一批随机书签（公共库或标签候选池为空时为空数组） */
  initialItems: BookmarkItem[];
  /** 当前激活标签 ID，「再来一批」时保持同一随机范围 */
  tagId?: string;
  /** 当前用户的个人标签列表（保存到个人空间时供选择） */
  userTagsForSaving: BookmarkTag[];
  /** 是否允许保存到个人空间（公共库且已登录时为 true） */
  canSaveToUser: boolean;
  /** 保存到个人空间的 server action（与列表卡片共用同一入口） */
  saveToUserAction?: (formData: FormData) => Promise<void>;
};

/** 随机发现接口的响应信封，data.items 为一批随机书签（候选池为空时为空数组） */
type RandomBookmarkListResponse = {
  ok: boolean;
  data?: {
    items: BookmarkItem[];
  };
  error?: {
    message?: string;
  };
};

/** 「再来一批」失败时的兜底提示文案（网络中断等无业务信息场景） */
const SHUFFLE_ERROR_FALLBACK_MESSAGE = "再来一批失败，请稍后重试";

/**
 * 随机发现视图
 *
 * @description 随机发现视图的核心交互区：一次随机展示一批（默认 15 个）公共
 * 书签的卡片网格，通过「再来一批」整批替换为新抽取的结果（携带最近展示过的
 * 书签 ID 作为排除条件避免短期重复）；卡片打开口径与列表网格一致（埋点 +
 * 访问上报 + 新窗口打开），保证热门书签统计来源统一
 * @param props.initialItems - 服务端预取的一批随机书签，候选池为空时为空数组
 * @param props.tagId - 当前激活标签 ID，存在时候选池限定为该标签下的书签
 * @param props.userTagsForSaving - 当前用户的个人标签列表（保存弹窗内选择）
 * @param props.canSaveToUser - 是否允许保存到个人空间
 * @param props.saveToUserAction - 保存到个人空间的 server action
 * @returns 随机发现视图 JSX
 */
function RandomDiscoveryView({
  initialItems,
  tagId,
  userTagsForSaving,
  canSaveToUser,
  saveToUserAction,
}: RandomDiscoveryViewProps) {
  /** 当前展示的随机书签批次，「再来一批」成功后整批替换 */
  const [currentItems, setCurrentItems] = useState(initialItems);
  /** 最近展示过的书签 ID（含初始批次），作为「再来一批」的排除条件，超出上限时丢弃最旧 ID */
  const [recentShownIds, setRecentShownIds] = useState<string[]>(
    initialItems.map((item) => item.id),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 打开书签：埋点、访问上报与新窗口打开的顺序和列表网格卡片（openBookmark）
   * 保持一致；随机发现仅存在于公共库，访问上报恒执行，作为热门书签统计的数据来源，
   * 上报为 fire-and-forget，不阻塞 window.open
   */
  const openBookmark = useCallback((bookmark: BookmarkItem) => {
    trackAnalyticsEvent(ANALYTICS_EVENT_NAMES.BOOKMARK_CLICKED, {
      bookmarkId: bookmark.id,
      url: bookmark.url,
    });
    recordPublicBookmarkVisit(bookmark.id);
    window.open(bookmark.url, "_blank", "noopener,noreferrer");
  }, []);

  /**
   * 再来一批：携带激活标签与最近展示过的书签 ID 作为排除条件重新抽取一整批；
   * 成功后整批替换当前卡片并把新批次 ID 追加进排除列表（仅保留最近
   * MAX_RANDOM_EXCLUDE_IDS 个），失败时保留当前批次、展示错误文案
   * （按钮本身即重试入口，请求期间禁用并显示抽取中，当前卡片保持可见）
   */
  const handleShuffle = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (tagId) params.set("tagId", tagId);
      if (recentShownIds.length > 0) {
        params.set("exclude", recentShownIds.join(","));
      }
      params.set("count", String(DEFAULT_RANDOM_BATCH_SIZE));
      const response = await fetch(`/api/bookmarks/random?${params.toString()}`, {
        cache: "no-store",
      });
      /** 网关错误页等非 JSON 响应解析失败时回退为 null，统一走错误提示分支 */
      const payload = (await response.json().catch(() => null)) as RandomBookmarkListResponse | null;
      if (!response.ok || !payload?.ok) {
        setErrorMessage(payload?.error?.message ?? SHUFFLE_ERROR_FALLBACK_MESSAGE);
        return;
      }

      const nextItems = payload.data?.items ?? [];
      setCurrentItems(nextItems);
      setRecentShownIds((prev) =>
        [...prev, ...nextItems.map((item) => item.id)].slice(-MAX_RANDOM_EXCLUDE_IDS),
      );
    } catch {
      /** 网络中断等异常无业务信息可展示，统一兜底文案即可 */
      setErrorMessage(SHUFFLE_ERROR_FALLBACK_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, recentShownIds, tagId]);

  return (
    <div>
      {/** 工具行：错误提示与「再来一批」入口恒定渲染，空态下仍可重试（候选池后续可能有数据） */}
      <div className="mb-6 flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
        {errorMessage ? (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
            {errorMessage}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void handleShuffle()}
          disabled={isLoading}
          aria-label="再来一批随机书签"
          className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-slate-200 bg-transparent px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <Shuffle className="h-4 w-4" />
          {isLoading ? "正在抽取..." : "再来一批"}
        </button>
      </div>

      {currentItems.length > 0 ? (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] max-[480px]:[grid-template-columns:minmax(0,1fr)]">
          {currentItems.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              scope="APP"
              onOpen={openBookmark}
              canSaveToUser={canSaveToUser}
              saveToUserAction={saveToUserAction}
              userTagsForSaving={userTagsForSaving}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-sm border border-dashed border-slate-300 bg-card p-10 text-center text-sm text-muted-foreground dark:border-slate-700">
          {tagId ? "该标签下暂无书签可供随机发现" : "暂无书签可供随机发现"}
        </div>
      )}
    </div>
  );
}

export default RandomDiscoveryView;
