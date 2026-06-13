"use client";

import { useRef, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { updateSettingsAction } from "@/actions/settings.actions";
import type { DataScope } from "@prisma/client";

type ThemeValue = "light" | "dark" | "system";

type SelectOption = {
  value: string | number;
  label: string;
};

type Props = {
  scope: DataScope;
  theme: string;
  trashRetentionDays: number;
  auditRetentionDays: number;
};

function applyTheme(theme: ThemeValue): void {
  document.cookie = `theme=${theme};path=/;max-age=31536000;SameSite=Lax`;
  const prefersDark = window.matchMedia("(prefers-color-scheme:dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
}

function SettingsSelectRow({
  id,
  name,
  label,
  description,
  icon,
  defaultValue,
  options,
}: {
  id: string;
  name: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultValue: string | number;
  options: SelectOption[];
}) {
  return (
    <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-200">
          {icon}
          <label htmlFor={id}>{label}</label>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="relative">
        <select
          id={id}
          name={name}
          defaultValue={defaultValue}
          className="peer w-full appearance-none rounded border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:hover:border-slate-500 dark:focus:border-slate-400 dark:focus:ring-slate-700"
        >
          {options.map((option) => (
            <option key={`${name}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition peer-focus:text-slate-600" />
      </div>
    </div>
  );
}

export function SettingsFormClient({ scope, theme, trashRetentionDays, auditRetentionDays }: Props) {
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSaving(true);

      const formData = new FormData(e.currentTarget);
      const rawTheme = String(formData.get("theme") ?? "");

      // 主题变更即时生效
      if (rawTheme === "light" || rawTheme === "dark" || rawTheme === "system") {
        applyTheme(rawTheme);
      }

      try {
        await updateSettingsAction(scope, formData);
      } finally {
        setSaving(false);
      }
    },
    [scope],
  );

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="overflow-hidden rounded border border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-800/50">
      <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-700/40">
        <SettingsSelectRow
          id="theme"
          name="theme"
          label="主题"
          description="可选择浅色、深色或自动跟随系统。"
          icon={<PaletteIcon />}
          defaultValue={theme}
          options={[
            { value: "system", label: "跟随系统" },
            { value: "light", label: "浅色" },
            { value: "dark", label: "深色" },
          ]}
        />

        <SettingsSelectRow
          id="trashRetentionDays"
          name="trashRetentionDays"
          label="回收站保留天数"
          description="超过保留期的回收站数据将自动清理。"
          icon={<TrashIcon />}
          defaultValue={trashRetentionDays}
          options={[
            { value: 7, label: "7 天" },
            { value: 30, label: "30 天" },
            { value: 90, label: "90 天" },
            { value: 3650, label: "永久保留" },
          ]}
        />

        <SettingsSelectRow
          id="auditRetentionDays"
          name="auditRetentionDays"
          label="审计日志保留天数"
          description="保留关键操作记录，便于排查和审计。"
          icon={<AuditIcon />}
          defaultValue={auditRetentionDays}
          options={[
            { value: 30, label: "30 天" },
            { value: 90, label: "90 天" },
            { value: 180, label: "180 天" },
            { value: 365, label: "365 天" },
          ]}
        />
      </div>

      <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700/50 dark:bg-slate-700/40">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
        >
          {saving ? "保存中..." : "保存设置"}
        </button>
      </div>
    </form>
  );
}

function PaletteIcon() {
  return (
    <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="0.5" />
      <circle cx="17.5" cy="10.5" r="0.5" />
      <circle cx="8.5" cy="7.5" r="0.5" />
      <circle cx="6.5" cy="12.5" r="0.5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c3.86 0 7-3.14 7-7 0-5.5-4.5-10-10-10z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}