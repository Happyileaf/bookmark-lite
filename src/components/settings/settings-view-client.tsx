"use client";

import { useTheme } from "next-themes";
import { useTransition } from "react";
import { ChevronDown, Palette, Save, ShieldCheck, Trash2 } from "lucide-react";
import { updateSettingsAction } from "@/actions/settings.actions";
import type { DataScope } from "@prisma/client";

type Props = {
  scope: DataScope;
  currentTheme: "light" | "dark" | "system";
  trashRetentionDays: number;
  auditRetentionDays: number;
};

export function SettingsViewClient({ scope, currentTheme, trashRetentionDays, auditRetentionDays }: Props) {
  const { setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const handleThemeChange = (value: string) => {
    setTheme(value);
  };

  const handleFormSubmit = (formData: FormData) => {
    startTransition(async () => {
      await updateSettingsAction(scope, formData);
    });
  };

  const scopeLabel = scope === "APP" ? "全局设置" : "个人设置";

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{scopeLabel}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          调整主题和数据保留策略，保存后立即生效。
        </p>
      </header>

      <form
        action={handleFormSubmit}
        className="overflow-hidden rounded border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-700">
          <SettingsSelectRow
            id="theme"
            name="theme"
            label="主题"
            description="可选择浅色、深色或自动跟随系统。"
            icon={<Palette className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
            defaultValue={currentTheme}
            onChange={handleThemeChange}
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
            icon={<Trash2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
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
            icon={<ShieldCheck className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
            defaultValue={auditRetentionDays}
            options={[
              { value: 30, label: "30 天" },
              { value: 90, label: "90 天" },
              { value: 180, label: "180 天" },
              { value: 365, label: "365 天" },
            ]}
          />
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Save className="h-4 w-4" />
            保存设置
          </button>
        </div>
      </form>
    </section>
  );
}

type SelectOption = {
  value: string | number;
  label: string;
};

type SettingsSelectRowProps = {
  id: string;
  name: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultValue: string | number;
  options: SelectOption[];
  onChange?: (value: string) => void;
};

function SettingsSelectRow({
  id,
  name,
  label,
  description,
  icon,
  defaultValue,
  options,
  onChange,
}: SettingsSelectRowProps) {
  return (
    <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
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
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className="peer w-full appearance-none rounded border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-slate-400 dark:focus:ring-slate-600"
        >
          {options.map((option) => (
            <option key={`${name}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition peer-focus:text-slate-600 dark:text-slate-500 dark:peer-focus:text-slate-300" />
      </div>
    </div>
  );
}