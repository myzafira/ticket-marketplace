import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Lets the sell form show "similar tickets for this event go for ~฿X" so
// sellers can price fairly and buyers can spot outliers — matched on exact
// (case-insensitive) event name across active + sold listings.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventName = searchParams.get("eventName")?.trim();
  if (!eventName) {
    return NextResponse.json({ count: 0 });
  }

  const listings = await db.listing.findMany({
    where: {
      eventName: { equals: eventName, mode: "insensitive" },
      status: { in: ["ACTIVE", "SOLD"] },
    },
    select: { priceCents: true, faceValueCents: true },
  });

  if (listings.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  const prices = listings.map((l) => l.priceCents);
  const averageCents = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const minCents = Math.min(...prices);
  const maxCents = Math.max(...prices);

  const faceValues = listings
    .map((l) => l.faceValueCents)
    .filter((v): v is number => v !== null);
  const averageFaceValueCents =
    faceValues.length > 0
      ? Math.round(faceValues.reduce((a, b) => a + b, 0) / faceValues.length)
      : null;

  return NextResponse.json({
    count: listings.length,
    averageCents,
    minCents,
    maxCents,
    averageFaceValueCents,
  });
}
