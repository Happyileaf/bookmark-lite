export type CountBadgeProps = {
  /** 展示的计数 */
  count: number;
  /** 是否位于激活态导航项内（主色底上反白展示） */
  active?: boolean;
};

/**
 * @description 计数气泡，以全圆角胶囊承载导航项计数；未激活态为品牌浅蓝底，
 * 激活态反白为白底品牌蓝字，明暗主题自适应，个位数时呈正圆形
 * @param props.count 展示的计数
 * @param props.active 是否位于激活态导航项内，缺省为 false
 * @returns 计数气泡元素
 * @example <CountBadge count={12} />
 * @example <CountBadge count={3} active />
 */
export function CountBadge({ count, active = false }: CountBadgeProps) {
  return (
    <span
      className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums ${
        active
          ? "bg-primary-foreground text-brand"
          : "bg-brand-softer text-brand dark:bg-brand/15 dark:text-blue-300"
      }`}
    >
      {count}
    </span>
  );
}
