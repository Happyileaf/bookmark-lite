import { EyeOff } from "lucide-react";

export type VisibilityBadgeProps = {
  visible: boolean;
  className?: string;
};

export function VisibilityBadge({ visible, className }: VisibilityBadgeProps) {
  if (visible) {
    return (
      <span className={`vis-badge v ${className ?? ""}`}>
        <span className="dot" aria-hidden="true" />
        可见
      </span>
    );
  }

  return (
    <span className={`vis-badge h ${className ?? ""}`}>
      <EyeOff className="h-3 w-3" />
      隐藏
    </span>
  );
}
