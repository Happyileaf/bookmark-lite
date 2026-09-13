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
    <div className="max-w-3xl">
      <header>
        <h1 className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {scopeLabel}
        </h1>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          管理你的账号信息与使用偏好。
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
