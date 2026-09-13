import type { ReactNode } from "react";

export type TagChipProps = {
  color?: string;
  children: ReactNode;
  className?: string;
};

export function TagChip({ color, children, className }: TagChipProps) {
  return (
    <span className={`tag-chip ${className ?? ""}`}>
      {color ? (
        <span
          className="h-[5px] w-[5px] shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}
