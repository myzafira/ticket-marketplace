import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isFullyVerified } from "@/lib/auth";
import { buildFeeTiers, calculatePlatformFeeCents } from "@/lib/fees";
import { getPlatformSettings } from "@/lib/settings";

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
      { error: "Verify your email and phone number before buying a ticket" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const listing = await db.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.sellerId === user.id) {
    return NextResponse.json(
      { error: "You cannot buy your own listing" },
      { status: 400 }
    );
  }
  if (listing.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "This listing is no longer available" },
      { status: 409 }
    );
  }

  const settings = await getPlatformSettings();
  const feeTiers = buildFeeTiers(settings);

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
      const platformFeeCents = calculatePlatformFeeCents(feeTiers, totalCents);
      const sellerPayoutCents = totalCents - platformFeeCents;

      const createdOrder = await tx.order.create({
        data: {
          listingId: id,
          buyerId: user.id,
          totalCents,
          platformFeeCents,
          sellerPayoutCents,
          status: "COMPLETED",
        },
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
