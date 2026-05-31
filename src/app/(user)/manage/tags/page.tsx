import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { ManageTagsView } from "@/components/tag/manage-tags-view";
import { requireSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function UserManageTagsPage() {
  const user = await requireSessionUser();
  return (
    <ManageSceneShell scope="USER" current="tags">
      <ManageTagsView scope="USER" user={user} />
    </ManageSceneShell>
  );
}
