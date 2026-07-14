import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toPublicHandle } from "@/lib/identity";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const orders = await db.order.findMany({
    where: { buyerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { include: { seller: { select: { id: true } } } },
      reviews: { where: { reviewerId: user.id } },
    },
  });

  return NextResponse.json({
    orders: orders.map(({ reviews, ...o }) => ({
      ...o,
      listing: {
        ...o.listing,
        seller: { handle: toPublicHandle(o.listing.seller.id) },
      },
      myReview: reviews[0]
        ? { rating: reviews[0].rating, comment: reviews[0].comment }
        : null,
    })),
  });
}
