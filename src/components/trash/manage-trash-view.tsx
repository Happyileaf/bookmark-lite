import type { DataScope } from "@prisma/client";
import { Clock, Inbox, Info, RotateCcw, Trash2 } from "lucide-react";
import {
  clearTrashAction,
  deleteTrashForeverAction,
  restoreTrashAction,
} from "@/actions/trash.actions";
import { BookmarkFavicon } from "@/components/bookmark/infinite-bookmarks-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import type { SessionUser } from "@/server/auth/session";
import { tagService } from "@/server/services/tag.service";
import { trashService } from "@/server/services/trash.service";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  scope: DataScope;
  user: SessionUser | null;
  searchParams: SearchParams;
};

type Snapshot = {
  title?: string;
  url?: string;
  favicon?: string | null;
};

const PAGE_SIZE = 20;

function readPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function getHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function ManageTrashView({ scope, user, searchParams }: Props) {
  const page = readPage(searchParams.page);
  const [listResult, tags] = await Promise.all([
    trashService.list(scope, user, { page, pageSize: PAGE_SIZE }),
    tagService.list(scope, user),
  ]);

  const tagNameById = new Map(tags.map((tag) => [tag.id, tag.name]));
  const { items, pagination } = listResult;
  const total = pagination.total;
  const safePage = Math.min(pagination.page, pagination.totalPages);
  const basePath = scope === "APP" ? "/admin/manage/trash" : "/manage/trash";

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">回收站</h1>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            删除的书签将在此保留 30 天，到期后自动清除。
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-0.5">
          <span className="text-[12px] text-slate-400 dark:text-slate-500">
            共 {total} 条
          </span>
          <form action={clearTrashAction.bind(null, scope)}>
            <button
              type="submit"
              disabled={total === 0}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-rose-200 px-3.5 text-[13px] font-medium text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
            >
              <Trash2 className="h-3.5 w-3.5" />
              清空回收站
            </button>
          </form>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2.5 rounded-sm border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0" />
        <span>回收站中的书签不会出现在网站首页和搜索结果中，可随时恢复。</span>
      </div>

      {total === 0 ? (
        <EmptyState
          className="mt-4"
          icon={Inbox}
          title="回收站为空"
          description="删除的书签会在这里暂存 30 天。"
        />
      ) : (
        <>
          <div className="mt-4 space-y-2">
            {items.map((item) => {
              const payload = item.payload as {
                bookmark?: Snapshot;
                tagIds?: string[];
              };
              const snapshot = payload.bookmark ?? {};
              const tagName = payload.tagIds?.[0]
                ? tagNameById.get(payload.tagIds[0])
                : undefined;

              return (
                <article
                  key={item.id}
                  className="flex items-center gap-3.5 rounded-sm border border-slate-200 bg-white px-4 py-3 transition-[border-color,box-shadow] duration-150 hover:border-slate-300 hover:shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                >
                  <BookmarkFavicon
                    src={snapshot.favicon ?? null}
                    title={
                      snapshot.title ??
                      (snapshot.url ? getHost(snapshot.url) : "?")
                    }
                    className="h-7 w-7"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                    <h3 className="truncate text-[13.5px] font-semibold leading-[1.3] text-slate-900 dark:text-slate-100">
                      {snapshot.title ?? "-"}
                    </h3>
                    <p className="truncate text-[12px] text-slate-400 dark:text-slate-500">
                      {snapshot.url ? getHost(snapshot.url) : "-"}
                    </p>
                  </div>
                  {tagName ? (
                    <span className="shrink-0 rounded-sm bg-slate-100 px-2 py-0.5 text-[12px] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                      {tagName}
                    </span>
                  ) : null}
                  <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-slate-400 dark:text-slate-500">
                    <Clock className="h-3 w-3" />
                    {formatDate(new Date(item.deletedAt))}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <form action={restoreTrashAction.bind(null, scope)}>
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        className="row-act primary gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        恢复
                      </button>
                    </form>
                    <form
                      action={deleteTrashForeverAction.bind(null, scope)}
                    >
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        className="row-act danger gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        彻底删除
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
          <Pagination
            className="mt-4"
            page={safePage}
            pageSize={PAGE_SIZE}
            total={total}
            basePath={basePath}
            itemName="条"
          />
        </>
      )}
    </section>
  );
}
