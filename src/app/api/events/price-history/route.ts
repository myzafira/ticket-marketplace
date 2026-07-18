import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Full price history for an event — every completed sale plus what's
// currently for sale — so buyers/sellers can see real transacted prices,
// not just current asking prices.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventName = searchParams.get("eventName")?.trim();
  if (!eventName) {
    return NextResponse.json({ error: "Missing eventName" }, { status: 400 });
  }

  const [soldOrders, activeListings] = await Promise.all([
    db.order.findMany({
      where: { status: "COMPLETED", listing: { eventName: { equals: eventName, mode: "insensitive" } } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        totalCents: true,
        createdAt: true,
        listing: { select: { quantity: true, venue: true, eventDate: true } },
      },
    }),
    db.listing.findMany({
      where: {
        eventName: { equals: eventName, mode: "insensitive" },
        status: "ACTIVE",
        eventDate: { gte: new Date() },
      },
      orderBy: { priceCents: "asc" },
      select: {
        id: true,
        priceCents: true,
        quantity: true,
        venue: true,
        eventDate: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    eventName,
    soldOrders: soldOrders.map((o) => ({
      id: o.id,
      priceCents: o.totalCents / o.listing.quantity,
      quantity: o.listing.quantity,
      venue: o.listing.venue,
      eventDate: o.listing.eventDate,
      soldAt: o.createdAt,
    })),
    activeListings,
  });
}
