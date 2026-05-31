import net from "node:net";
import Link from "next/link";
import { Prisma, type DataScope } from "@prisma/client";
import { saveAppBookmarkToUserAction } from "@/actions/bookmark.actions";
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

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function readDbUnavailableReason(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    if (error.message.includes("Environment variable not found: DATABASE_URL")) {
      return "DATABASE_URL 未配置，请先创建 .env 并启动 PostgreSQL。";
    }
    if (error.message.includes("Can't reach database server")) {
      return "当前无法连接数据库，请确认 PostgreSQL 已启动。";
    }
    return "数据库尚未就绪，请先完成 Prisma 初始化。";
  }

  return null;
}

function DatabaseUnavailableNotice({ reason }: { reason: string }) {
  return (
    <section className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <h2 className="text-base font-semibold">数据库尚未就绪</h2>
      <p className="mt-2">{reason}</p>
      <p className="mt-2">
        建议先执行
        <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">Copy-Item .env.example .env</code>
        ，并确保 PostgreSQL 在本地 5432 端口可访问。
      </p>
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

async function readLocalDbUnavailableReason(): Promise<string | null> {
  if (process.env.NODE_ENV !== "development") {
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
  const q = readParam(searchParams.q);
  const tagId = readParam(searchParams.tagId);
  const view = (readParam(searchParams.view) as DisplayView | undefined) ?? "all";
  const isAdmin = user?.role === "super_admin";

  const localDbUnavailableReason = await readLocalDbUnavailableReason();
  if (localDbUnavailableReason) {
    return <DatabaseUnavailableNotice reason={localDbUnavailableReason} />;
  }

  let tags: Awaited<ReturnType<typeof tagService.list>> = [];
  let listResult: Awaited<ReturnType<typeof bookmarkService.list>>;
  let dbUnavailableReason: string | null = null;

  try {
    [tags, listResult] = await Promise.all([
      tagService.list(scope, user),
      bookmarkService.list({
        scope,
        user,
        query: {
          q,
          tagId,
          view,
        },
      }),
    ]);
  } catch (error) {
    dbUnavailableReason = readDbUnavailableReason(error);
    if (!dbUnavailableReason) {
      throw error;
    }
    listResult = {
      items: [],
      pagination: {
        page: 1,
        pageSize: 30,
        total: 0,
        totalPages: 1,
      },
    };
  }

  if (dbUnavailableReason) {
    return <DatabaseUnavailableNotice reason={dbUnavailableReason} />;
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
    <section className="grid h-full min-h-0 md:grid-cols-[240px_1fr]">
      <aside className="flex h-full self-stretch flex-col overflow-hidden rounded-b border-x border-b border-slate-200 bg-white">
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

        <ul className="flex-1 space-y-1.5 border-t border-slate-100 px-3 py-3 text-sm">
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
                <span className="truncate">{tag.name}</span>
                <span className="ml-2 text-xs text-slate-400">{tag.bookmarkCount}</span>
              </Link>
            </li>
          ))}
        </ul>

        {scope === "USER" ? (
          <Link
            href="/manage/bookmarks"
            className="mx-3 mb-3 block rounded border border-slate-300 px-3 py-2 text-center text-xs text-slate-700 hover:bg-slate-50"
          >
            进入个人管理
          </Link>
        ) : null}

        {scope === "APP" && isAdmin ? (
          <Link
            href="/admin/manage/bookmarks"
            className="mx-3 mb-3 block rounded border border-slate-300 px-3 py-2 text-center text-xs text-slate-700 hover:bg-slate-50"
          >
            进入应用管理
          </Link>
        ) : null}
      </aside>

      <div className="min-w-0 space-y-4 p-6">
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

        {listResult.items.length === 0 ? (
          <div className="rounded border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            当前视图下暂无书签
          </div>
        ) : (
          <ul className="space-y-3">
            {listResult.items.map((bookmark) => (
              <li key={bookmark.id} className="rounded border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-medium text-slate-900 hover:text-slate-700"
                    >
                      {bookmark.title}
                    </a>
                    <p className="text-sm text-slate-500">{bookmark.url}</p>
                    {bookmark.description ? (
                      <p className="text-sm text-slate-700">{bookmark.description}</p>
                    ) : null}
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
                  </div>

                  {scope === "APP" && user ? (
                    <form action={saveAppBookmarkToUserAction} className="w-full space-y-2">
                      <input type="hidden" name="bookmarkId" value={bookmark.id} />
                      <input
                        name="tags"
                        placeholder="个人标签（逗号分隔）"
                        className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs"
                      />
                      <button
                        type="submit"
                        className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        保存到个人库
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
