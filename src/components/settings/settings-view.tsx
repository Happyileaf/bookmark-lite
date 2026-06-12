import type { DataScope } from "@prisma/client";
import { SettingsViewClient } from "@/components/settings/settings-view-client";
import type { SessionUser } from "@/server/auth/session";
import { settingsService } from "@/server/services/settings.service";

type Props = {
  scope: DataScope;
  user: SessionUser | null;
};

export async function SettingsView({ scope, user }: Props) {
  const settings = await settingsService.get(scope, user);

  return (
    <SettingsViewClient
      scope={scope}
      currentTheme={settings.theme}
      trashRetentionDays={settings.trashRetentionDays}
      auditRetentionDays={settings.auditRetentionDays}
    />
  );
}