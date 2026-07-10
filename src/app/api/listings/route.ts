import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, isFullyVerified } from "@/lib/auth";
import { bahtToCents } from "@/lib/format";
import { toPublicHandle } from "@/lib/identity";
import { checkListingFieldsForContactInfo } from "@/lib/moderation";
import { notifyAdminOfMatch, notifyPartiesOfMatch } from "@/lib/notifications";

const createListingSchema = z.object({
  title: z.string().min(1).max(150),
  eventName: z.string().min(1).max(150),
  venue: z.string().min(1).max(150),
  eventDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Invalid event date",
  }),
  section: z.string().max(100).optional(),
  quantity: z.number().int().min(1).max(20),
  price: z.number().positive(),
  description: z.string().max(2000).optional(),
  fulfillsRequestId: z.string().optional(),
  imageUrl: z.string().startsWith("/uploads/").optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const listings = await db.listing.findMany({
    where: {
      status: "ACTIVE",
      ...(q
        ? {
            OR: [
              { eventName: { contains: q } },
              { venue: { contains: q } },
              { title: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { eventDate: "asc" },
    include: { seller: { select: { id: true } } },
  });

  return NextResponse.json({
    listings: listings.map((l) => ({
      ...l,
      seller: { handle: toPublicHandle(l.seller.id) },
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isFullyVerified(user)) {
    return NextResponse.json(
      { error: "Verify your email and phone number before listing a ticket" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const {
    title,
    eventName,
    venue,
    eventDate,
    section,
    quantity,
    price,
    description,
    fulfillsRequestId,
    imageUrl,
  } = parsed.data;

  const contactInfoError = checkListingFieldsForContactInfo({
    "listing title": title,
    "event name": eventName,
    venue,
    section,
    description,
  });
  if (contactInfoError) {
    return NextResponse.json({ error: contactInfoError }, { status: 400 });
  }

  // Only link if the request still exists and is open — a stale or already
  // closed request just gets silently ignored rather than blocking the sale.
  let linkedRequest: {
    id: string;
    buyer: { name: string; email: string; phoneNumber: string };
  } | null = null;
  if (fulfillsRequestId) {
    const buyRequest = await db.buyRequest.findUnique({
      where: { id: fulfillsRequestId },
      include: { buyer: { select: { name: true, email: true, phoneNumber: true } } },
    });
    if (buyRequest && buyRequest.status === "OPEN") {
      linkedRequest = buyRequest;
    }
  }

  const listing = await db.listing.create({
    data: {
      title,
      eventName,
      venue,
      eventDate: new Date(eventDate),
      section,
      quantity,
      priceCents: bahtToCents(price),
      description,
      imageUrl,
      sellerId: user.id,
      fulfillsRequestId: linkedRequest?.id,
    },
  });

  if (linkedRequest) {
    const matchDetails = {
      eventName: listing.eventName,
      eventDate: listing.eventDate,
      buyer: {
        name: linkedRequest.buyer.name,
        email: linkedRequest.buyer.email,
        phoneNumber: linkedRequest.buyer.phoneNumber,
      },
      seller: {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      buyRequestId: linkedRequest.id,
      listingId: listing.id,
    };
    await notifyAdminOfMatch(matchDetails);
    await notifyPartiesOfMatch(matchDetails);
  }

  return NextResponse.json({ listing }, { status: 201 });
}
