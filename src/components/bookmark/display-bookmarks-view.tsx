import net from "node:net";
import Link from "next/link";
import {
  Clock,
  Eye,
  LayoutGrid,
  Search,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import { Prisma, type DataScope } from "@prisma/client";
import { saveAppBookmarkToUserAction } from "@/actions/bookmark.actions";
import { BookmarksFilterDrawer } from "@/components/bookmark/bookmarks-filter-drawer";
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

/** 展示视图的默认中文名称映射（untagged 无导航入口，仅兼容直达链接；all 与 favorites 由 getDisplayViewLabel 按数据范围覆盖） */
const DISPLAY_VIEW_LABELS: Record<DisplayView, string> = {
  all: "全部书签",
  favorites: "收藏",
  untagged: "未分类",
  recent_added: "最近添加",
  recent_visited: "最近访问",
};

/**
 * 生成展示视图在快捷导航与主标题中的名称
 *
 * @description 部分视图按数据范围归属命名：「全部书签」在个人库为「个人空间」、在公共库为品牌名「Bookmark Lite」；「收藏」在个人库为「我的收藏」，公共库收藏是全库级标记、不属于个人，保持「收藏」；其余视图使用默认名称
 * @param scope - 数据范围（APP 公共库 / USER 个人库）
 * @param view - 展示视图
 * @returns 视图的显示名称
 * @example
 * getDisplayViewLabel("USER", "all"); // "个人空间"
 * getDisplayViewLabel("APP", "all"); // "Bookmark Lite"
 * getDisplayViewLabel("USER", "favorites"); // "我的收藏"
 */
function getDisplayViewLabel(scope: DataScope, view: DisplayView): string {
  switch (view) {
    case "all":
      return scope === "USER" ? "个人空间" : "Bookmark Lite";
    case "favorites":
      return scope === "USER" ? "我的收藏" : "收藏";
    default:
      return DISPLAY_VIEW_LABELS[view];
  }
}

type DisplayHeading = {
  /** 主标题文案 */
  title: string;
  /** 副标题文案 */
  subtitle: string;
};

/**
 * 生成视图态（未搜索、未按标签筛选）的副标题
 *
 * @description 解释该视图展示的内容范围与排序方式，不含数量信息（数量由搜索框下方的计数徽标独立展示）
 * @param options - 副标题生成参数
 * @param options.scope - 数据范围（APP 公共库 / USER 个人库）
 * @param options.view - 当前展示视图
 * @returns 视图态副标题文案
 * @example
 * getViewSubtitle({ scope: "APP", view: "all" });
 * // "所有人都可以浏览的公共书签库"
 */
function getViewSubtitle(options: { scope: DataScope; view: DisplayView }): string {
  const { scope, view } = options;
  switch (view) {
    case "favorites":
      return scope === "APP" ? "公共库中被收藏的书签" : "你标记为收藏的书签";
    case "untagged":
      return "还没有添加标签归类的书签";
    case "recent_added":
      return "按添加时间从新到旧排列";
    case "recent_visited":
      return "按最近访问的时间排列";
    case "all":
    default:
      return scope === "APP" ? "所有人都可以浏览的公共书签库" : "你保存的书签都在这里";
  }
}

/**
 * 生成内容区顶部的主标题与副标题
 *
 * @description 主标题跟随当前筛选上下文（标签优先，其次视图）；副标题只解释主标题代表的内容范围——视图态说明视图含义，标签态优先展示标签自身的描述。标题区只承载「这是什么」的恒定语义，与搜索状态无关；搜索关键词、命中数量等结果信息统一展示在搜索框下方
 * @param options - 标题生成参数
 * @param options.scope - 数据范围（APP 公共库 / USER 个人库）
 * @param options.view - 当前展示视图
 * @param options.activeTagName - 当前筛选的标签名（未按标签筛选时为 undefined）
 * @param options.activeTagDescription - 当前筛选标签的描述（未按标签筛选或标签无描述时为 null/undefined）
 * @returns 主标题与副标题文案
 * @example
 * getDisplayHeading({ scope: "USER", view: "all", activeTagName: undefined, activeTagDescription: undefined });
 * // { title: "个人空间", subtitle: "你保存的书签都在这里" }
 */
function getDisplayHeading(options: {
  scope: DataScope;
  view: DisplayView;
  activeTagName: string | undefined;
  activeTagDescription: string | null | undefined;
}): DisplayHeading {
  const { scope, view, activeTagName, activeTagDescription } = options;
  const title = activeTagName ?? getDisplayViewLabel(scope, view);
  if (activeTagName) {
    return { title, subtitle: activeTagDescription || "归入该标签的书签" };
  }
  return { title, subtitle: getViewSubtitle({ scope, view }) };
}

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
  const aggregateItems: Array<{
    key: DisplayView;
    label: string;
    count: number;
    icon: LucideIcon;
  }> = [
    { key: "all", label: getDisplayViewLabel(scope, "all"), count: viewCounts.all, icon: LayoutGrid },
    { key: "favorites", label: getDisplayViewLabel(scope, "favorites"), count: viewCounts.favorites, icon: Star },
    { key: "recent_added", label: "最近添加", count: viewCounts.recent_added, icon: Clock },
    { key: "recent_visited", label: "最近访问", count: viewCounts.recent_visited, icon: Eye },
  ];
  const activeTag = tagId ? tags.find((tag) => tag.id === tagId) : undefined;
  /** 内容区顶部标题文案（主标题跟随筛选上下文，副标题恒定解释内容范围，不随搜索状态变化；数量与搜索状态展示在搜索框下方） */
  const heading = getDisplayHeading({
    scope,
    view,
    activeTagName: activeTag?.name,
    activeTagDescription: activeTag?.description,
  });
  /** 清除搜索的链接（保留当前标签或视图上下文，仅去掉搜索关键词） */
  const clearSearchHref = tagId ? `?tagId=${tagId}` : `?view=${view}`;

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      <aside className="hidden h-full min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-card lg:flex">
        <div className="mb-5 shrink-0 px-4">
          <div className="mb-2 px-3 text-xs tracking-wide text-muted-foreground">快捷导航</div>
          <nav className="flex flex-col gap-1.5">
            {aggregateItems.map((item) => {
              const active = !tagId && view === item.key;
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={`?view=${item.key}${queryBase}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary font-medium text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  <span className={`text-xs ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {item.count}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mx-6 mb-5 shrink-0 border-t border-border/50" />

        <div className="flex min-h-0 flex-1 flex-col px-4">
          <div className="mb-2 shrink-0 px-2 text-xs tracking-wide text-muted-foreground">标签</div>
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
                      ? "bg-primary font-medium text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color ?? "#cbd5e1" }}
                  />
                  <span className="flex-1 truncate">{tag.name}</span>
                  <span className={`text-xs ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {tag.bookmarkCount}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* 移动端筛选抽屉：由顶部栏汉堡按钮通过全局事件触发；key 保证导航后重挂载、抽屉自动收起 */}
      <BookmarksFilterDrawer
        key={`${view}|${tagId ?? ""}|${q ?? ""}`}
        aggregateItems={aggregateItems.map((item) => ({
          key: item.key,
          href: `?view=${item.key}${queryBase}`,
          label: item.label,
          count: item.count,
          active: !tagId && view === item.key,
          icon: <item.icon className="h-[18px] w-[18px] shrink-0" />,
        }))}
        tagItems={tags.map((tag) => ({
          key: tag.id,
          href: `?tagId=${tag.id}${queryBase}`,
          label: tag.name,
          count: tag.bookmarkCount,
          active: tagId === tag.id,
          color: tag.color,
        }))}
      />

      {/* 移动端当前筛选状态（仅在存在激活筛选时显示） */}
      {activeTag || (!tagId && view !== "all") ? (
        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-card lg:hidden">
          {activeTag ? (
            <span className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border border-primary/30 bg-primary/10 py-1 pl-3 pr-1 text-xs font-medium text-primary">
              <span className="truncate">{activeTag.name}</span>
              <Link
                href={`?view=${view}${queryBase}`}
                aria-label="清除标签筛选"
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-primary/15"
              >
                <X className="h-3 w-3" />
              </Link>
            </span>
          ) : null}
          {!tagId && view !== "all" ? (
            <Link
              href={`?view=all${queryBase}`}
              className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border border-primary/30 bg-primary/10 py-1 pl-3 pr-1 text-xs font-medium text-primary transition-colors"
            >
              <span className="truncate">{aggregateItems.find((item) => item.key === view)?.label}</span>
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-primary/15">
                <X className="h-3 w-3" />
              </span>
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-col">
        <div className="shrink-0 border-b border-slate-200 px-4 py-6 dark:border-slate-800 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{heading.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{heading.subtitle}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <form className="w-full sm:w-80">
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
              {/* 搜索状态行：恒定渲染且与搜索框同宽，徽标始终在位撑住行高，搜索提示出现/消失不会改变页头高度；徽标带文字说明并右对齐，搜索提示与清除按钮居左 */}
              <div className="flex w-full items-center gap-2 sm:w-80">
                {q ? (
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="min-w-0 truncate text-xs text-muted-foreground">「{q}」的搜索结果</span>
                    <Link
                      href={clearSearchHref}
                      aria-label="清除搜索"
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Link>
                  </div>
                ) : null}
                <span className="ml-auto inline-flex shrink-0 items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                  共 {listResult.pagination.total} 个记录
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
      </div>
    </section>
  );
}
