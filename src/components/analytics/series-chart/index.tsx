/**
 * 图表数据序列
 */
export type SeriesChartSeries = {
  /** 序列名称（用于图例与悬浮提示） */
  name: string;
  /** 序列颜色（CSS 颜色值） */
  color: string;
  /** 与 X 轴标签一一对应的数值列表 */
  values: number[];
};

/**
 * 通用双序列趋势图入参
 */
type SeriesChartProps = {
  /** X 轴标签列表（日期，格式 YYYY-MM-DD） */
  labels: string[];
  /** 数据序列（1-2 条） */
  series: SeriesChartSeries[];
  /** 图表形态：折线面积图或分组柱状图 */
  variant?: "line" | "bar";
  /** 图表高度（像素） */
  height?: number;
};

/** 图表画布宽度（viewBox 逻辑宽度，随容器等比缩放） */
const CHART_WIDTH = 720;

/** 图表内边距（为坐标轴标签预留空间） */
const CHART_PADDING = { top: 16, right: 12, bottom: 28, left: 40 };

/** 网格线数量（不含底线） */
const GRID_LINE_COUNT = 3;

/**
 * 格式化坐标轴数值
 *
 * @description 大数值缩写为 k 形式，小数值原样展示，保证轴标签简洁
 * @param value - 原始数值
 * @returns 格式化后的字符串
 * @example
 * formatAxisValue(1200); // "1.2k"
 */
function formatAxisValue(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(Math.round(value));
}

/**
 * 通用双序列趋势图
 *
 * @description 以 SVG 手绘的轻量趋势图（无第三方图表依赖），支持折线与柱状两种形态；
 * 纯服务端渲染，悬浮提示通过原生 title 实现
 * @param props - 图表入参
 * @returns 趋势图组件
 * @example
 * <SeriesChart labels={dates} series={[{ name: "PV", color: "#2563eb", values }]} variant="line" />
 */
export default function SeriesChart({
  labels,
  series,
  variant = "line",
  height = 240,
}: SeriesChartProps) {
  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;
  const baseline = CHART_PADDING.top + innerHeight;
  const count = labels.length;
  const maxValue = Math.max(1, ...series.flatMap((item) => item.values));
  const hasData = series.some((item) => item.values.some((value) => value > 0));

  /** 计算第 index 个数据点的 X 坐标 */
  const resolveX = (index: number): number => {
    if (count <= 1) {
      return CHART_PADDING.left + innerWidth / 2;
    }
    return CHART_PADDING.left + (index / (count - 1)) * innerWidth;
  };

  /** 计算数值对应的 Y 坐标 */
  const resolveY = (value: number): number => {
    return CHART_PADDING.top + (1 - value / maxValue) * innerHeight;
  };

  /** 选取要展示的 X 轴标签下标（首末与三个中间等距点，避免拥挤） */
  const resolveTickIndexes = (): number[] => {
    if (count <= 2) {
      return labels.map((_, index) => index);
    }
    const tickCount = Math.min(5, count);
    const step = (count - 1) / (tickCount - 1);
    return Array.from({ length: tickCount }, (_, i) => Math.round(i * step));
  };

  if (!hasData) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
        统计窗口内暂无数据
      </div>
    );
  }

  const gridValues = Array.from(
    { length: GRID_LINE_COUNT + 1 },
    (_, index) => (maxValue / GRID_LINE_COUNT) * index,
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-4">
        {series.map((item) => (
          <span key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="趋势图"
      >
        {gridValues.map((value) => {
          const y = resolveY(value);
          return (
            <g key={value}>
              <line
                x1={CHART_PADDING.left}
                y1={y}
                x2={CHART_WIDTH - CHART_PADDING.right}
                y2={y}
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth={1}
                strokeDasharray={value === 0 ? undefined : "3 4"}
              />
              <text
                x={CHART_PADDING.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500"
                fontSize={10}
              >
                {formatAxisValue(value)}
              </text>
            </g>
          );
        })}

        {variant === "line"
          ? series.map((item) => {
              const points = item.values
                .map((value, index) => `${resolveX(index).toFixed(2)},${resolveY(value).toFixed(2)}`)
                .join(" ");
              const firstX = resolveX(0);
              const lastX = resolveX(count - 1);
              return (
                <g key={item.name}>
                  <polygon
                    points={`${firstX.toFixed(2)},${baseline} ${points} ${lastX.toFixed(2)},${baseline}`}
                    fill={item.color}
                    fillOpacity={0.08}
                  />
                  <polyline
                    points={points}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {item.values.map((value, index) => (
                    <circle
                      key={labels[index]}
                      cx={resolveX(index)}
                      cy={resolveY(value)}
                      r={8}
                      fill="transparent"
                    >
                      <title>{`${labels[index]} ${item.name}：${value}`}</title>
                    </circle>
                  ))}
                </g>
              );
            })
          : series.map((item, seriesIndex) => {
              const bandWidth = innerWidth / count;
              const barWidth = Math.min((bandWidth * 0.62) / series.length, 28);
              return (
                <g key={item.name}>
                  {item.values.map((value, index) => {
                    const bandCenter = CHART_PADDING.left + bandWidth * index + bandWidth / 2;
                    const x =
                      bandCenter - (series.length * barWidth) / 2 + seriesIndex * barWidth;
                    const y = resolveY(value);
                    return (
                      <rect
                        key={labels[index]}
                        x={x.toFixed(2)}
                        y={y.toFixed(2)}
                        width={Math.max(barWidth - 2, 1).toFixed(2)}
                        height={Math.max(baseline - y, value > 0 ? 2 : 0).toFixed(2)}
                        rx={1.5}
                        fill={item.color}
                        fillOpacity={0.85}
                      >
                        <title>{`${labels[index]} ${item.name}：${value}`}</title>
                      </rect>
                    );
                  })}
                </g>
              );
            })}

        {resolveTickIndexes().map((index) => (
          <text
            key={labels[index]}
            x={resolveX(index)}
            y={height - 8}
            textAnchor="middle"
            className="fill-slate-400 dark:fill-slate-500"
            fontSize={10}
          >
            {labels[index].slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}
