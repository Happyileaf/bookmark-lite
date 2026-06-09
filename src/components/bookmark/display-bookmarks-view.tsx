import net from "node:net";
import Link from "next/link";
import { Prisma, type DataScope } from "@prisma/client";
import { saveAppBookmarkToUserAction } from "@/actions/bookmark.actions";
import { InfiniteBookmarksGrid } from "@/components/bookmark/infinite-bookmarks-grid";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { SessionUser } from "@/server/auth/session";
import { bookmarkService } from "@/server/services/bookmark.service";
import { tagService } from "@/server/services/tag.service";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  scope: DataScope;
  user: SessionUser | null;
  searchParams: SearchParams;
};

type DisplayView = "all" | "favorites" | "untagged" | "recent_added" | "recent_visited";
type RuntimeTarget = "local" | "vercel";

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function readRuntimeTarget(): RuntimeTarget {
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV) {
    return "vercel";
  }
  return "local";
}

function readDbUnavailableReason(error: unknown, runtimeTarget: RuntimeTarget): string | null {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    if (error.message.includes("DATABASE_URL")) {
      if (runtimeTarget === "vercel") {
        return "Vercel 线上环境缺少 DATABASE_URL，请先在项目环境变量中配置。";
      }
      return "DATABASE_URL 未配置，请先创建 .env 并启动 PostgreSQL。";
    }
    if (error.message.includes("Can't reach database server")) {
      if (runtimeTarget === "vercel") {
        return "当前无法连接线上数据库，请确认数据库实例可访问且连接串正确。";
      }
      return "当前无法连接数据库，请确认 PostgreSQL 已启动。";
    }
    return "数据库尚未就绪，请先完成 Prisma 初始化。";
  }

  return null;
}

function DatabaseUnavailableNotice({ reason, runtimeTarget }: { reason: string; runtimeTarget: RuntimeTarget }) {
  const isVercel = runtimeTarget === "vercel";

  return (
    <section className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <h2 className="text-base font-semibold">数据库尚未就绪</h2>
      <p className="mt-2">{reason}</p>
      {isVercel ? (
        <p className="mt-2">
          请在 Vercel 项目中创建/绑定 PostgreSQL，并在 Environment Variables 中配置
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">DATABASE_URL</code>
          后重新部署；首次可执行
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">npm run db:migrate:deploy</code>
          初始化表结构。
        </p>
      ) : (
        <p className="mt-2">
          请先准备
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">.env</code>
          并配置
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">DATABASE_URL</code>
          ，确保 PostgreSQL 在本地 5432 端口可访问；首次可执行
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">npm run db:setup</code>
          初始化表结构。
        </p>
      )}
    </section>
  );
}

async function canConnectTcp(host: string, port: number, timeoutMs = 300): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;

    const finalize = (value: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finalize(true));
    socket.once("timeout", () => finalize(false));
    socket.once("error", () => finalize(false));
  });
}

async function readLocalDbUnavailableReason(runtimeTarget: RuntimeTarget): Promise<string | null> {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  if (runtimeTarget !== "local") {
    return null;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return "DATABASE_URL 未配置，请先创建 .env 并启动 PostgreSQL。";
  }

  try {
    const parsed = new URL(databaseUrl);
    const host = parsed.hostname;
    const isLocalDb = host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (!isLocalDb) {
      return null;
    }

    const port = parsed.port ? Number(parsed.port) : 5432;
    const reachable = await canConnectTcp(host, port);
    if (!reachable) {
      return `当前无法连接数据库 ${host}:${port}，请先启动 PostgreSQL。`;
    }
  } catch {
    return null;
  }

  return null;
}

export async function DisplayBookmarksView({ scope, user, searchParams }: Props) {
  const runtimeTarget = readRuntimeTarget();
  const q = readParam(searchParams.q);
  const tagId = readParam(searchParams.tagId);
  const view = (readParam(searchParams.view) as DisplayView | undefined) ?? "all";

  const localDbUnavailableReason = await readLocalDbUnavailableReason(runtimeTarget);
  if (localDbUnavailableReason) {
    return <DatabaseUnavailableNotice reason={localDbUnavailableReason} runtimeTarget={runtimeTarget} />;
  }

  let tags: Awaited<ReturnType<typeof tagService.list>> = [];
  let userTagsForSaving: Awaited<ReturnType<typeof tagService.list>> = [];
  let listResult: Awaited<ReturnType<typeof bookmarkService.list>>;
  let dbUnavailableReason: string | null = null;

  try {
    [tags, listResult, userTagsForSaving] = await Promise.all([
      tagService.list(scope, user),
      bookmarkService.list({
        scope,
        user,
        query: {
          q,
          tagId,
          view,
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
        },
      }),
      scope === "APP" && user ? tagService.list("USER", user) : Promise.resolve([]),
    ]);
  } catch (error) {
    dbUnavailableReason = readDbUnavailableReason(error, runtimeTarget);
    if (!dbUnavailableReason) {
      throw error;
    }
    listResult = {
      items: [],
      pagination: {
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 1,
      },
    };
  }

  if (dbUnavailableReason) {
    return <DatabaseUnavailableNotice reason={dbUnavailableReason} runtimeTarget={runtimeTarget} />;
  }

  const queryBase = q ? `&q=${encodeURIComponent(q)}` : "";
  const aggregateItems: Array<{ key: DisplayView; label: string }> = [
    { key: "all", label: "全部书签" },
    { key: "untagged", label: "未分类" },
    { key: "favorites", label: "收藏" },
    { key: "recent_added", label: "最近添加" },
    { key: "recent_visited", label: "最近访问" },
  ];

  return (
    <section className="grid h-full min-h-0 overflow-hidden md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex h-full min-h-0 self-stretch flex-col overflow-y-auto overflow-x-hidden rounded-b border-x border-b border-slate-200 bg-white">
        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">聚合视图</h2>
        </div>

        <ul className="space-y-1.5 border-t border-slate-100 px-3 py-3 text-sm">
          {aggregateItems.map((item) => {
            const active = !tagId && view === item.key;
            return (
              <li key={item.key}>
                <Link
                  href={`?view=${item.key}${queryBase}`}
                  className={`block rounded px-3 py-2 ${
                    active
                      ? "bg-slate-100 font-medium text-slate-900"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">标签</h2>
        </div>

        <ul className="space-y-1.5 border-t border-slate-100 px-3 py-3 text-sm">
          {tags.map((tag) => (
            <li key={tag.id}>
              <Link
                href={`?tagId=${tag.id}${queryBase}`}
                className={`flex items-center justify-between rounded px-3 py-2 ${
                  tagId === tag.id
                    ? "bg-slate-100 font-medium text-slate-900"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color ?? "#cbd5e1" }}
                  />
                  {tag.name}
                </span>
                <span className="ml-2 text-xs text-slate-400">{tag.bookmarkCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-h-0 min-w-0 space-y-4 overflow-y-auto p-6">
        <form className="flex items-center gap-2 rounded border border-slate-200 bg-white p-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="搜索标题 / URL / 描述 / 标签"
            className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          />
          {tagId ? <input type="hidden" name="tagId" value={tagId} /> : null}
          {!tagId ? <input type="hidden" name="view" value={view} /> : null}
          <button
            type="submit"
            className="shrink-0 whitespace-nowrap rounded bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-800"
          >
            搜索
          </button>
        </form>

        <InfiniteBookmarksGrid
          key={`${scope}|${view}|${tagId ?? ""}|${q ?? ""}`}
          scope={scope}
          query={{ q: q ?? undefined, tagId: tagId ?? undefined, view }}
          initialItems={listResult.items}
          initialPagination={listResult.pagination}
          userTagsForSaving={userTagsForSaving}
          canSaveToUser={scope === "APP" && !!user}
          saveToUserAction={scope === "APP" && user ? saveAppBookmarkToUserAction : undefined}
        />
      </div>
    </section>
  );
}
