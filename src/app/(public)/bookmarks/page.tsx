import { DisplayBookmarksView } from "@/components/bookmark/display-bookmarks-view";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PublicBookmarksPage({ searchParams }: PageProps) {
  const [query, user] = await Promise.all([searchParams, getSessionUser()]);
  return <DisplayBookmarksView scope="APP" user={user} searchParams={query} />;
}
