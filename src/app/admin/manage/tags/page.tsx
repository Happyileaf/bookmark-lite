import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { ManageTagsView } from "@/components/tag/manage-tags-view";
import { requireSuperAdmin } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminManageTagsPage({ searchParams }: PageProps) {
  const [query, user] = await Promise.all([searchParams, requireSuperAdmin()]);
  return (
    <ManageSceneShell scope="APP" current="tags">
      <ManageTagsView scope="APP" user={user} searchParams={query} />
    </ManageSceneShell>
  );
}
