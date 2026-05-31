import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { SettingsView } from "@/components/settings/settings-view";
import { requireSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function UserSettingsPage() {
  const user = await requireSessionUser();
  return (
    <ManageSceneShell scope="USER" current="settings">
      <SettingsView scope="USER" user={user} />
    </ManageSceneShell>
  );
}
