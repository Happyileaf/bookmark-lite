/**
 * 占比饼图条目
 */
export type PieChartItem = {
  /** 维度名称（设备、来源、可见范围等） */
  name: string;
  /** 该维度下的数量 */
  count: number;
  /** 条目颜色（可选，缺省按调色板循环取色） */
  color?: string;
};

/**
 * 占比饼图入参
 */
type PieChartProps = {
  /** 分布条目列表（建议按数量降序传入） */
  items: PieChartItem[];
  /** 无数据时的占位文案 */
  emptyText?: string;
};

/** 饼图调色板（按条目顺序循环取色，与分布列表配色保持一致） */
const PIE_CHART_PALETTE = [
  "#1e80ff",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#65a30d",
  "#0d9488",
  "#64748b",
];

/** 饼图画布边长（viewBox 逻辑尺寸，随容器等比缩放） */
const CHART_SIZE = 160;

/** 饼图半径 */
const CHART_RADIUS = 72;

/**
 * 极坐标转直角坐标
 *
 * @description 以 12 点钟方向为 0 度、顺时针递增，将角度换算为 SVG 画布坐标
 * @param center - 圆心坐标（画布中心）
 * @param radius - 半径
 * @param angle - 角度（度）
 * @returns 直角坐标点
 * @example
 * resolvePoint(80, 72, 90); // { x: 152, y: 80 }
 */
function resolvePoint(center: number, radius: number, angle: number) {
  const radian = ((angle - 90) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(radian),
    y: center + radius * Math.sin(radian),
  };
}

/**
 * 构建扇区路径
 *
 * @description 生成从圆心出发、顺时针扫过的扇形 path 命令
 * @param center - 圆心坐标（画布中心）
 * @param radius - 半径
 * @param startAngle - 起始角度（度）
 * @param endAngle - 结束角度（度）
 * @returns 扇形 path 的 d 属性值
 * @example
 * describeSlice(80, 72, 0, 120);
 */
function describeSlice(
  center: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = resolvePoint(center, radius, startAngle);
  const end = resolvePoint(center, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${center} ${center}`,
    `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

/**
 * 格式化百分比
 *
 * @description 保留一位小数并追加百分号，用于图例与悬浮提示的占比展示
 * @param percent - 百分比数值（0-100）
 * @returns 带百分号的字符串
 * @example
 * formatPercent(12.34); // "12.3%"
 */
function formatPercent(percent: number): string {
  return `${percent.toFixed(1)}%`;
}

/**
 * 占比饼图
 *
 * @description 以 SVG 手绘的轻量扇形占比图（无第三方图表依赖），按数量占比切分扇区，
 * 下方图例展示名称、数量与占比；纯服务端渲染，悬浮提示通过原生 title 实现，
 * 适用于设备、来源、可见范围等维度有限的分布场景
 * @param props - 饼图入参
 * @returns 占比饼图组件
 * @example
 * <PieChart items={[{ name: "桌面端", count: 128 }, { name: "手机", count: 64 }]} />
 */
export default function PieChart({
  items,
  emptyText = "暂无数据",
}: PieChartProps) {
  /** 数量为 0 的条目不产生扇区，直接过滤 */
  const validItems = items.filter((item) => item.count > 0);
  const total = validItems.reduce((sum, item) => sum + item.count, 0);

  if (validItems.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">{emptyText}</p>
    );
  }

  /** 各条目数量占比（0-1），用于换算扇区角度 */
  const ratios = validItems.map((item) => item.count / total);

  /** 按占比前缀和计算起止角度，生成扇区列表 */
  const slices = validItems.map((item, index) => {
    const startAngle = ratios
      .slice(0, index)
      .reduce((sum, ratio) => sum + ratio * 360, 0);
    const endAngle = startAngle + (ratios[index] ?? 0) * 360;
    return {
      ...item,
      color: item.color ?? PIE_CHART_PALETTE[index % PIE_CHART_PALETTE.length],
      startAngle,
      endAngle,
      percent: (ratios[index] ?? 0) * 100,
    };
  });

  const chartCenter = CHART_SIZE / 2;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
        className="h-36 w-36"
        role="img"
        aria-label="占比饼图"
      >
        {slices.length === 1 && slices[0] ? (
          <circle
            cx={chartCenter}
            cy={chartCenter}
            r={CHART_RADIUS}
            fill={slices[0].color}
          >
            <title>{`${slices[0].name}：${slices[0].count.toLocaleString("zh-CN")}（100%）`}</title>
          </circle>
        ) : (
          slices.map((slice) => (
            <path
              key={slice.name}
              d={describeSlice(
                chartCenter,
                CHART_RADIUS,
                slice.startAngle,
                slice.endAngle,
              )}
              fill={slice.color}
            >
              <title>{`${slice.name}：${slice.count.toLocaleString("zh-CN")}（${formatPercent(slice.percent)}）`}</title>
            </path>
          ))
        )}
      </svg>
      <ul className="w-full space-y-1.5">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span
              className="min-w-0 flex-1 truncate text-muted-foreground"
              title={slice.name}
            >
              {slice.name}
            </span>
            <span className="shrink-0 font-medium tabular-nums">
              {slice.count.toLocaleString("zh-CN")}
            </span>
            <span className="w-12 shrink-0 text-right text-muted-foreground tabular-nums">
              {formatPercent(slice.percent)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
