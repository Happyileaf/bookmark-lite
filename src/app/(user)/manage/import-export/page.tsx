import { ManageImportExportView } from "@/components/import-export/manage-import-export-view";
import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { requireSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function UserImportExportPage() {
  await requireSessionUser();
  return (
    <ManageSceneShell scope="USER" current="import-export">
      <ManageImportExportView scope="USER" />
    </ManageSceneShell>
  );
}
