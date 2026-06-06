import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { ManageTagsView } from "@/components/tag/manage-tags-view";
import { requireSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UserManageTagsPage({ searchParams }: PageProps) {
  const [query, user] = await Promise.all([searchParams, requireSessionUser()]);
  return (
    <ManageSceneShell scope="USER" current="tags">
      <ManageTagsView scope="USER" user={user} searchParams={query} />
    </ManageSceneShell>
  );
}
