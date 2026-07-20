import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, isFullyVerified } from "@/lib/auth";
import { bahtToCents } from "@/lib/format";
import { toPublicHandle } from "@/lib/identity";
import { checkListingFieldsForContactInfo } from "@/lib/moderation";
import { notifyAdminOfMatch, notifyPartiesOfMatch } from "@/lib/notifications";
import { imageUrlSchema } from "@/lib/imageUrl";
import { getRatingSummaries } from "@/lib/ratings";
import { getSalesCounts } from "@/lib/sellerStats";
import { findBestMatchingRequest } from "@/lib/matching";
import { getPlatformSettings } from "@/lib/settings";

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
  faceValue: z.number().positive(),
  description: z.string().max(2000).optional(),
  fulfillsRequestId: z.string().optional(),
  imageUrl: imageUrlSchema,
});

const SORT_OPTIONS = {
  date_asc: { eventDate: "asc" as const },
  date_desc: { eventDate: "desc" as const },
  price_asc: { priceCents: "asc" as const },
  price_desc: { priceCents: "desc" as const },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const section = searchParams.get("section")?.trim();
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const sortParam = searchParams.get("sort");
  const sort =
    sortParam && sortParam in SORT_OPTIONS
      ? (sortParam as keyof typeof SORT_OPTIONS)
      : "date_asc";

  const priceCents: { gte?: number; lte?: number } = {};
  if (minPrice && !Number.isNaN(Number(minPrice))) {
    priceCents.gte = bahtToCents(Number(minPrice));
  }
  if (maxPrice && !Number.isNaN(Number(maxPrice))) {
    priceCents.lte = bahtToCents(Number(maxPrice));
  }

  // Never surface listings for events that have already happened — they
  // can't be fulfilled anymore and just clutter the marketplace.
  const now = new Date();
  const eventDate: { gte?: Date; lte?: Date } = { gte: now };
  if (dateFrom && !Number.isNaN(Date.parse(dateFrom))) {
    const requestedFrom = new Date(dateFrom);
    if (requestedFrom > now) {
      eventDate.gte = requestedFrom;
    }
  }
  if (dateTo && !Number.isNaN(Date.parse(dateTo))) {
    // Inclusive of the whole end day.
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    eventDate.lte = end;
  }

  const currentUser = await getCurrentUser();
  // VIP early-access perk: a listing still inside its window is hidden from
  // the general browse list for everyone except the seller, VIP buyers, and
  // admins. Nested under its own AND (rather than a bare OR key) so it
  // doesn't collide with the text-search OR above.
  const bypassesEarlyAccess = Boolean(
    currentUser && (currentUser.role === "VIP_USER" || currentUser.isAdmin)
  );

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
      ...(section ? { section: { contains: section } } : {}),
      ...(Object.keys(priceCents).length > 0 ? { priceCents } : {}),
      ...(Object.keys(eventDate).length > 0 ? { eventDate } : {}),
      ...(bypassesEarlyAccess
        ? {}
        : {
            AND: [
              {
                OR: [
                  { vipEarlyAccessUntil: null },
                  { vipEarlyAccessUntil: { lte: now } },
                  ...(currentUser ? [{ sellerId: currentUser.id }] : []),
                ],
              },
            ],
          }),
    },
    orderBy: SORT_OPTIONS[sort],
    include: {
      seller: { select: { id: true, nickname: true, identityVerifiedAt: true } },
      ...(currentUser
        ? { favoritedBy: { where: { userId: currentUser.id }, select: { id: true } } }
        : {}),
    },
  });

  const sellerIds = listings.map((l) => l.seller.id);
  const [ratings, salesCounts] = await Promise.all([
    getRatingSummaries(sellerIds),
    getSalesCounts(sellerIds),
  ]);

  return NextResponse.json({
    listings: listings.map((l) => {
      const { favoritedBy, ...listing } = l as typeof l & {
        favoritedBy?: { id: string }[];
      };
      return {
        ...listing,
        seller: {
          handle: toPublicHandle(l.seller),
          rating: ratings.get(l.seller.id) ?? { average: null, count: 0 },
          isVerified: Boolean(l.seller.identityVerifiedAt),
          salesCount: salesCounts.get(l.seller.id) ?? 0,
        },
        isFavorited: Boolean(favoritedBy && favoritedBy.length > 0),
      };
    }),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isFullyVerified(user)) {
    return NextResponse.json(
      { error: "Verify your email before listing a ticket" },
      { status: 403 }
    );
  }
  if (user.listingRestrictedAt) {
    return NextResponse.json(
      {
        error:
          "Your listing privileges have been restricted due to repeated price complaints. Contact support.",
      },
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
    faceValue,
    description,
    fulfillsRequestId,
    imageUrl,
  } = parsed.data;

  const settings = await getPlatformSettings();
  const priceCents = bahtToCents(price);
  const faceValueCents = bahtToCents(faceValue);
  const maxAllowedCents = Math.round(
    (faceValueCents * settings.maxResaleMarkupPercent) / 100
  );
  if (priceCents > maxAllowedCents) {
    return NextResponse.json(
      {
        error: `Price can't exceed ${settings.maxResaleMarkupPercent}% of face value (max ${(maxAllowedCents / 100).toFixed(2)} THB) to prevent scalping`,
        errorKey: "errors.priceExceedsMarkupCap",
        maxAllowedCents,
        markupPercent: settings.maxResaleMarkupPercent,
      },
      { status: 400 }
    );
  }

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
  } else {
    // Seller didn't respond to a specific request — check whether this
    // listing happens to satisfy an open one anyway (same event/date/venue,
    // within budget, enough tickets) so the buyer gets notified either way.
    linkedRequest = await findBestMatchingRequest({
      eventName,
      venue,
      eventDate: new Date(eventDate),
      priceCents,
      quantity,
    });
  }

  const vipEarlyAccessUntil =
    settings.vipEarlyAccessMinutes > 0
      ? new Date(Date.now() + settings.vipEarlyAccessMinutes * 60 * 1000)
      : null;

  const listing = await db.listing.create({
    data: {
      title,
      eventName,
      venue,
      eventDate: new Date(eventDate),
      section,
      quantity,
      priceCents,
      faceValueCents,
      description,
      imageUrl,
      sellerId: user.id,
      fulfillsRequestId: linkedRequest?.id,
      vipEarlyAccessUntil,
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
