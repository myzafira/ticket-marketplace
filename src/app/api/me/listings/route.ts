import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toPublicHandle } from "@/lib/identity";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const listings = await db.listing.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { order: { include: { buyer: { select: { id: true } } } } },
  });

  return NextResponse.json({
    listings: listings.map((l) => ({
      ...l,
      order: l.order
        ? { ...l.order, buyer: { handle: toPublicHandle(l.order.buyer.id) } }
        : null,
    })),
  });
}
