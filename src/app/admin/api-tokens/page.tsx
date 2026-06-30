import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { ApiTokenView } from "@/components/api-token/api-token-view";
import { requireSuperAdmin } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminApiTokensPage() {
  const user = await requireSuperAdmin();
  return (
    <ManageSceneShell scope="APP" current="extension">
      <ApiTokenView user={user} />
    </ManageSceneShell>
  );
}
