import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isFullyVerified } from "@/lib/auth";
import { buildFeeTiers, calculatePlatformFeeCents } from "@/lib/fees";
import { getPlatformSettings } from "@/lib/settings";
import { getSalesCounts } from "@/lib/sellerStats";
import { canAccessListing } from "@/lib/vipAccess";

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
    include: { seller: { select: { identityVerifiedAt: true } } },
  });

  if (!listing || !canAccessListing(listing, user)) {
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

  // VIP perk: an additional fee discount that stacks (compounds) with the
  // trusted-seller discount above, also locked in at purchase time.
  const vipFeeDiscountPercent =
    user.role === "VIP_USER" ? settings.vipFeeDiscountPercent : 0;

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
      // Trust and VIP discounts compound (like stacked coupons) rather than
      // summing, so neither can push the combined discount past 100%.
      const feeAfterDiscountsCents = Math.round(
        baseFeeCents *
          ((100 - feeDiscountPercent) / 100) *
          ((100 - vipFeeDiscountPercent) / 100)
      );

      // Both parties earn loyalty points on the sale amount; the seller's
      // existing balance (earned from past orders) then auto-redeems against
      // this sale's fee, capped so the fee can't go negative. Read the
      // balance fresh inside the transaction (not the pre-transaction
      // `listing` fetch) so a concurrent purchase of another of this
      // seller's listings can't redeem against the same stale balance.
      const sellerForPoints = await tx.user.findUnique({
        where: { id: listing.sellerId },
        select: { pointsBalance: true },
      });
      const pointsEarnedByBuyer = Math.round(
        (totalCents * settings.pointsEarnRatePercent) / 100
      );
      const pointsEarnedBySeller = pointsEarnedByBuyer;
      const pointsRedeemedBySeller = Math.min(
        sellerForPoints?.pointsBalance ?? 0,
        feeAfterDiscountsCents
      );
      const platformFeeCents = feeAfterDiscountsCents - pointsRedeemedBySeller;
      const sellerPayoutCents = totalCents - platformFeeCents;

      const createdOrder = await tx.order.create({
        data: {
          listingId: id,
          buyerId: user.id,
          totalCents,
          platformFeeCents,
          sellerPayoutCents,
          feeDiscountPercent,
          vipFeeDiscountPercent,
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

      // Guarded decrement: only succeeds if the balance is still at least
      // what we're redeeming, so a concurrent sale can't double-spend the
      // same points. Redemption and this sale's earnings are applied as
      // two separate writes rather than one combined increment.
      if (pointsRedeemedBySeller > 0) {
        const redeemed = await tx.user.updateMany({
          where: { id: listing.sellerId, pointsBalance: { gte: pointsRedeemedBySeller } },
          data: { pointsBalance: { decrement: pointsRedeemedBySeller } },
        });
        if (redeemed.count === 0) {
          throw new Error("POINTS_RACE");
        }
      }
      await tx.user.update({
        where: { id: listing.sellerId },
        data: { pointsBalance: { increment: pointsEarnedBySeller } },
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
