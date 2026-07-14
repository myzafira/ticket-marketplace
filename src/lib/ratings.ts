import { db } from "@/lib/db";

export type RatingSummary = { average: number | null; count: number };

// Batch version for list endpoints (browse pages) — one query instead of N.
export async function getRatingSummaries(
  userIds: string[]
): Promise<Map<string, RatingSummary>> {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return new Map();

  const grouped = await db.review.groupBy({
    by: ["revieweeId"],
    where: { revieweeId: { in: uniqueIds } },
    _avg: { rating: true },
    _count: true,
  });

  const map = new Map<string, RatingSummary>();
  for (const id of uniqueIds) {
    map.set(id, { average: null, count: 0 });
  }
  for (const g of grouped) {
    map.set(g.revieweeId, { average: g._avg.rating, count: g._count });
  }
  return map;
}

export async function getRatingSummary(userId: string): Promise<RatingSummary> {
  const result = await db.review.aggregate({
    where: { revieweeId: userId },
    _avg: { rating: true },
    _count: true,
  });
  return { average: result._avg.rating, count: result._count };
}

export async function getRecentReviews(userId: string, limit = 5) {
  const reviews = await db.review.findMany({
    where: { revieweeId: userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { reviewer: { select: { id: true, nickname: true } } },
  });
  return reviews;
}
