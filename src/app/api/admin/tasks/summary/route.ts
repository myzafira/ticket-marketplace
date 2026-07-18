import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/settings";
import { getListingReportCounts } from "@/lib/sellerStats";

// Lightweight counts (not full records) so the main admin dashboard can show
// "N tasks need attention" and link into /admin/tasks without loading every
// open item's full detail up front.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getPlatformSettings();

  const [openOrderReports, openListingReports, unreadMatches, reportedSellers] =
    await Promise.all([
      db.orderReport.count({ where: { status: "OPEN" } }),
      db.listingReport.count({ where: { status: "OPEN" } }),
      db.adminNotification.count({ where: { readAt: null } }),
      db.listing.findMany({
        where: { reports: { some: {} } },
        select: { sellerId: true },
        distinct: ["sellerId"],
      }),
    ]);

  const sellerIds = reportedSellers.map((l) => l.sellerId);
  const reportCounts = await getListingReportCounts(sellerIds);
  const flaggedSellers = sellerIds.filter(
    (id) => (reportCounts.get(id) ?? 0) >= settings.sellerReportWarningThreshold
  ).length;

  const total = openOrderReports + openListingReports + unreadMatches + flaggedSellers;

  return NextResponse.json({
    openOrderReports,
    openListingReports,
    unreadMatches,
    flaggedSellers,
    total,
  });
}
