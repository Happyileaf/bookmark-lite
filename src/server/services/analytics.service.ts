import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics/constants";
import {
  analyticsRepo,
  type ActiveCreatorRow,
  type DailyCountRow,
  type DailyTrafficRow,
  type NamedCountRow,
  type TopClickedBookmarkRow,
  type TopTagRow,
} from "@/server/repositories/analytics.repo";

/** 趋势统计窗口天数（近 30 天） */
const TREND_WINDOW_DAYS = 30;

/** 活跃用户统计窗口天数（近 7 天） */
const ACTIVE_USER_WINDOW_DAYS = 7;

/** 榜单类统计的条目上限 */
const TOP_LIST_LIMIT = 10;

/** 热门标签的条目上限 */
const TOP_TAG_LIMIT = 8;

/** 一天的毫秒数 */
const DAY_MS = 24 * 60 * 60 * 1000;

/** 设备类型中文名映射（键为 SDK 上报的 deviceType 值） */
const DEVICE_NAME_LABELS: Record<string, string> = {
  desktop: "桌面端",
  tablet: "平板",
  mobile: "手机",
  unknown: "未知设备",
};

/** 书签可见范围中文名映射（键为 DataScope 枚举值） */
const SCOPE_NAME_LABELS: Record<string, string> = {
  APP: "公开书签",
  USER: "私有书签",
};

/**
 * 核心指标卡片数据
 */
export type AnalyticsOverviewCards = {
  /** 用户总数（未禁用） */
  totalUsers: number;
  /** 书签总数（全平台） */
  totalBookmarks: number;
  /** 今日新增用户数 */
  todayNewUsers: number;
  /** 今日新增书签数 */
  todayNewBookmarks: number;
  /** 今日页面浏览量（PV） */
  todayPageViews: number;
  /** 今日独立访客数（UV） */
  todayUniqueVisitors: number;
  /** 近 7 日活跃用户数（按登录事件去重） */
  activeUsers7d: number;
};

/**
 * 内容增长趋势单日数据
 */
export type ContentTrendPoint = {
  /** 日期（格式 YYYY-MM-DD） */
  date: string;
  /** 当日新增用户数 */
  newUsers: number;
  /** 当日新增书签数 */
  newBookmarks: number;
};

/**
 * 数据概览页完整数据
 */
export type AnalyticsOverview = {
  /** 数据生成时间（ISO 8601 字符串） */
  generatedAt: string;
  /** 核心指标卡片 */
  cards: AnalyticsOverviewCards;
  /** 近 30 日流量趋势（含无数据日期补零） */
  trafficTrend: DailyTrafficRow[];
  /** 近 30 日内容增长趋势（含无数据日期补零） */
  contentTrend: ContentTrendPoint[];
  /** 访问设备分布（近 30 日） */
  deviceDistribution: NamedCountRow[];
  /** 访问来源分布（近 30 日，前 10 名） */
  sourceDistribution: NamedCountRow[];
  /** 书签可见范围分布（全量） */
  scopeDistribution: NamedCountRow[];
  /** 热门标签（按关联书签数，前 8 名） */
  topTags: TopTagRow[];
  /** 热门书签点击榜（近 30 日，前 10 名） */
  topBookmarks: TopClickedBookmarkRow[];
  /** 热门域名榜（存量书签，前 10 名） */
  topDomains: NamedCountRow[];
  /** 活跃用户榜（近 30 日按创建书签数，前 10 名） */
  activeCreators: ActiveCreatorRow[];
};

/**
 * 构建连续日期序列
 *
 * @description 从起始日期生成连续的 UTC 日期字符串列表，用于趋势图补零
 * @param start - 起始日期（UTC 日界）
 * @param days - 天数
 * @returns 日期字符串列表（格式 YYYY-MM-DD，升序）
 * @example
 * const dates = buildDateSequence(trendStart, 30);
 */
function buildDateSequence(start: Date, days: number): string[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY_MS);
    return date.toISOString().slice(0, 10);
  });
}

/**
 * 补全流量趋势的缺失日期
 *
 * @description 数据库仅返回有事件的日期，将无数据日期补零，保证趋势图连续
 * @param rows - 数据库返回的每日流量行
 * @param start - 窗口起始日期
 * @param days - 窗口天数
 * @returns 补零后的完整趋势列表
 * @example
 * const trend = fillDailyTraffic(rows, trendStart, 30);
 */
function fillDailyTraffic(rows: DailyTrafficRow[], start: Date, days: number): DailyTrafficRow[] {
  const rowByDate = new Map(rows.map((row) => [row.date, row]));
  return buildDateSequence(start, days).map(
    (date) => rowByDate.get(date) ?? { date, pageViews: 0, uniqueVisitors: 0 },
  );
}

/**
 * 合并并补全内容增长趋势
 *
 * @description 将每日新增用户与新增书签按日期合并为同一条趋势，无数据日期补零
 * @param userRows - 每日新增用户行
 * @param bookmarkRows - 每日新增书签行
 * @param start - 窗口起始日期
 * @param days - 窗口天数
 * @returns 补零后的内容增长趋势列表
 * @example
 * const trend = mergeDailyContent(userRows, bookmarkRows, trendStart, 30);
 */
function mergeDailyContent(
  userRows: DailyCountRow[],
  bookmarkRows: DailyCountRow[],
  start: Date,
  days: number,
): ContentTrendPoint[] {
  const userCountByDate = new Map(userRows.map((row) => [row.date, row.count]));
  const bookmarkCountByDate = new Map(bookmarkRows.map((row) => [row.date, row.count]));
  return buildDateSequence(start, days).map((date) => ({
    date,
    newUsers: userCountByDate.get(date) ?? 0,
    newBookmarks: bookmarkCountByDate.get(date) ?? 0,
  }));
}

/**
 * 映射分布维度名称
 *
 * @description 将枚举值或原始值翻译为页面展示用中文名，未知名称原样保留
 * @param rows - 命名计数行列表
 * @param labels - 名称映射表
 * @returns 名称映射后的行列表
 * @example
 * const rows = mapDistributionNames(rawRows, DEVICE_NAME_LABELS);
 */
function mapDistributionNames(rows: NamedCountRow[], labels: Record<string, string>): NamedCountRow[] {
  return rows.map((row) => ({ ...row, name: labels[row.name] ?? row.name }));
}

export const analyticsService = {
  /**
   * 获取数据概览
   *
   * @description 聚合用户、书签与事件指标，产出数据概览页所需的全部数据；
   * 统计口径统一为 UTC 日界，避免部署机时区差异导致结果不一致
   * @returns 数据概览完整结果
   * @example
   * const overview = await analyticsService.getOverview();
   */
  async getOverview(): Promise<AnalyticsOverview> {
    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const trendStart = new Date(startOfToday.getTime() - (TREND_WINDOW_DAYS - 1) * DAY_MS);
    const activeUserStart = new Date(now.getTime() - ACTIVE_USER_WINDOW_DAYS * DAY_MS);

    const [
      totalUsers,
      totalBookmarks,
      todayNewUsers,
      todayNewBookmarks,
      todayPageViews,
      todayUniqueVisitors,
      activeUsers7d,
      dailyTrafficRows,
      dailyUserRows,
      dailyBookmarkRows,
      deviceRows,
      sourceRows,
      scopeRows,
      topTags,
      topBookmarks,
      topDomains,
      activeCreators,
    ] = await Promise.all([
      analyticsRepo.countTotalUsers(),
      analyticsRepo.countTotalBookmarks(),
      analyticsRepo.countUsersSince(startOfToday),
      analyticsRepo.countBookmarksSince(startOfToday),
      analyticsRepo.countEventsSince(ANALYTICS_EVENT_NAMES.PAGE_VIEW, startOfToday),
      analyticsRepo.countUniqueVisitorsSince(startOfToday),
      analyticsRepo.countActiveUsersSince(activeUserStart),
      analyticsRepo.listDailyTraffic(trendStart),
      analyticsRepo.listDailyUserCreations(trendStart),
      analyticsRepo.listDailyBookmarkCreations(trendStart),
      analyticsRepo.listDeviceDistribution(trendStart),
      analyticsRepo.listSourceDistribution(trendStart, TOP_LIST_LIMIT),
      analyticsRepo.listBookmarkScopeDistribution(),
      analyticsRepo.listTopTags(TOP_TAG_LIMIT),
      analyticsRepo.listTopClickedBookmarks(trendStart, TOP_LIST_LIMIT),
      analyticsRepo.listTopBookmarkDomains(TOP_LIST_LIMIT),
      analyticsRepo.listActiveCreators(trendStart, TOP_LIST_LIMIT),
    ]);

    return {
      generatedAt: now.toISOString(),
      cards: {
        totalUsers,
        totalBookmarks,
        todayNewUsers,
        todayNewBookmarks,
        todayPageViews,
        todayUniqueVisitors,
        activeUsers7d,
      },
      trafficTrend: fillDailyTraffic(dailyTrafficRows, trendStart, TREND_WINDOW_DAYS),
      contentTrend: mergeDailyContent(dailyUserRows, dailyBookmarkRows, trendStart, TREND_WINDOW_DAYS),
      deviceDistribution: mapDistributionNames(deviceRows, DEVICE_NAME_LABELS),
      sourceDistribution: sourceRows.map((row) => ({
        ...row,
        name:
          row.name === "direct"
            ? "直接访问"
            : row.name === "unknown"
              ? "未知来源"
              : row.name,
      })),
      scopeDistribution: mapDistributionNames(scopeRows, SCOPE_NAME_LABELS),
      topTags,
      topBookmarks,
      topDomains,
      activeCreators,
    };
  },
};
