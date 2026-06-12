import type { DataScope } from "@prisma/client";
import { SettingsFormClient } from "@/components/settings/settings-form.client";
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
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{scopeLabel}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          调整主题和数据保留策略，保存后立即生效。
        </p>
      </header>

      <SettingsFormClient
        scope={scope}
        theme={settings.theme}
        trashRetentionDays={settings.trashRetentionDays}
        auditRetentionDays={settings.auditRetentionDays}
      />
    </section>
  );
}
