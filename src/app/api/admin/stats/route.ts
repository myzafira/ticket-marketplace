import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildFeeTiers, getFeeTier } from "@/lib/fees";
import { getPlatformSettings } from "@/lib/settings";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getPlatformSettings();
  const feeTiers = buildFeeTiers(settings);

  const [totals, activeListingCount, allCompletedOrders, recentOrders] = await Promise.all([
    db.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { totalCents: true, platformFeeCents: true, sellerPayoutCents: true },
      _count: true,
    }),
    db.listing.count({ where: { status: "ACTIVE" } }),
    db.order.findMany({
      where: { status: "COMPLETED" },
      select: { totalCents: true, platformFeeCents: true },
    }),
    db.order.findMany({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        listing: { select: { eventName: true, seller: { select: { name: true } } } },
        buyer: { select: { name: true } },
      },
    }),
  ]);

  const tierBreakdown = feeTiers.map((tier) => ({ label: tier.label, rate: tier.rate, orderCount: 0, feeCents: 0 }));
  for (const order of allCompletedOrders) {
    const tier = getFeeTier(feeTiers, order.totalCents);
    const bucket = tierBreakdown.find((t) => t.label === tier.label)!;
    bucket.orderCount += 1;
    bucket.feeCents += order.platformFeeCents;
  }

  return NextResponse.json({
    totalOrders: totals._count,
    grossVolumeCents: totals._sum.totalCents ?? 0,
    platformFeeCents: totals._sum.platformFeeCents ?? 0,
    sellerPayoutCents: totals._sum.sellerPayoutCents ?? 0,
    activeListingCount,
    tierBreakdown,
    recentOrders,
  });
}
