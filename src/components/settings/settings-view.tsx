import type { DataScope } from "@prisma/client";
import { SettingsFormClient } from "@/components/settings/settings-form.client";
import { ApiTokenSection } from "@/components/settings/api-token-section.client";
import type { SessionUser } from "@/server/auth/session";
import { settingsService } from "@/server/services/settings.service";
import { apiTokenService } from "@/server/services/api-token.service";

type Props = {
  scope: DataScope;
  user: SessionUser | null;
};

export async function SettingsView({ scope, user }: Props) {
  const settings = await settingsService.get(scope, user);
  const scopeLabel = scope === "APP" ? "全局设置" : "个人设置";

  // API Token 管理仅对登录用户（USER scope）开放
  const tokens =
    scope === "USER" && user
      ? (await apiTokenService.list(user)).map((t) => ({
          id: t.id,
          name: t.name,
          tokenPrefix: t.tokenPrefix,
          lastUsedAt: t.lastUsedAt ? t.lastUsedAt.toISOString() : null,
          createdAt: t.createdAt.toISOString(),
        }))
      : [];

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-200">{scopeLabel}</h1>
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

      {scope === "USER" && user && <ApiTokenSection tokens={tokens} />}
    </section>
  );
}
