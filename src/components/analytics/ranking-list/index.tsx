/**
 * 榜单条目
 */
export type RankingListItem = {
  /** 条目唯一标识 */
  id: string;
  /** 主标题（书签名、用户名等） */
  title: string;
  /** 副标题（可选，如书签 URL） */
  subtitle?: string;
  /** 统计数值 */
  value: number;
  /** 数值单位（如「次点击」「个书签」） */
  unit: string;
  /** 跳转链接（可选，存在时整行可点击并在新窗口打开） */
  href?: string;
};

/**
 * 榜单列表入参
 */
type RankingListProps = {
  /** 榜单条目列表（按名次降序传入） */
  items: RankingListItem[];
  /** 无数据时的占位文案 */
  emptyText?: string;
};

/** 前三名名次徽标颜色（金、银、铜） */
const RANK_BADGE_COLORS = ["#f59e0b", "#94a3b8", "#b45309"];

/**
 * 名次徽标
 *
 * @description 前三名使用金银铜配色圆点，其余使用默认浅色底
 * @param props - 名次入参
 * @returns 名次徽标元素
 * @example
 * <RankBadge rank={1} />
 */
function RankBadge({ rank }: { rank: number }) {
  const color = RANK_BADGE_COLORS[rank - 1];
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
        color ? "" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
      }`}
      style={color ? { color: "#fff", backgroundColor: color } : undefined}
    >
      {rank}
    </span>
  );
}

/**
 * 榜单列表
 *
 * @description 以编号行展示 Top N 榜单，前三名徽标高亮；
 * 带链接的条目整行可点击并在新窗口打开，纯服务端渲染
 * @param props - 榜单列表入参
 * @returns 榜单列表组件
 * @example
 * <RankingList items={[{ id: "1", title: "GitHub", value: 32, unit: "次点击", href: "https://github.com" }]} />
 */
export default function RankingList({
  items,
  emptyText = "暂无数据",
}: RankingListProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">{emptyText}</p>
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((item, index) => {
        const rowContent = (
          <>
            <RankBadge rank={index + 1} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">
                {item.title}
              </span>
              {item.subtitle ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {item.subtitle}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                {item.value.toLocaleString("zh-CN")}
              </span>{" "}
              {item.unit}
            </span>
          </>
        );
        const rowClassName =
          "flex items-center gap-2.5 rounded-sm px-2 py-1.5 transition-colors";
        return (
          <li key={item.id}>
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${rowClassName} hover:bg-slate-50 dark:hover:bg-slate-800/60`}
              >
                {rowContent}
              </a>
            ) : (
              <div className={rowClassName}>{rowContent}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
