import type { DataScope } from "@prisma/client";
import { Palette, Save, ShieldCheck, Trash2 } from "lucide-react";
import { updateSettingsAction } from "@/actions/settings.actions";
import { SettingsSelectRow } from "@/components/settings/settings-select-row";
import type { SessionUser } from "@/server/auth/session";
import { settingsService } from "@/server/services/settings.service";

type Props = {
  scope: DataScope;
  user: SessionUser | null;
};

export async function SettingsView({ scope, user }: Props) {
  const settings = await settingsService.get(scope, user);
  const scopeLabel = scope === "APP" ? "全局设置" : "个人设置";

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">{scopeLabel}</h1>
        <p className="text-sm text-slate-600">
          调整主题和数据保留策略，保存后立即生效。
        </p>
      </header>

      <form
        action={updateSettingsAction.bind(null, scope)}
        className="overflow-hidden rounded border border-slate-200 bg-white"
      >
        <div className="space-y-0 divide-y divide-slate-100">
          <SettingsSelectRow
            id="theme"
            name="theme"
            label="主题"
            description="可选择浅色、深色或自动跟随系统。"
            icon={<Palette className="h-4 w-4 text-slate-500" />}
            defaultValue={settings.theme}
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
            icon={<Trash2 className="h-4 w-4 text-slate-500" />}
            defaultValue={settings.trashRetentionDays}
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
            icon={<ShieldCheck className="h-4 w-4 text-slate-500" />}
            defaultValue={settings.auditRetentionDays}
            options={[
              { value: 30, label: "30 天" },
              { value: 90, label: "90 天" },
              { value: 180, label: "180 天" },
              { value: 365, label: "365 天" },
            ]}
          />
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800"
          >
            <Save className="h-4 w-4" />
            保存设置
          </button>
        </div>
      </form>
    </section>
  );
}
