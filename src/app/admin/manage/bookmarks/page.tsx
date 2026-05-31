import { ManageBookmarksView } from "@/components/bookmark/manage-bookmarks-view";
import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { requireSuperAdmin } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminManageBookmarksPage({ searchParams }: PageProps) {
  const [query, user] = await Promise.all([searchParams, requireSuperAdmin()]);
  return (
    <ManageSceneShell scope="APP" current="bookmarks">
      <ManageBookmarksView scope="APP" user={user} searchParams={query} />
    </ManageSceneShell>
  );
}
