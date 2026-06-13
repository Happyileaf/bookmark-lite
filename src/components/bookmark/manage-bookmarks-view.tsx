import Link from "next/link";
import type { DataScope } from "@prisma/client";
import { Filter, Search } from "lucide-react";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  createBookmarkAction,
  deleteBookmarkAction,
  updateBookmarkAction,
} from "@/actions/bookmark.actions";
import { CreateBookmarkModal } from "@/components/bookmark/create-bookmark-modal";
import { EditBookmarkModal } from "@/components/bookmark/edit-bookmark-modal";
import type { SessionUser } from "@/server/auth/session";
import { bookmarkService } from "@/server/services/bookmark.service";
import { tagService } from "@/server/services/tag.service";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  scope: DataScope;
  user: SessionUser | null;
  searchParams: SearchParams;
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

export async function ManageBookmarksView({ scope, user, searchParams }: Props) {
  const q = readParam(searchParams.q);
  const sort = readParam(searchParams.sort);
  const page = readPage(searchParams.page);
  const currentSort = sort ?? "default";
  const listPath = scope === "APP" ? "/admin/manage/bookmarks" : "/manage/bookmarks";
  const hasFilters = Boolean(q) || currentSort !== "default";
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
        pageSize: DEFAULT_PAGE_SIZE,
      },
    }),
    tagService.list(scope, user),
  ]);
  const safePage = Math.min(listResult.pagination.page, listResult.pagination.totalPages);

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (currentSort !== "default") params.set("sort", currentSort);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `${listPath}?${query}` : listPath;
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-200">书签管理</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">统一查看、筛选并维护你的全部书签。</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-400">
            共 {listResult.pagination.total} 条
          </span>
          <CreateBookmarkModal action={createBookmarkAction.bind(null, scope)} tags={tags} />
        </div>
      </header>

      <form className="space-y-3 rounded border border-slate-200 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
        <div className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700/50 dark:text-slate-300">
          <Filter className="h-3.5 w-3.5" />
          查询与排序
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              name="q"
              defaultValue={q}
              placeholder="搜索标题 / URL / 描述 / 标签"
              className="w-full rounded border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:placeholder:text-slate-400"
            />
          </label>
          <select
            name="sort"
            defaultValue={currentSort}
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200"
          >
            <option value="default">默认排序</option>
            <option value="created_desc">创建时间（新到旧）</option>
            <option value="created_asc">创建时间（旧到新）</option>
            <option value="title_asc">标题 A-Z</option>
            <option value="title_desc">标题 Z-A</option>
          </select>
          <button
            type="submit"
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            应用
          </button>
          {hasFilters ? (
            <Link
              href={listPath}
              className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              清空
            </Link>
          ) : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-800/50">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-700/50 dark:bg-slate-700/40 dark:text-slate-400">
              <th className="min-w-72 px-3 py-2 font-medium">标题与地址</th>
              <th className="min-w-48 px-3 py-2 font-medium">标签</th>
              <th className="px-3 py-2 font-medium">状态</th>
              <th className="min-w-56 px-3 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {listResult.items.map((bookmark) => (
              <tr key={bookmark.id} className="border-b border-slate-100 align-middle dark:border-slate-700/40">
                <td className="space-y-1 px-3 py-2">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-slate-900 hover:text-slate-700 dark:text-slate-200 dark:hover:text-slate-300"
                  >
                    {bookmark.title}
                  </a>
                  <div className="break-all text-xs text-slate-500 dark:text-slate-400">{bookmark.url}</div>
                </td>
                <td className="px-3 py-2">
                  {bookmark.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {bookmark.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:border-slate-700/50 dark:bg-slate-700/40 dark:text-slate-300"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">未分配标签</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span
                      className={`rounded px-2 py-1 ${
                        bookmark.isFavorite
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400"
                      }`}
                    >
                      {bookmark.isFavorite ? "已收藏" : "未收藏"}
                    </span>
                    <span
                      className={`rounded px-2 py-1 ${
                        bookmark.isVisible
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400"
                      }`}
                    >
                      {bookmark.isVisible ? "可见" : "已隐藏"}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={updateBookmarkAction.bind(null, scope)}>
                      <input type="hidden" name="id" value={bookmark.id} />
                      <input
                        type="hidden"
                        name="isFavorite"
                        value={bookmark.isFavorite ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="whitespace-nowrap rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
                      >
                        {bookmark.isFavorite ? "取消收藏" : "收藏"}
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
                        className="whitespace-nowrap rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
                      >
                        {bookmark.isVisible ? "隐藏" : "设为可见"}
                      </button>
                    </form>
                    <EditBookmarkModal
                      action={updateBookmarkAction.bind(null, scope)}
                      bookmark={bookmark}
                      tags={tags}
                    />
                    <form action={deleteBookmarkAction.bind(null, scope)}>
                      <input type="hidden" name="id" value={bookmark.id} />
                      <button
                        type="submit"
                        className="whitespace-nowrap rounded border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-800/60 dark:text-rose-400 dark:hover:bg-rose-900/30"
                      >
                        删除
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {listResult.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-slate-500 dark:text-slate-400">
                  当前没有匹配的书签，先新增一条或调整筛选条件。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/50 dark:bg-slate-800/50">
        <span className="text-slate-600 dark:text-slate-400">
          第 {safePage} / {listResult.pagination.totalPages} 页
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={buildPageHref(Math.max(1, safePage - 1))}
            aria-disabled={safePage <= 1}
            className={`rounded border px-3 py-1.5 ${
              safePage <= 1
                ? "pointer-events-none border-slate-200 text-slate-300 dark:border-slate-700/40 dark:text-slate-500"
                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
            }`}
          >
            上一页
          </Link>
          <Link
            href={buildPageHref(Math.min(listResult.pagination.totalPages, safePage + 1))}
            aria-disabled={safePage >= listResult.pagination.totalPages}
            className={`rounded border px-3 py-1.5 ${
              safePage >= listResult.pagination.totalPages
                ? "pointer-events-none border-slate-200 text-slate-300 dark:border-slate-700/40 dark:text-slate-500"
                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
            }`}
          >
            下一页
          </Link>
        </div>
      </footer>
    </section>
  );
}
