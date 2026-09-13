import Link from "next/link";
import type { DataScope } from "@prisma/client";
import {
  FileText,
  Archive,
  Bookmark as BookmarkIcon,
  Clock,
  Flame,
  Inbox,
  Search,
  Tag as TagIcon,
  Tags,
  X,
} from "lucide-react";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { deleteTagAction, reorderTagAction, upsertTagAction } from "@/actions/tag.actions";
import { CreateTagModal } from "@/components/tag/create-tag-modal";
import { DeleteTagButton, EditTagModal } from "@/components/tag/edit-tag-modal";
import { ReorderTagModal } from "@/components/tag/reorder-tag-modal";
import { TagSortSelect } from "@/components/tag/tag-select-dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { StatChip } from "@/components/ui/stat-chip";
import type { SessionUser } from "@/server/auth/session";
import { tagService } from "@/server/services/tag.service";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  scope: DataScope;
  user: SessionUser | null;
  searchParams: SearchParams;
};

const SORT_SELECT_VALUE: Record<string, string> = {
  default: "default",
  created_desc: "default",
  created_asc: "default",
  name_asc: "name_asc",
  name_desc: "name_asc",
  bookmark_count_desc: "bookmark_count_desc",
  bookmark_count_asc: "bookmark_count_desc",
};

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

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} 个月前`;
  return `${Math.floor(months / 12)} 年前`;
}

export async function ManageTagsView({ scope, user, searchParams }: Props) {
  const q = readParam(searchParams.q);
  const sort = readParam(searchParams.sort);
  const page = readPage(searchParams.page);
  const currentSort = sort ?? "default";
  const selectSort = SORT_SELECT_VALUE[currentSort] ?? "default";
  const listPath = scope === "APP" ? "/admin/manage/tags" : "/manage/tags";
  const allTags = await tagService.list(scope, user);
  const result = await tagService.listPaged(scope, user, {
    q,
    sort: (sort as
      | "default"
      | "name_asc"
      | "name_desc"
      | "created_desc"
      | "created_asc"
      | "bookmark_count_desc"
      | "bookmark_count_asc"
      | undefined) ?? "default",
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const tags = result.items;
  const safePage = Math.min(result.pagination.page, result.pagination.totalPages);
  const totalBookmarks = allTags.reduce((sum, tag) => sum + tag.bookmarkCount, 0);
  const hasQuery = Boolean(q?.trim());
  const sortQuery = currentSort !== "default" ? currentSort : undefined;

  return (
    <section className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
            标签管理
          </h1>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            管理所有标签，让书签分类井井有条。
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ReorderTagModal
            action={reorderTagAction.bind(null, scope)}
            tags={allTags.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color }))}
          />
          <CreateTagModal action={upsertTagAction.bind(null, scope)} />
        </div>
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatChip icon={Tags} tint="#2563eb" value={allTags.length} label="全部标签" />
        <StatChip icon={BookmarkIcon} tint="#10b981" value={totalBookmarks} label="关联书签" />
        {/* TODO(ui-upgrade): 待补统计数据逻辑（本周活跃） */}
        <StatChip icon={Flame} tint="#f59e0b" value={0} label="本周活跃" />
        {/* TODO(ui-upgrade): 待补统计数据逻辑（空标签） */}
        <StatChip icon={Archive} tint="#64748b" value={0} label="空标签" />
      </section>

      <form className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <TagIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="搜索标签名称或描述"
            className="ctl w-full pl-9 pr-3"
            aria-label="搜索标签"
          />
        </div>
        <TagSortSelect name="sort" defaultValue={selectSort} />
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

      {tags.length > 0 ? (
        <section className="mt-4 flex flex-col gap-2">
          {tags.map((tag) => {
            const color = tag.color ?? "#94a3b8";
            return (
              <article
                key={tag.id}
                className="flex items-center gap-3.5 rounded-sm border border-slate-200 bg-white px-4 py-3 transition-[border-color,box-shadow] duration-150 hover:border-[#2563eb]/40 hover:shadow-[0_6px_16px_-10px_rgba(15,23,42,0.25)] dark:border-slate-700 dark:bg-card dark:hover:border-[#3b82f6]/50 sm:gap-[14px]"
              >
                <div className="flex w-[200px] shrink-0 items-center gap-2.5 sm:w-[268px]">
                  <span
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-white"
                    style={{ backgroundColor: color }}
                  >
                    <TagIcon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="truncate text-[13.5px] font-semibold leading-[1.3] tracking-[-0.01em] text-slate-900 dark:text-slate-100">
                        {tag.name}
                      </h3>
                      <span className="inline-flex shrink-0 items-center gap-[5px] rounded-full bg-slate-100 px-[9px] py-0.5 text-[11.5px] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                        <span
                          className="h-[5px] w-[5px] rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {tag.bookmarkCount} 条书签
                      </span>
                    </div>
                  </div>
                </div>
                {tag.description ? (
                  <span className="hidden min-w-0 flex-1 items-center gap-1.5 truncate text-[12.5px] leading-snug text-slate-400 dark:text-slate-500 min-[641px]:inline-flex">
                    <FileText className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    <span className="truncate">{tag.description}</span>
                  </span>
                ) : (
                  <span className="hidden min-w-0 flex-1 items-center gap-1.5 truncate text-[12.5px] italic leading-snug text-[#c2cbd8] dark:text-[#53617a] min-[641px]:inline-flex">
                    <FileText className="h-3.5 w-3.5 shrink-0 opacity-55" />
                    未填写描述
                  </span>
                )}
                <span
                  className="hidden shrink-0 items-center gap-1 text-xs text-slate-400 lg:inline-flex"
                  title={tag.createdAt.toLocaleString("zh-CN")}
                >
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(tag.createdAt)}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <EditTagModal action={upsertTagAction.bind(null, scope)} tag={tag} />
                  <DeleteTagButton
                    action={deleteTagAction.bind(null, scope)}
                    tagId={tag.id}
                    tagName={tag.name}
                  />
                </div>
              </article>
            );
          })}
        </section>
      ) : hasQuery ? (
        <EmptyState
          className="mt-4"
          icon={Inbox}
          title="没有符合条件的标签"
          description="换个关键词试试。"
          action={
            <Link
              href={listPath}
              className="inline-flex h-8 items-center rounded-sm border border-slate-200 px-3.5 text-[13px] text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              清除搜索
            </Link>
          }
        />
      ) : (
        <EmptyState
          className="mt-4"
          icon={Inbox}
          title="暂无标签"
          description="新增一个标签，让书签分类更清晰。"
        />
      )}

      {result.pagination.total > 0 ? (
        <Pagination
          page={safePage}
          pageSize={DEFAULT_PAGE_SIZE}
          total={result.pagination.total}
          basePath={listPath}
          queryParams={{ q, sort: sortQuery }}
          itemName="个标签"
          emptyText="暂无标签"
          className="mt-4"
        />
      ) : null}
    </section>
  );
}
