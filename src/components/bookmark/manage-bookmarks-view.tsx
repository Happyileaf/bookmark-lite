import type { DataScope } from "@prisma/client";
import { createBookmarkAction, deleteBookmarkAction } from "@/actions/bookmark.actions";
import { CreateBookmarkModal } from "@/components/bookmark/create-bookmark-modal";
import type { SessionUser } from "@/server/auth/session";
import { bookmarkService } from "@/server/services/bookmark.service";

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

export async function ManageBookmarksView({ scope, user, searchParams }: Props) {
  const q = readParam(searchParams.q);
  const sort = readParam(searchParams.sort);
  const listResult = await bookmarkService.list({
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
    },
  });

  return (
    <section className="space-y-4">
      <header className="flex h-[50px] items-center justify-between">
        <h1 className="text-xl leading-none font-semibold text-slate-900">书签管理</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">共 {listResult.pagination.total} 条</span>
          <CreateBookmarkModal action={createBookmarkAction.bind(null, scope)} />
        </div>
      </header>

      <form className="flex flex-wrap items-center gap-2 rounded border border-slate-200 bg-white p-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="高级搜索：标题 / URL / 描述 / 标签"
          className="w-full min-w-60 flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="sort"
          defaultValue={sort ?? "default"}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="default">默认排序</option>
          <option value="created_desc">创建时间（新到旧）</option>
          <option value="created_asc">创建时间（旧到新）</option>
          <option value="title_asc">标题 A-Z</option>
          <option value="title_desc">标题 Z-A</option>
        </select>
        <button
          type="submit"
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
        >
          查询
        </button>
      </form>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <th className="px-3 py-2 font-medium">标题</th>
              <th className="px-3 py-2 font-medium">标签</th>
              <th className="px-3 py-2 font-medium">状态</th>
              <th className="px-3 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {listResult.items.map((bookmark) => (
              <tr key={bookmark.id} className="border-b border-slate-100 align-top">
                <td className="px-3 py-2">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-slate-900 hover:text-slate-700"
                  >
                    {bookmark.title}
                  </a>
                  <div className="text-xs text-slate-500">{bookmark.url}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {bookmark.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  <div>收藏：{bookmark.isFavorite ? "是" : "否"}</div>
                  <div>置顶：{bookmark.isPinned ? "是" : "否"}</div>
                  {scope === "APP" ? <div>展示：{bookmark.isVisible ? "是" : "否"}</div> : null}
                </td>
                <td className="px-3 py-2">
                  <form action={deleteBookmarkAction.bind(null, scope)}>
                    <input type="hidden" name="id" value={bookmark.id} />
                    <button
                      type="submit"
                      className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      删除
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {listResult.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-slate-500">
                  暂无书签，先在上方创建一条。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
