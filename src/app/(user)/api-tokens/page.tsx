import { redirect } from "next/navigation";
import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { ApiTokenView } from "@/components/api-token/api-token-view";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function ApiTokensPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <ManageSceneShell scope="USER" current="extension">
      <ApiTokenView user={user} />
    </ManageSceneShell>
  );
}
