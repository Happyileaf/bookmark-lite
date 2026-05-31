import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { ManageTrashView } from "@/components/trash/manage-trash-view";
import { requireSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function UserTrashPage() {
  const user = await requireSessionUser();
  return (
    <ManageSceneShell scope="USER" current="trash">
      <ManageTrashView scope="USER" user={user} />
    </ManageSceneShell>
  );
}
