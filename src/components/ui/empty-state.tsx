import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-sm border border-dashed border-slate-200 px-4 py-14 text-center dark:border-slate-800 ${
        className ?? ""
      }`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-sm bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3.5 text-sm font-medium">{title}</p>
      {description ? (
        <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
