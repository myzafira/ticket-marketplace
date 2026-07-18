import { db } from "@/lib/db";

// Order has no denormalized sellerId (only via listing.sellerId), so this
// pulls completed orders for the given sellers and tallies them in memory —
// fine at this app's scale, same tradeoff as the ratings batch queries.
export async function getSalesCounts(
  sellerIds: string[]
): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(sellerIds)];
  const map = new Map<string, number>();
  for (const id of uniqueIds) map.set(id, 0);
  if (uniqueIds.length === 0) return map;

  const orders = await db.order.findMany({
    where: { status: "COMPLETED", listing: { sellerId: { in: uniqueIds } } },
    select: { listing: { select: { sellerId: true } } },
  });
  for (const order of orders) {
    map.set(order.listing.sellerId, (map.get(order.listing.sellerId) ?? 0) + 1);
  }
  return map;
}

// Total "unfair price" reports filed against any of the seller's listings
// (any status) — used to flag repeat offenders for admin review.
export async function getListingReportCounts(
  sellerIds: string[]
): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(sellerIds)];
  const map = new Map<string, number>();
  for (const id of uniqueIds) map.set(id, 0);
  if (uniqueIds.length === 0) return map;

  const reports = await db.listingReport.findMany({
    where: { listing: { sellerId: { in: uniqueIds } } },
    select: { listing: { select: { sellerId: true } } },
  });
  for (const report of reports) {
    map.set(report.listing.sellerId, (map.get(report.listing.sellerId) ?? 0) + 1);
  }
  return map;
}

export async function getPurchaseCounts(
  buyerIds: string[]
): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(buyerIds)];
  const map = new Map<string, number>();
  for (const id of uniqueIds) map.set(id, 0);
  if (uniqueIds.length === 0) return map;

  const grouped = await db.order.groupBy({
    by: ["buyerId"],
    where: { status: "COMPLETED", buyerId: { in: uniqueIds } },
    _count: true,
  });
  for (const g of grouped) map.set(g.buyerId, g._count);
  return map;
}
