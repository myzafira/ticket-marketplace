import { db } from "@/lib/db";

type ListingCandidate = {
  eventName: string;
  venue: string;
  eventDate: Date;
  priceCents: number;
  quantity: number;
};

// Finds the oldest still-open buy request a newly created listing satisfies,
// so sellers don't have to know a matching request exists to trigger the
// same match flow as the explicit "I have this ticket" button.
export async function findBestMatchingRequest(listing: ListingCandidate) {
  const startOfDay = new Date(listing.eventDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  const candidates = await db.buyRequest.findMany({
    where: {
      status: "OPEN",
      eventName: { equals: listing.eventName, mode: "insensitive" },
      eventDate: { gte: startOfDay, lt: endOfDay },
      maxPriceCents: { gte: listing.priceCents },
      quantity: { lte: listing.quantity },
    },
    orderBy: { createdAt: "asc" },
    include: {
      buyer: { select: { name: true, email: true, phoneNumber: true } },
    },
  });

  // A request without a venue is open to any venue for that event/date.
  return (
    candidates.find(
      (r) => !r.venue || r.venue.toLowerCase() === listing.venue.toLowerCase()
    ) ?? null
  );
}
