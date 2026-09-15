import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics/constants";
import { prisma } from "@/server/db/prisma";

/**
 * 每日流量聚合行（按 UTC 天聚合）
 */
export type DailyTrafficRow = {
  /** 日期（格式 YYYY-MM-DD） */
  date: string;
  /** 当日页面浏览量（PV） */
  pageViews: number;
  /** 当日独立访客数（UV，按 visitorId 去重） */
  uniqueVisitors: number;
};

/**
 * 每日数量聚合行（新增用户、新增书签等按天统计共用）
 */
export type DailyCountRow = {
  /** 日期（格式 YYYY-MM-DD） */
  date: string;
  /** 当日数量 */
  count: number;
};

/**
 * 命名计数行（设备、来源、域名、可见范围等分布统计共用）
 */
export type NamedCountRow = {
  /** 维度名称 */
  name: string;
  /** 该维度下的数量 */
  count: number;
};

/**
 * 热门标签行
 */
export type TopTagRow = {
  /** 标签名称 */
  name: string;
  /** 标签颜色（可为空） */
  color: string | null;
  /** 关联书签数 */
  count: number;
};

/**
 * 热门书签点击行
 */
export type TopClickedBookmarkRow = {
  /** 书签 ID */
  id: string;
  /** 书签标题 */
  title: string;
  /** 书签地址 */
  url: string;
  /** 统计窗口内的点击次数 */
  clicks: number;
};

/**
 * 活跃用户行（按窗口内创建书签数排名）
 */
export type ActiveCreatorRow = {
  /** 用户 ID */
  id: string;
  /** 展示名（昵称，缺省时回退为邮箱） */
  name: string;
  /** 窗口内创建的书签数 */
  count: number;
};

/** 单条计数原始查询结果行 */
type RawCountRow = {
  count: number;
};

export const analyticsRepo = {
  /**
   * 统计用户总数
   *
   * @description 统计未被禁用的用户总量
   * @returns 用户总数
   * @example
   * const total = await analyticsRepo.countTotalUsers();
   */
  countTotalUsers(): Promise<number> {
    return prisma.user.count({ where: { disabledAt: null } });
  },

  /**
   * 统计书签总数
   *
   * @description 统计全平台（公开与私有）书签总量
   * @returns 书签总数
   * @example
   * const total = await analyticsRepo.countTotalBookmarks();
   */
  countTotalBookmarks(): Promise<number> {
    return prisma.bookmark.count();
  },

  /**
   * 统计指定时间后新增的用户数
   *
   * @description 按用户创建时间统计增量
   * @param since - 统计起始时间（含）
   * @returns 新增用户数
   * @example
   * const count = await analyticsRepo.countUsersSince(startOfToday);
   */
  countUsersSince(since: Date): Promise<number> {
    return prisma.user.count({ where: { createdAt: { gte: since } } });
  },

  /**
   * 统计指定时间后新增的书签数
   *
   * @description 按书签创建时间统计增量
   * @param since - 统计起始时间（含）
   * @returns 新增书签数
   * @example
   * const count = await analyticsRepo.countBookmarksSince(startOfToday);
   */
  countBookmarksSince(since: Date): Promise<number> {
    return prisma.bookmark.count({ where: { createdAt: { gte: since } } });
  },

  /**
   * 统计指定事件在时间窗口内的发生次数
   *
   * @description 通用事件计数，用于 PV 等指标
   * @param eventName - 事件名
   * @param since - 统计起始时间（含）
   * @returns 事件次数
   * @example
   * const pv = await analyticsRepo.countEventsSince("page_view", startOfToday);
   */
  countEventsSince(eventName: string, since: Date): Promise<number> {
    return prisma.eventMetric.count({
      where: { eventName, occurredAt: { gte: since } },
    });
  },

  /**
   * 统计指定时间后的独立访客数
   *
   * @description 按 page_view 事件 payload 中的 visitorId 去重计数（UV 口径）
   * @param since - 统计起始时间（含）
   * @returns 独立访客数
   * @example
   * const uv = await analyticsRepo.countUniqueVisitorsSince(startOfToday);
   */
  async countUniqueVisitorsSince(since: Date): Promise<number> {
    const rows = await prisma.$queryRaw<RawCountRow[]>`
      SELECT COUNT(DISTINCT payload->>'visitorId')::int AS count
      FROM event_metrics
      WHERE event_name = ${ANALYTICS_EVENT_NAMES.PAGE_VIEW}
        AND occurred_at >= ${since}
    `;
    return rows[0]?.count ?? 0;
  },

  /**
   * 统计指定时间后的活跃用户数
   *
   * @description 按登录成功事件的 user_id 去重计数，衡量回访活跃
   * @param since - 统计起始时间（含）
   * @returns 活跃用户数
   * @example
   * const active = await analyticsRepo.countActiveUsersSince(sevenDaysAgo);
   */
  async countActiveUsersSince(since: Date): Promise<number> {
    const rows = await prisma.$queryRaw<RawCountRow[]>`
      SELECT COUNT(DISTINCT user_id)::int AS count
      FROM event_metrics
      WHERE event_name = ${ANALYTICS_EVENT_NAMES.USER_LOGGED_IN}
        AND occurred_at >= ${since}
        AND user_id IS NOT NULL
    `;
    return rows[0]?.count ?? 0;
  },

  /**
   * 查询每日流量趋势
   *
   * @description 按 UTC 天聚合 page_view 事件的 PV 与 UV，仅返回有数据的日期
   * @param since - 统计起始时间（含）
   * @returns 每日流量行列表（按日期升序）
   * @example
   * const rows = await analyticsRepo.listDailyTraffic(trendStart);
   */
  listDailyTraffic(since: Date): Promise<DailyTrafficRow[]> {
    return prisma.$queryRaw<DailyTrafficRow[]>`
      SELECT
        to_char(date_trunc('day', occurred_at), 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS "pageViews",
        COUNT(DISTINCT payload->>'visitorId')::int AS "uniqueVisitors"
      FROM event_metrics
      WHERE event_name = ${ANALYTICS_EVENT_NAMES.PAGE_VIEW}
        AND occurred_at >= ${since}
      GROUP BY 1
      ORDER BY 1
    `;
  },

  /**
   * 查询每日新增用户趋势
   *
   * @description 按 UTC 天聚合用户创建时间，仅返回有数据的日期
   * @param since - 统计起始时间（含）
   * @returns 每日新增用户行列表（按日期升序）
   * @example
   * const rows = await analyticsRepo.listDailyUserCreations(trendStart);
   */
  listDailyUserCreations(since: Date): Promise<DailyCountRow[]> {
    return prisma.$queryRaw<DailyCountRow[]>`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS count
      FROM users
      WHERE created_at >= ${since}
      GROUP BY 1
      ORDER BY 1
    `;
  },

  /**
   * 查询每日新增书签趋势
   *
   * @description 按 UTC 天聚合书签创建时间，仅返回有数据的日期
   * @param since - 统计起始时间（含）
   * @returns 每日新增书签行列表（按日期升序）
   * @example
   * const rows = await analyticsRepo.listDailyBookmarkCreations(trendStart);
   */
  listDailyBookmarkCreations(since: Date): Promise<DailyCountRow[]> {
    return prisma.$queryRaw<DailyCountRow[]>`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS count
      FROM bookmarks
      WHERE created_at >= ${since}
      GROUP BY 1
      ORDER BY 1
    `;
  },

  /**
   * 查询访问设备分布
   *
   * @description 按 page_view 事件 payload 中的 deviceType 分组计数
   * @param since - 统计起始时间（含）
   * @returns 设备分布行列表（按数量降序）
   * @example
   * const rows = await analyticsRepo.listDeviceDistribution(trendStart);
   */
  listDeviceDistribution(since: Date): Promise<NamedCountRow[]> {
    return prisma.$queryRaw<NamedCountRow[]>`
      SELECT COALESCE(NULLIF(payload->>'deviceType', ''), 'unknown') AS name,
        COUNT(*)::int AS count
      FROM event_metrics
      WHERE event_name = ${ANALYTICS_EVENT_NAMES.PAGE_VIEW}
        AND occurred_at >= ${since}
      GROUP BY 1
      ORDER BY count DESC
    `;
  },

  /**
   * 查询访问来源分布
   *
   * @description 从 page_view 事件 payload 的 referrer 提取来源域名分组计数；
   * 无来源（直接访问或同站跳转）统一归为 direct
   * @param since - 统计起始时间（含）
   * @param limit - 返回条目上限
   * @returns 来源分布行列表（按数量降序）
   * @example
   * const rows = await analyticsRepo.listSourceDistribution(trendStart, 10);
   */
  listSourceDistribution(since: Date, limit: number): Promise<NamedCountRow[]> {
    return prisma.$queryRaw<NamedCountRow[]>`
      SELECT
        CASE
          WHEN payload->>'referrer' IS NULL OR payload->>'referrer' = '' THEN 'direct'
          ELSE COALESCE(
            NULLIF(split_part(split_part(payload->>'referrer', '://', 2), '/', 1), ''),
            'unknown'
          )
        END AS name,
        COUNT(*)::int AS count
      FROM event_metrics
      WHERE event_name = ${ANALYTICS_EVENT_NAMES.PAGE_VIEW}
        AND occurred_at >= ${since}
      GROUP BY 1
      ORDER BY count DESC
      LIMIT ${limit}
    `;
  },

  /**
   * 查询书签可见范围分布
   *
   * @description 按 scope 分组统计全量书签（公开 APP / 私有 USER）
   * @returns 可见范围分布行列表
   * @example
   * const rows = await analyticsRepo.listBookmarkScopeDistribution();
   */
  async listBookmarkScopeDistribution(): Promise<NamedCountRow[]> {
    const rows = await prisma.bookmark.groupBy({
      by: ["scope"],
      _count: { _all: true },
    });
    return rows.map((row) => ({ name: row.scope, count: row._count._all }));
  },

  /**
   * 查询热门标签
   *
   * @description 按关联书签数倒序取全平台热门标签
   * @param limit - 返回条目上限
   * @returns 热门标签行列表
   * @example
   * const rows = await analyticsRepo.listTopTags(8);
   */
  async listTopTags(limit: number): Promise<TopTagRow[]> {
    const rows = await prisma.tag.findMany({
      where: { bookmarkCount: { gt: 0 } },
      orderBy: [{ bookmarkCount: "desc" }, { createdAt: "asc" }],
      take: limit,
      select: { name: true, color: true, bookmarkCount: true },
    });
    return rows.map((row) => ({
      name: row.name,
      color: row.color,
      count: row.bookmarkCount,
    }));
  },

  /**
   * 查询热门书签点击榜
   *
   * @description 按 bookmark_clicked 事件分组计数并关联书签表取标题；已删除的书签自动剔除
   * @param since - 统计起始时间（含）
   * @param limit - 返回条目上限
   * @returns 热门书签行列表（按点击数降序）
   * @example
   * const rows = await analyticsRepo.listTopClickedBookmarks(trendStart, 10);
   */
  listTopClickedBookmarks(since: Date, limit: number): Promise<TopClickedBookmarkRow[]> {
    return prisma.$queryRaw<TopClickedBookmarkRow[]>`
      SELECT b.id, b.title, b.url, COUNT(*)::int AS clicks
      FROM event_metrics em
      JOIN bookmarks b ON b.id::text = em.payload->>'bookmarkId'
      WHERE em.event_name = ${ANALYTICS_EVENT_NAMES.BOOKMARK_CLICKED}
        AND em.occurred_at >= ${since}
      GROUP BY b.id, b.title, b.url
      ORDER BY clicks DESC
      LIMIT ${limit}
    `;
  },

  /**
   * 查询热门域名榜
   *
   * @description 从存量书签 URL 中提取域名（协议后第一段）分组计数
   * @param limit - 返回条目上限
   * @returns 热门域名行列表（按数量降序）
   * @example
   * const rows = await analyticsRepo.listTopBookmarkDomains(10);
   */
  listTopBookmarkDomains(limit: number): Promise<NamedCountRow[]> {
    return prisma.$queryRaw<NamedCountRow[]>`
      SELECT split_part(url, '/', 3) AS name, COUNT(*)::int AS count
      FROM bookmarks
      GROUP BY 1
      ORDER BY count DESC
      LIMIT ${limit}
    `;
  },

  /**
   * 查询活跃用户榜
   *
   * @description 按 bookmark_created 事件统计窗口内创建书签最多的用户
   * @param since - 统计起始时间（含）
   * @param limit - 返回条目上限
   * @returns 活跃用户行列表（按创建数降序）
   * @example
   * const rows = await analyticsRepo.listActiveCreators(trendStart, 10);
   */
  listActiveCreators(since: Date, limit: number): Promise<ActiveCreatorRow[]> {
    return prisma.$queryRaw<ActiveCreatorRow[]>`
      SELECT u.id, COALESCE(u.name, u.email) AS name, COUNT(*)::int AS count
      FROM event_metrics em
      JOIN users u ON u.id = em.user_id
      WHERE em.event_name = ${ANALYTICS_EVENT_NAMES.BOOKMARK_CREATED}
        AND em.occurred_at >= ${since}
        AND em.user_id IS NOT NULL
      GROUP BY u.id, u.name, u.email
      ORDER BY count DESC
      LIMIT ${limit}
    `;
  },
};
