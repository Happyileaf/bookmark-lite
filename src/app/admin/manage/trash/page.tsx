import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { ManageTrashView } from "@/components/trash/manage-trash-view";
import { requireSuperAdmin } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminTrashPage() {
  const user = await requireSuperAdmin();
  return (
    <ManageSceneShell scope="APP" current="trash">
      <ManageTrashView scope="APP" user={user} />
    </ManageSceneShell>
  );
}
