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
  const scopeLabel = scope === "APP" ? "平台设置" : "个人设置";
  /** 页面描述文案：平台设置仅管理全站数据偏好，不包含账号信息。 */
  const scopeDescription =
    scope === "APP"
      ? "管理全站的显示偏好与数据保留周期。"
      : "把 Bookmark Lite 调成你顺手的样子。";

  return (
    <div className="max-w-3xl">
      <header>
        <h1 className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {scopeLabel}
        </h1>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          {scopeDescription}
        </p>
      </header>

      <div className="mt-5">
        <SettingsFormClient
          scope={scope}
          theme={settings.theme}
          trashRetentionDays={settings.trashRetentionDays}
          auditRetentionDays={settings.auditRetentionDays}
          userName={user?.name ?? null}
          userEmail={user?.email ?? null}
        />
      </div>
    </div>
  );
}
