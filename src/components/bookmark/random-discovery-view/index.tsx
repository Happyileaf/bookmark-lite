"use client";

import { useCallback } from "react";
import BookmarkCard, {
  type BookmarkItem,
  type BookmarkTag,
} from "@/components/bookmark/bookmark-card";
import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics/constants";
import { trackAnalyticsEvent } from "@/lib/analytics/tracker";
import { recordPublicBookmarkVisit } from "@/lib/bookmark-visit";


type RandomDiscoveryViewProps = {
  /** 服务端预取的一批随机书签（公共库候选池为空时为空数组） */
  initialItems: BookmarkItem[];
  /** 当前用户的个人标签列表（保存到个人空间时供选择） */
  userTagsForSaving: BookmarkTag[];
  /** 是否允许保存到个人空间（公共库且已登录时为 true） */
  canSaveToUser: boolean;
  /** 保存到个人空间的 server action（与列表卡片共用同一入口） */
  saveToUserAction?: (formData: FormData) => Promise<void>;
};



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
  userTagsForSaving,
  canSaveToUser,
  saveToUserAction,
}: RandomDiscoveryViewProps) {
  /** 当前展示的随机书签批次 */
  const currentItems = initialItems;

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

  return (
    <div>
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
          暂无书签可供随机发现
        </div>
      )}
    </div>
  );
}

export default RandomDiscoveryView;
