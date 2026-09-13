import type { LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

export type StatChipProps = {
  icon: LucideIcon;
  tint?: string;
  value: ReactNode;
  label: string;
  className?: string;
};

export function StatChip({
  icon: Icon,
  tint = "#2563eb",
  value,
  label,
  className,
}: StatChipProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-card ${
        className ?? ""
      }`}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm"
        style={
          {
            "--tint": tint,
            color: "var(--tint)",
            backgroundColor: "color-mix(in srgb, var(--tint) 12%, transparent)",
          } as CSSProperties
        }
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="text-[15px] font-bold tracking-[-0.01em]">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
