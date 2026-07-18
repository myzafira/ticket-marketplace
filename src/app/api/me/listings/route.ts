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
    include: {
      order: {
        include: {
          buyer: { select: { id: true, nickname: true } },
          reviews: { where: { reviewerId: user.id } },
          reports: { where: { reporterId: user.id }, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  return NextResponse.json({
    listings: listings.map((l) => {
      if (!l.order) return { ...l, order: null };
      const { reviews, reports, ...order } = l.order;
      return {
        ...l,
        order: {
          ...order,
          buyer: { handle: toPublicHandle(l.order.buyer) },
          myReview: reviews[0]
            ? { rating: reviews[0].rating, comment: reviews[0].comment }
            : null,
          myReport: reports[0]
            ? { id: reports[0].id, status: reports[0].status }
            : null,
        },
      };
    }),
  });
}
