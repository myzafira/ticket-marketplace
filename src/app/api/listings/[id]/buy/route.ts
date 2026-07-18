import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isFullyVerified } from "@/lib/auth";
import { buildFeeTiers, calculatePlatformFeeCents } from "@/lib/fees";
import { getPlatformSettings } from "@/lib/settings";
import { getSalesCounts } from "@/lib/sellerStats";

// Stub checkout: no real payment processor is wired up yet.
// This immediately marks the listing sold and records a completed order.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isFullyVerified(user)) {
    return NextResponse.json(
      { error: "Verify your email before buying a ticket" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const listing = await db.listing.findUnique({
    where: { id },
    include: { seller: { select: { identityVerifiedAt: true, pointsBalance: true } } },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.sellerId === user.id) {
    return NextResponse.json(
      { error: "You cannot buy your own listing" },
      { status: 400 }
    );
  }
  if (listing.status !== "ACTIVE" || listing.eventDate < new Date()) {
    return NextResponse.json(
      { error: "This listing is no longer available" },
      { status: 409 }
    );
  }

  const settings = await getPlatformSettings();
  const feeTiers = buildFeeTiers(settings);

  // Verified sellers with a proven track record pay a reduced platform fee
  // as a loyalty perk — the discount is locked in at purchase time so past
  // receipts stay accurate even if the seller's status changes later.
  const salesCounts = await getSalesCounts([listing.sellerId]);
  const sellerQualifiesForDiscount =
    Boolean(listing.seller.identityVerifiedAt) &&
    (salesCounts.get(listing.sellerId) ?? 0) >= settings.trustedSellerMinSales;
  const feeDiscountPercent = sellerQualifiesForDiscount
    ? settings.trustedSellerFeeDiscountPercent
    : 0;

  try {
    const order = await db.$transaction(async (tx) => {
      const updated = await tx.listing.updateMany({
        where: { id, status: "ACTIVE" },
        data: { status: "SOLD" },
      });
      if (updated.count === 0) {
        throw new Error("SOLD_OUT");
      }

      const totalCents = listing.priceCents * listing.quantity;
      const baseFeeCents = calculatePlatformFeeCents(feeTiers, totalCents);
      const feeAfterTrustDiscountCents = Math.round(
        (baseFeeCents * (100 - feeDiscountPercent)) / 100
      );

      // Both parties earn loyalty points on the sale amount; the seller's
      // existing balance (earned from past orders) then auto-redeems against
      // this sale's fee, capped so the fee can't go negative.
      const pointsEarnedByBuyer = Math.round(
        (totalCents * settings.pointsEarnRatePercent) / 100
      );
      const pointsEarnedBySeller = pointsEarnedByBuyer;
      const pointsRedeemedBySeller = Math.min(
        listing.seller.pointsBalance,
        feeAfterTrustDiscountCents
      );
      const platformFeeCents = feeAfterTrustDiscountCents - pointsRedeemedBySeller;
      const sellerPayoutCents = totalCents - platformFeeCents;

      const createdOrder = await tx.order.create({
        data: {
          listingId: id,
          buyerId: user.id,
          totalCents,
          platformFeeCents,
          sellerPayoutCents,
          feeDiscountPercent,
          pointsEarnedByBuyer,
          pointsEarnedBySeller,
          pointsRedeemedBySeller,
          status: "COMPLETED",
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { pointsBalance: { increment: pointsEarnedByBuyer } },
      });
      await tx.user.update({
        where: { id: listing.sellerId },
        data: {
          pointsBalance: { increment: pointsEarnedBySeller - pointsRedeemedBySeller },
        },
      });
      await tx.pointsTransaction.createMany({
        data: [
          {
            userId: user.id,
            amount: pointsEarnedByBuyer,
            reason: "EARNED_PURCHASE",
            orderId: createdOrder.id,
          },
          {
            userId: listing.sellerId,
            amount: pointsEarnedBySeller,
            reason: "EARNED_SALE",
            orderId: createdOrder.id,
          },
          ...(pointsRedeemedBySeller > 0
            ? [
                {
                  userId: listing.sellerId,
                  amount: -pointsRedeemedBySeller,
                  reason: "REDEEMED_FEE_DISCOUNT" as const,
                  orderId: createdOrder.id,
                },
              ]
            : []),
        ],
      });

      // Only auto-close the request if the buyer completing this purchase is
      // the same person who posted it — someone else buying the listing
      // doesn't mean the original requester got their ticket.
      if (listing.fulfillsRequestId) {
        await tx.buyRequest.updateMany({
          where: {
            id: listing.fulfillsRequestId,
            status: "OPEN",
            buyerId: user.id,
          },
          data: { status: "FULFILLED" },
        });
      }

      return createdOrder;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "This listing is no longer available" },
      { status: 409 }
    );
  }
}
