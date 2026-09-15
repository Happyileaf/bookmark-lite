import {
  Activity,
  Bookmark as BookmarkIcon,
  BookmarkPlus,
  Eye,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import DistributionList from "@/components/analytics/distribution-list";
import RankingList from "@/components/analytics/ranking-list";
import SeriesChart from "@/components/analytics/series-chart";
import { StatChip } from "@/components/ui/stat-chip";
import type { AnalyticsOverview } from "@/server/services/analytics.service";

/**
 * 数据概览视图入参
 */
type OverviewViewProps = {
  /** 数据概览聚合结果 */
  overview: AnalyticsOverview;
};

/**
 * 统计区块卡片入参
 */
type SectionCardProps = {
  /** 区块标题 */
  title: string;
  /** 区块副标题（统计口径说明，可选） */
  description?: string;
  /** 区块内容 */
  children: ReactNode;
};

/**
 * 格式化数据生成时间
 *
 * @description 将 ISO 时间串格式化为北京时间展示，与 UTC 日界统计口径区分
 * @param iso - ISO 8601 时间字符串
 * @returns 北京时间格式化字符串（精确到分钟）
 * @example
 * formatGeneratedAt("2026-09-15T06:30:00.000Z"); // "2026/09/15 14:30"
 */
function formatGeneratedAt(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * 统计区块卡片
 *
 * @description 统一承载图表、分布与榜单的卡片容器，含标题与口径说明
 * @param props - 区块卡片入参
 * @returns 区块卡片元素
 * @example
 * <SectionCard title="流量趋势" description="近 30 天">...</SectionCard>
 */
function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="min-w-0 rounded-sm border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-card">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/**
 * 数据概览视图（管理端）
 *
 * @description 服务端组件：渲染核心指标卡、流量与内容增长趋势图、
 * 设备/来源/可见范围/标签分布，以及热门书签、热门域名与活跃用户榜单
 * @param props - 数据概览聚合结果
 * @returns 数据概览页面主体
 * @example
 * <OverviewView overview={await analyticsService.getOverview()} />
 */
export default function OverviewView({ overview }: OverviewViewProps) {
  const { cards } = overview;
  const trafficLabels = overview.trafficTrend.map((point) => point.date);
  const contentLabels = overview.contentTrend.map((point) => point.date);

  return (
    <section className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
            数据概览
          </h1>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            统计口径：UTC 日界 · 趋势窗口近 30 天 · 数据更新于{" "}
            {formatGeneratedAt(overview.generatedAt)}（北京时间）
          </p>
        </div>
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatChip
          icon={Users}
          tint="#1e80ff"
          value={cards.totalUsers.toLocaleString("zh-CN")}
          label="总用户"
        />
        <StatChip
          icon={BookmarkIcon}
          tint="#7c3aed"
          value={cards.totalBookmarks.toLocaleString("zh-CN")}
          label="总书签"
        />
        <StatChip
          icon={UserPlus}
          tint="#059669"
          value={cards.todayNewUsers.toLocaleString("zh-CN")}
          label="今日新增用户"
        />
        <StatChip
          icon={BookmarkPlus}
          tint="#0891b2"
          value={cards.todayNewBookmarks.toLocaleString("zh-CN")}
          label="今日新增书签"
        />
        <StatChip
          icon={Eye}
          tint="#d97706"
          value={cards.todayPageViews.toLocaleString("zh-CN")}
          label="今日浏览量（PV）"
        />
        <StatChip
          icon={UserCheck}
          tint="#db2777"
          value={cards.todayUniqueVisitors.toLocaleString("zh-CN")}
          label="今日访客（UV）"
        />
        <StatChip
          icon={Activity}
          tint="#dc2626"
          value={cards.activeUsers7d.toLocaleString("zh-CN")}
          label="7 日活跃用户"
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <SectionCard title="流量趋势" description="近 30 天页面浏览量与独立访客">
          <SeriesChart
            labels={trafficLabels}
            series={[
              {
                name: "浏览量（PV）",
                color: "#1e80ff",
                values: overview.trafficTrend.map((point) => point.pageViews),
              },
              {
                name: "独立访客（UV）",
                color: "#059669",
                values: overview.trafficTrend.map((point) => point.uniqueVisitors),
              },
            ]}
            variant="line"
          />
        </SectionCard>
        <SectionCard title="内容增长" description="近 30 天新增用户与新增书签">
          <SeriesChart
            labels={contentLabels}
            series={[
              {
                name: "新增用户",
                color: "#7c3aed",
                values: overview.contentTrend.map((point) => point.newUsers),
              },
              {
                name: "新增书签",
                color: "#0891b2",
                values: overview.contentTrend.map((point) => point.newBookmarks),
              },
            ]}
            variant="bar"
          />
        </SectionCard>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="设备分布" description="近 30 天">
          <DistributionList items={overview.deviceDistribution} />
        </SectionCard>
        <SectionCard title="来源分布" description="近 30 天前 10 名">
          <DistributionList items={overview.sourceDistribution} />
        </SectionCard>
        <SectionCard title="书签可见范围" description="全量存量">
          <DistributionList items={overview.scopeDistribution} />
        </SectionCard>
        <SectionCard title="热门标签" description="按关联书签数前 8 名">
          <DistributionList
            items={overview.topTags.map((tag) => ({
              name: tag.name,
              count: tag.count,
              color: tag.color ?? undefined,
            }))}
          />
        </SectionCard>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard title="热门书签" description="近 30 天点击榜前 10 名">
          <RankingList
            items={overview.topBookmarks.map((bookmark) => ({
              id: bookmark.id,
              title: bookmark.title,
              subtitle: bookmark.url,
              value: bookmark.clicks,
              unit: "次点击",
              href: bookmark.url,
            }))}
          />
        </SectionCard>
        <SectionCard title="热门域名" description="存量书签来源站点前 10 名">
          <RankingList
            items={overview.topDomains.map((domain) => ({
              id: domain.name,
              title: domain.name,
              value: domain.count,
              unit: "个书签",
            }))}
          />
        </SectionCard>
        <SectionCard title="活跃用户" description="近 30 天创建书签数前 10 名">
          <RankingList
            items={overview.activeCreators.map((creator) => ({
              id: creator.id,
              title: creator.name,
              value: creator.count,
              unit: "个书签",
            }))}
          />
        </SectionCard>
      </section>
    </section>
  );
}
