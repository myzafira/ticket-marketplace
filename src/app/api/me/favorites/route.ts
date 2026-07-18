import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toPublicHandle } from "@/lib/identity";
import { getRatingSummaries } from "@/lib/ratings";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const favorites = await db.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: { seller: { select: { id: true, nickname: true } } },
      },
    },
  });

  const listings = favorites.map((f) => f.listing);
  const ratings = await getRatingSummaries(listings.map((l) => l.seller.id));

  return NextResponse.json({
    listings: listings.map((l) => ({
      ...l,
      seller: {
        handle: toPublicHandle(l.seller),
        rating: ratings.get(l.seller.id) ?? { average: null, count: 0 },
      },
      isFavorited: true,
    })),
  });
}
