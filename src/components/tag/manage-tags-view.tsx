import Link from "next/link";
import type { DataScope } from "@prisma/client";
import { Tag as TagIcon } from "lucide-react";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { deleteTagAction, upsertTagAction } from "@/actions/tag.actions";
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
  const page = readPage(searchParams.page);
  const listPath = scope === "APP" ? "/admin/manage/tags" : "/manage/tags";
  const result = await tagService.listPaged(scope, user, {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const tags = result.items;
  const safePage = Math.min(result.pagination.page, result.pagination.totalPages);

  const buildPageHref = (targetPage: number) => {
    if (targetPage <= 1) {
      return listPath;
    }
    return `${listPath}?page=${targetPage}`;
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">标签管理</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">维护标签结构，便于后续按主题组织书签。</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            共 {result.pagination.total} 个标签
          </span>
          <CreateTagModal action={upsertTagAction.bind(null, scope)} />
        </div>
      </header>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <th className="min-w-56 px-3 py-2 font-medium">标签名</th>
              <th className="min-w-72 px-3 py-2 font-medium">描述</th>
              <th className="px-3 py-2 font-medium">书签数</th>
              <th className="min-w-40 px-3 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id} className="border-b border-slate-100 align-middle dark:border-slate-700">
                <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-slate-300 dark:border-slate-600"
                      style={{ backgroundColor: tag.color ?? "#cbd5e1" }}
                    />
                    {tag.name}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{tag.description ?? "暂无描述"}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800 dark:text-slate-300">{tag.bookmarkCount}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <EditTagModal action={upsertTagAction.bind(null, scope)} tag={tag} />
                    <form action={deleteTagAction.bind(null, scope)}>
                      <input type="hidden" name="id" value={tag.id} />
                      <button
                        type="submit"
                        className="whitespace-nowrap rounded border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950"
                      >
                        删除
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
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

      <footer className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
        <span className="text-slate-600 dark:text-slate-400">
          第 {safePage} / {result.pagination.totalPages} 页
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={buildPageHref(Math.max(1, safePage - 1))}
            aria-disabled={safePage <= 1}
            className={`rounded border px-3 py-1.5 ${
              safePage <= 1
                ? "pointer-events-none border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600"
                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            上一页
          </Link>
          <Link
            href={buildPageHref(Math.min(result.pagination.totalPages, safePage + 1))}
            aria-disabled={safePage >= result.pagination.totalPages}
            className={`rounded border px-3 py-1.5 ${
              safePage >= result.pagination.totalPages
                ? "pointer-events-none border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600"
                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            下一页
          </Link>
        </div>
      </footer>
    </section>
  );
}
