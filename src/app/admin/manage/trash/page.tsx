import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { ManageTrashView } from "@/components/trash/manage-trash-view";
import { requireSuperAdmin } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminTrashPage({ searchParams }: PageProps) {
  const [query, user] = await Promise.all([searchParams, requireSuperAdmin()]);
  return (
    <ManageSceneShell scope="APP" current="trash">
      <ManageTrashView scope="APP" user={user} searchParams={query} />
    </ManageSceneShell>
  );
}
