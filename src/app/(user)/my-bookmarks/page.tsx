import { DisplayBookmarksView } from "@/components/bookmark/display-bookmarks-view";
import { requireSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MyBookmarksPage({ searchParams }: PageProps) {
  const [query, user] = await Promise.all([searchParams, requireSessionUser()]);
  return <DisplayBookmarksView scope="USER" user={user} searchParams={query} />;
}
