/**
 * 分布列表条目
 */
export type DistributionListItem = {
  /** 维度名称（设备、来源、标签等） */
  name: string;
  /** 该维度下的数量 */
  count: number;
  /** 条目颜色（可选，缺省按调色板循环取色） */
  color?: string;
};

/**
 * 分布列表入参
 */
type DistributionListProps = {
  /** 分布条目列表（建议按数量降序传入） */
  items: DistributionListItem[];
  /** 无数据时的占位文案 */
  emptyText?: string;
};

/** 分布条调色板（按条目顺序循环取色） */
const DISTRIBUTION_PALETTE = [
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#65a30d",
];

/**
 * 水平占比条分布列表
 *
 * @description 以水平条形展示各维度占比，条宽按最大值归一化；
 * 纯服务端渲染，适用于设备、来源、可见范围、标签等分布场景
 * @param props - 分布列表入参
 * @returns 分布列表组件
 * @example
 * <DistributionList items={[{ name: "桌面端", count: 128 }]} />
 */
export default function DistributionList({
  items,
  emptyText = "暂无数据",
}: DistributionListProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">{emptyText}</p>
    );
  }

  const maxCount = Math.max(1, ...items.map((item) => item.count));

  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => {
        const color =
          item.color ?? DISTRIBUTION_PALETTE[index % DISTRIBUTION_PALETTE.length];
        const widthPercent =
          item.count > 0 ? Math.max((item.count / maxCount) * 100, 2) : 0;
        return (
          <li key={item.name} className="flex items-center gap-3">
            <span
              className="w-24 shrink-0 truncate text-xs text-muted-foreground"
              title={item.name}
            >
              {item.name}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <span
                className="block h-full rounded-full"
                style={{ width: `${widthPercent}%`, backgroundColor: color }}
              />
            </span>
            <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums">
              {item.count.toLocaleString("zh-CN")}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
