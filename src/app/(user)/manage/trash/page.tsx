import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { ManageTrashView } from "@/components/trash/manage-trash-view";
import { requireSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UserTrashPage({ searchParams }: PageProps) {
  const [query, user] = await Promise.all([searchParams, requireSessionUser()]);
  return (
    <ManageSceneShell scope="USER" current="trash">
      <ManageTrashView scope="USER" user={user} searchParams={query} />
    </ManageSceneShell>
  );
}
