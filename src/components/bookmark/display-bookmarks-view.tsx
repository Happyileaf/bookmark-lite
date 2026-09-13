import net from "node:net";
import Link from "next/link";
import {
  Clock,
  Eye,
  Folder,
  LayoutGrid,
  Search,
  Star,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
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
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">pnpm run db:migrate:deploy</code>
          初始化表结构。
        </p>
      ) : (
        <p className="mt-2">
          请先准备
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">.env</code>
          并配置
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">DATABASE_URL</code>
          ，确保 PostgreSQL 在本地 5432 端口可访问；首次可执行
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">pnpm run db:setup</code>
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
  let viewCounts: Awaited<ReturnType<typeof bookmarkService.countByView>> = {
    all: 0,
    favorites: 0,
    untagged: 0,
    recent_added: 0,
    recent_visited: 0,
  };
  let dbUnavailableReason: string | null = null;

  try {
    [tags, listResult, userTagsForSaving, viewCounts] = await Promise.all([
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
      bookmarkService.countByView({ scope, user }),
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
  const currentHrefParams = new URLSearchParams();
  if (tagId) {
    currentHrefParams.set("tagId", tagId);
  } else {
    currentHrefParams.set("view", view);
  }
  if (q) currentHrefParams.set("q", q);
  const currentHref = `?${currentHrefParams.toString()}`;
  const aggregateItems: Array<{
    key: DisplayView;
    label: string;
    count: number;
    icon: LucideIcon;
  }> = [
    { key: "all", label: "全部书签", count: viewCounts.all, icon: LayoutGrid },
    { key: "favorites", label: "收藏", count: viewCounts.favorites, icon: Star },
    { key: "untagged", label: "未分类", count: viewCounts.untagged, icon: Folder },
    { key: "recent_added", label: "最近添加", count: viewCounts.recent_added, icon: Clock },
    { key: "recent_visited", label: "最近访问", count: viewCounts.recent_visited, icon: Eye },
  ];

  return (
    <section className="grid h-full min-h-0 overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden h-full min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-card lg:flex">
        <div className="mb-5 shrink-0 px-4">
          <div className="mb-3 px-2 text-sm font-semibold text-foreground">聚合视图</div>
          <nav className="flex flex-col gap-1.5">
            {aggregateItems.map((item) => {
              const active = !tagId && view === item.key;
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={`?view=${item.key}${queryBase}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  <span className={`text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {item.count}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mx-6 mb-5 shrink-0 border-t border-border/50" />

        <div className="flex min-h-0 flex-1 flex-col px-4">
          <div className="mb-3 shrink-0 px-2 text-sm font-semibold text-foreground">标签</div>
          <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pb-2 pr-1 [scrollbar-width:thin]">
            {tags.map((tag) => {
              const active = tagId === tag.id;
              return (
                <Link
                  key={tag.id}
                  href={`?tagId=${tag.id}${queryBase}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color ?? "#cbd5e1" }}
                  />
                  <span className="flex-1 truncate">{tag.name}</span>
                  <span className={`text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {tag.bookmarkCount}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-h-0 min-w-0 overflow-y-auto p-8">
        <form className="mb-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={q}
              placeholder="搜索标题、URL、描述、标签..."
              className="h-10 w-full rounded-sm border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {tagId ? <input type="hidden" name="tagId" value={tagId} /> : null}
          {!tagId ? <input type="hidden" name="view" value={view} /> : null}
        </form>

        <div className="mb-7 flex flex-wrap items-center justify-end gap-3">
          <Link
            href={currentHref}
            aria-disabled="true"
            className="flex cursor-default items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            <span>按添加时间排序</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Link>
        </div>

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
