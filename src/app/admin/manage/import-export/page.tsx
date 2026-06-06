import { ManageImportExportView } from "@/components/import-export/manage-import-export-view";
import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { requireSuperAdmin } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminImportExportPage() {
  await requireSuperAdmin();
  return (
    <ManageSceneShell scope="APP" current="import-export">
      <ManageImportExportView scope="APP" />
    </ManageSceneShell>
  );
}
