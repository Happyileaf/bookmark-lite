import { ManageBookmarksView } from "@/components/bookmark/manage-bookmarks-view";
import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { requireSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UserManageBookmarksPage({ searchParams }: PageProps) {
  const [query, user] = await Promise.all([searchParams, requireSessionUser()]);
  return (
    <ManageSceneShell scope="USER" current="bookmarks">
      <ManageBookmarksView scope="USER" user={user} searchParams={query} />
    </ManageSceneShell>
  );
}
