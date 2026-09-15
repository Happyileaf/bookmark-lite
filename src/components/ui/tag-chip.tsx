import type { ReactNode } from "react";

export type TagChipProps = {
  color?: string;
  children: ReactNode;
  className?: string;
  title?: string;
};

/**
 * @description 通用标签组件，展示一个纯色小圆点和一段文案，视觉样式统一定义在 globals.css 的 .tag-chip
 * @param props.color 圆点颜色，传入时展示圆点，缺省则不展示圆点（如 +N 计数场景）
 * @param props.children 标签文案，过长时自动截断
 * @param props.className 附加样式类，用于布局微调（如 shrink-0、max-w-full）
 * @param props.title 悬浮提示文案，通常在文案可能被截断时传入完整内容
 * @returns 标签元素
 * @example <TagChip color="#1e80ff" title="工作">工作</TagChip>
 */
export function TagChip({ color, children, className, title }: TagChipProps) {
  return (
    <span className={`tag-chip ${className ?? ""}`} title={title}>
      {color ? (
        <span
          className="h-[5px] w-[5px] shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
