import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toPublicHandle } from "@/lib/identity";
import { getRatingSummary, getRecentReviews } from "@/lib/ratings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listing = await db.listing.findUnique({
    where: { id },
    include: { seller: { select: { id: true, nickname: true } } },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const [rating, recentReviews] = await Promise.all([
    getRatingSummary(listing.seller.id),
    getRecentReviews(listing.seller.id),
  ]);

  return NextResponse.json({
    listing: {
      ...listing,
      seller: {
        handle: toPublicHandle(listing.seller),
        rating,
        recentReviews: recentReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          reviewer: { handle: toPublicHandle(r.reviewer) },
        })),
      },
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const listing = await db.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.sellerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (listing.status === "SOLD") {
    return NextResponse.json(
      { error: "Cannot cancel a sold listing" },
      { status: 409 }
    );
  }

  await db.listing.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
