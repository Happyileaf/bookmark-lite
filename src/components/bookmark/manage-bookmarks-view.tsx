import Link from "next/link";
import type { DataScope } from "@prisma/client";
import {
  Bookmark,
  Eye,
  EyeOff,
  Inbox,
  Search,
  Star,
  X,
} from "lucide-react";
import { createBookmarkAction, updateBookmarkAction } from "@/actions/bookmark.actions";
import { CreateBookmarkModal } from "@/components/bookmark/create-bookmark-modal";
import {
  DeleteBookmarkButton,
  ManageSearchShortcuts,
} from "@/components/bookmark/favorite-bookmark-button";
import { EditBookmarkModal } from "@/components/bookmark/edit-bookmark-modal";
import { BookmarkFavicon } from "@/components/bookmark/infinite-bookmarks-grid";
import type { SessionUser } from "@/server/auth/session";
import { bookmarkService } from "@/server/services/bookmark.service";
import { tagService } from "@/server/services/tag.service";
import {
  EmptyState,
  Pagination,
  StatChip,
  TagChip,
  VisibilityBadge,
} from "@/components/ui";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  scope: DataScope;
  user: SessionUser | null;
  searchParams: SearchParams;
};

const MANAGE_PAGE_SIZE = 20;

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function readPage(value: string | string[] | undefined): number {
  const raw = readParam(value);
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function readHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return "";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return `${Math.floor(days / 30)}个月前`;
}

export async function ManageBookmarksView({ scope, user, searchParams }: Props) {
  const q = readParam(searchParams.q);
  const sort = readParam(searchParams.sort);
  const page = readPage(searchParams.page);
  const currentSort = sort ?? "default";
  const listPath = scope === "APP" ? "/admin/manage/bookmarks" : "/manage/bookmarks";
  const [listResult, tags] = await Promise.all([
    bookmarkService.list({
      scope,
      user,
      query: {
        includeHidden: true,
        q,
        sort: (sort as
          | "default"
          | "created_desc"
          | "created_asc"
          | "updated_desc"
          | "visited_desc"
          | "title_asc"
          | "title_desc"
          | undefined) ?? "default",
        page,
        pageSize: MANAGE_PAGE_SIZE,
      },
    }),
    tagService.list(scope, user),
  ]);
  const { items, pagination } = listResult;
  const safePage = Math.min(pagination.page, pagination.totalPages);

  return (
    <section>
      <ManageSearchShortcuts />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-[20px] font-bold text-foreground">书签管理</h1>
          <p className="text-[13px] text-muted-foreground">搜索、筛选、整理你的全部书签。</p>
        </div>
        <CreateBookmarkModal action={createBookmarkAction.bind(null, scope)} tags={tags} />
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatChip icon={Bookmark} tint="#2563eb" value={pagination.total} label="全部书签" />
        {/* TODO(ui-upgrade): 收藏数统计待接入真实聚合，见 spec 待补逻辑清单 */}
        <StatChip icon={Star} tint="#f59e0b" value={0} label="已收藏" />
        {/* TODO(ui-upgrade): 公开书签数统计待接入真实聚合，见 spec 待补逻辑清单 */}
        <StatChip icon={Eye} tint="#10b981" value={0} label="公开" />
        {/* TODO(ui-upgrade): 隐藏书签数统计待接入真实聚合，见 spec 待补逻辑清单 */}
        <StatChip icon={EyeOff} tint="#64748b" value={0} label="隐藏" />
      </div>

      <form className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="manage-search-q"
            name="q"
            defaultValue={q}
            placeholder="搜索标题、URL 或标签"
            className="ctl w-full pl-9 pr-3"
          />
        </div>
        <select name="sort" defaultValue={currentSort} className="ctl ctl-sel" aria-label="排序方式">
          <option value="default">默认排序</option>
          <option value="created_desc">创建时间（新到旧）</option>
          <option value="created_asc">创建时间（旧到新）</option>
          <option value="title_asc">标题 A-Z</option>
          <option value="title_desc">标题 Z-A</option>
        </select>
        {/* TODO(ui-upgrade): 收藏筛选下拉仅 UI，筛选条件尚未接线，见 spec 待补逻辑清单 */}
        <select className="ctl ctl-sel" defaultValue="all" aria-label="按收藏状态筛选">
          <option value="all">全部收藏状态</option>
          <option value="favorite">仅已收藏</option>
          <option value="unfavorite">仅未收藏</option>
        </select>
        {/* TODO(ui-upgrade): 可见性筛选下拉仅 UI，筛选条件尚未接线，见 spec 待补逻辑清单 */}
        <select className="ctl ctl-sel" defaultValue="all" aria-label="按可见性筛选">
          <option value="all">全部可见性</option>
          <option value="visible">仅可见</option>
          <option value="hidden">仅隐藏</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Search className="h-4 w-4" />
          搜索
        </button>
        <Link
          href={listPath}
          aria-label="清空搜索条件"
          title="清空搜索条件"
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Link>
      </form>

      {items.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={Inbox}
          title="没有符合条件的书签"
          description="换个关键词，或清除全部筛选条件试试。"
          action={
            <Link
              href={listPath}
              className="inline-flex h-8 items-center rounded-sm border border-border px-3.5 text-[13px] text-foreground transition-colors hover:bg-muted"
            >
              清除筛选
            </Link>
          }
        />
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {items.map((bookmark) => {
            const visibleTags = bookmark.tags.slice(0, 3);
            const hiddenTagCount = bookmark.tags.length - visibleTags.length;
            return (
              <div
                key={bookmark.id}
                className="flex items-center gap-[14px] rounded-sm border border-slate-200 bg-white px-3.5 py-2.5 transition-all hover:border-primary/40 hover:shadow-[0_4px_14px_-8px_rgba(15,23,42,0.15)] dark:border-slate-700 dark:bg-card"
              >
                <BookmarkFavicon src={bookmark.favicon} title={bookmark.title} className="h-7 w-7" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[13.5px] font-semibold text-foreground">
                      {bookmark.title}
                    </h3>
                    <VisibilityBadge visible={bookmark.isVisible} className="shrink-0" />
                  </div>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-[12.5px] text-muted-foreground transition-colors hover:text-primary"
                  >
                    {readHost(bookmark.url)}
                  </a>
                </div>

                {bookmark.tags.length > 0 ? (
                  <div className="hidden max-w-[300px] items-center gap-[5px] overflow-hidden md:flex">
                    {visibleTags.map((tag) => (
                      <TagChip key={tag.id} color={tag.color ?? undefined}>
                        {tag.name}
                      </TagChip>
                    ))}
                    {hiddenTagCount > 0 ? (
                      <TagChip className="tag-more">+{hiddenTagCount}</TagChip>
                    ) : null}
                  </div>
                ) : null}

                <span className="hidden w-[72px] shrink-0 justify-end text-xs text-muted-foreground lg:inline-flex">
                  {formatRelativeTime(bookmark.lastVisitedAt ?? bookmark.createdAt)}
                </span>

                <div className="flex shrink-0 items-center gap-0.5">
                  <form action={updateBookmarkAction.bind(null, scope)}>
                    <input type="hidden" name="id" value={bookmark.id} />
                    <input
                      type="hidden"
                      name="isFavorite"
                      value={bookmark.isFavorite ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      aria-label={bookmark.isFavorite ? "取消收藏" : "收藏"}
                      title={bookmark.isFavorite ? "取消收藏" : "收藏"}
                      className={`icon-btn star ${bookmark.isFavorite ? "on" : ""}`}
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  </form>

                  <form action={updateBookmarkAction.bind(null, scope)}>
                    <input type="hidden" name="id" value={bookmark.id} />
                    <input
                      type="hidden"
                      name="isVisible"
                      value={bookmark.isVisible ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      aria-label={bookmark.isVisible ? "隐藏书签" : "设为可见"}
                      title={bookmark.isVisible ? "隐藏书签" : "设为可见"}
                      className="icon-btn"
                    >
                      {bookmark.isVisible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </form>

                  <EditBookmarkModal
                    action={updateBookmarkAction.bind(null, scope)}
                    bookmark={bookmark}
                    tags={tags}
                  />
                  <DeleteBookmarkButton
                    bookmarkId={bookmark.id}
                    scope={scope}
                    title={bookmark.title}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.total > 0 ? (
        <Pagination
          className="mt-4"
          page={safePage}
          pageSize={MANAGE_PAGE_SIZE}
          total={pagination.total}
          basePath={listPath}
          queryParams={{ q, sort: currentSort !== "default" ? currentSort : undefined }}
          itemName="条书签"
        />
      ) : null}
    </section>
  );
}
