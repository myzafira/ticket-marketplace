import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/settings";
import { getListingReportCounts } from "@/lib/sellerStats";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getPlatformSettings();

  const reportedSellers = await db.listing.findMany({
    where: { reports: { some: {} } },
    select: { sellerId: true },
    distinct: ["sellerId"],
  });
  const sellerIds = reportedSellers.map((l) => l.sellerId);
  const reportCounts = await getListingReportCounts(sellerIds);

  const flaggedIds = sellerIds.filter(
    (id) => (reportCounts.get(id) ?? 0) >= settings.sellerReportWarningThreshold
  );
  if (flaggedIds.length === 0) {
    return NextResponse.json({ sellers: [] });
  }

  const sellers = await db.user.findMany({
    where: { id: { in: flaggedIds } },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      listingRestrictedAt: true,
    },
  });

  return NextResponse.json({
    sellers: sellers
      .map((s) => ({ ...s, listingReportCount: reportCounts.get(s.id) ?? 0 }))
      .sort((a, b) => b.listingReportCount - a.listingReportCount),
  });
}
