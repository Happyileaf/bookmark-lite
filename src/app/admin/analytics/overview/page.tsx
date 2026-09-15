import OverviewView from "@/components/analytics/overview-view";
import { ManageSceneShell } from "@/components/layout/manage-scene-shell";
import { requireSuperAdmin } from "@/server/auth/session";
import { analyticsService } from "@/server/services/analytics.service";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsOverviewPage() {
  const [, overview] = await Promise.all([
    requireSuperAdmin(),
    analyticsService.getOverview(),
  ]);

  return (
    <ManageSceneShell scope="APP" current="analytics">
      <OverviewView overview={overview} />
    </ManageSceneShell>
  );
}
