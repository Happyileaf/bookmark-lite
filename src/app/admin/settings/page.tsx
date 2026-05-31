import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { SettingsView } from "@/components/settings/settings-view";
import { requireSuperAdmin } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await requireSuperAdmin();
  return (
    <ManageSceneShell scope="APP" current="settings">
      <SettingsView scope="APP" user={user} />
    </ManageSceneShell>
  );
}
