import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { ManageTagsView } from "@/components/tag/manage-tags-view";
import { requireSuperAdmin } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminManageTagsPage() {
  const user = await requireSuperAdmin();
  return (
    <ManageSceneShell scope="APP" current="tags">
      <ManageTagsView scope="APP" user={user} />
    </ManageSceneShell>
  );
}
