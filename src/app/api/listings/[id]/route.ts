import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toPublicHandle } from "@/lib/identity";
import { getRatingSummary, getRecentReviews } from "@/lib/ratings";
import { getSalesCounts } from "@/lib/sellerStats";
import { canAccessListing } from "@/lib/vipAccess";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, nickname: true, identityVerifiedAt: true } },
    },
  });

  if (!listing || !canAccessListing(listing, currentUser)) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const [rating, recentReviews, favorite, salesCounts, myReport] = await Promise.all([
    getRatingSummary(listing.seller.id),
    getRecentReviews(listing.seller.id),
    currentUser
      ? db.favorite.findUnique({
          where: { userId_listingId: { userId: currentUser.id, listingId: id } },
        })
      : Promise.resolve(null),
    getSalesCounts([listing.seller.id]),
    currentUser
      ? db.listingReport.findFirst({
          where: { listingId: id, reporterId: currentUser.id },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve(null),
  ]);

  return NextResponse.json({
    listing: {
      ...listing,
      seller: {
        handle: toPublicHandle(listing.seller),
        rating,
        isVerified: Boolean(listing.seller.identityVerifiedAt),
        salesCount: salesCounts.get(listing.seller.id) ?? 0,
        recentReviews: recentReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          reviewer: { handle: toPublicHandle(r.reviewer) },
        })),
      },
      isFavorited: Boolean(favorite),
      myReport: myReport ? { id: myReport.id, status: myReport.status } : null,
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
