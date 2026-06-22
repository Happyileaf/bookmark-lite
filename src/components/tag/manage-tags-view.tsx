import Link from "next/link";
import type { DataScope } from "@prisma/client";
import { ArrowDown, ArrowUp, Filter, Search, Tag as TagIcon } from "lucide-react";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { deleteTagAction, reorderTagAction, upsertTagAction } from "@/actions/tag.actions";
import { CreateTagModal } from "@/components/tag/create-tag-modal";
import { EditTagModal } from "@/components/tag/edit-tag-modal";
import type { SessionUser } from "@/server/auth/session";
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

export async function ManageTagsView({ scope, user, searchParams }: Props) {
  const q = readParam(searchParams.q);
  const sort = readParam(searchParams.sort);
  const page = readPage(searchParams.page);
  const currentSort = sort ?? "default";
  const listPath = scope === "APP" ? "/admin/manage/tags" : "/manage/tags";
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
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-200">标签管理</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">维护标签结构，便于后续按主题组织书签。</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-400">
            共 {result.pagination.total} 个标签
          </span>
          <CreateTagModal action={upsertTagAction.bind(null, scope)} />
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
              placeholder="搜索标签名 / 描述"
              className="w-full rounded border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:placeholder:text-slate-400"
            />
          </label>
          <select
            name="sort"
            defaultValue={currentSort}
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200"
          >
            <option value="default">默认排序</option>
            <option value="name_asc">标签名 A-Z</option>
            <option value="name_desc">标签名 Z-A</option>
            <option value="created_desc">创建时间（新到旧）</option>
            <option value="created_asc">创建时间（旧到新）</option>
            <option value="bookmark_count_desc">书签数（多到少）</option>
            <option value="bookmark_count_asc">书签数（少到多）</option>
          </select>
          <button
            type="submit"
            className="flex h-[36px] items-center justify-center rounded bg-slate-900 px-3 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Search className="h-4 w-4" />
          </button>
          <Link
            href={listPath}
            className="flex h-[36px] items-center justify-center rounded border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            清空
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-800/50">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-700/50 dark:bg-slate-700/40 dark:text-slate-400">
              <th className="min-w-56 px-3 py-2 font-medium">标签名</th>
              <th className="min-w-72 px-3 py-2 font-medium">描述</th>
              <th className="px-3 py-2 font-medium">书签数</th>
              <th className="min-w-40 px-3 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag, index) => {
              const isFirst = index === 0;
              const isLast = index === tags.length - 1;
              return (
              <tr key={tag.id} className="border-b border-slate-100 align-middle dark:border-slate-700/40">
                <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-200">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-slate-300 dark:border-slate-600/70"
                      style={{ backgroundColor: tag.color ?? "#cbd5e1" }}
                    />
                    {tag.name}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{tag.description ?? "暂无描述"}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-700/40 dark:text-slate-300">{tag.bookmarkCount}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {currentSort === "default" ? (
                      <>
                        <form action={reorderTagAction.bind(null, scope)}>
                          <input type="hidden" name="id" value={tag.id} />
                          <input type="hidden" name="direction" value="up" />
                          <button
                            type="submit"
                            disabled={isFirst}
                            className={`rounded border px-2 py-1 text-xs ${
                              isFirst
                                ? "pointer-events-none border-slate-200 text-slate-300 dark:border-slate-700/40 dark:text-slate-500"
                                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
                            }`}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                        </form>
                        <form action={reorderTagAction.bind(null, scope)}>
                          <input type="hidden" name="id" value={tag.id} />
                          <input type="hidden" name="direction" value="down" />
                          <button
                            type="submit"
                            disabled={isLast}
                            className={`rounded border px-2 py-1 text-xs ${
                              isLast
                                ? "pointer-events-none border-slate-200 text-slate-300 dark:border-slate-700/40 dark:text-slate-500"
                                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/40"
                            }`}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </>
                    ) : null}
                    <EditTagModal action={upsertTagAction.bind(null, scope)} tag={tag} />
                    <form action={deleteTagAction.bind(null, scope)}>
                      <input type="hidden" name="id" value={tag.id} />
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
              );
            })}
            {tags.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <TagIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <span>暂无标签，先创建一个用于分类书签。</span>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700/50 dark:bg-slate-800/50">
        <span className="text-slate-600 dark:text-slate-400">
          第 {safePage} / {result.pagination.totalPages} 页
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
            href={buildPageHref(Math.min(result.pagination.totalPages, safePage + 1))}
            aria-disabled={safePage >= result.pagination.totalPages}
            className={`rounded border px-3 py-1.5 ${
              safePage >= result.pagination.totalPages
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
