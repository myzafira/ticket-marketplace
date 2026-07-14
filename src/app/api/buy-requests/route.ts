import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, isFullyVerified } from "@/lib/auth";
import { bahtToCents } from "@/lib/format";
import { toPublicHandle } from "@/lib/identity";
import { checkListingFieldsForContactInfo } from "@/lib/moderation";
import { imageUrlSchema } from "@/lib/imageUrl";
import { getRatingSummaries } from "@/lib/ratings";

const createBuyRequestSchema = z.object({
  eventName: z.string().min(1).max(150),
  venue: z.string().max(150).optional(),
  eventDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Invalid event date",
  }),
  quantity: z.number().int().min(1).max(20),
  maxPrice: z.number().positive(),
  notes: z.string().max(2000).optional(),
  imageUrl: imageUrlSchema,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const buyRequests = await db.buyRequest.findMany({
    where: {
      status: "OPEN",
      ...(q
        ? {
            OR: [
              { eventName: { contains: q } },
              { venue: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { buyer: { select: { id: true } } },
  });

  const ratings = await getRatingSummaries(buyRequests.map((r) => r.buyer.id));

  return NextResponse.json({
    buyRequests: buyRequests.map((r) => ({
      ...r,
      buyer: {
        handle: toPublicHandle(r.buyer.id),
        rating: ratings.get(r.buyer.id) ?? { average: null, count: 0 },
      },
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
      { error: "Verify your email and phone number before posting a request" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = createBuyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { eventName, venue, eventDate, quantity, maxPrice, notes, imageUrl } =
    parsed.data;

  const contactInfoError = checkListingFieldsForContactInfo({
    "event name": eventName,
    venue,
    notes,
  });
  if (contactInfoError) {
    return NextResponse.json({ error: contactInfoError }, { status: 400 });
  }

  const buyRequest = await db.buyRequest.create({
    data: {
      eventName,
      venue,
      eventDate: new Date(eventDate),
      quantity,
      maxPriceCents: bahtToCents(maxPrice),
      notes,
      imageUrl,
      buyerId: user.id,
    },
  });

  return NextResponse.json({ buyRequest }, { status: 201 });
}
