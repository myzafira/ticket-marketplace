import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, isFullyVerified } from "@/lib/auth";
import { checkListingFieldsForContactInfo } from "@/lib/moderation";

const messageSchema = z.object({
  body: z.string().min(1).max(1000),
});

// Buyer-facing: get or create *their own* conversation about this listing.
// Sellers should use /api/listings/[id]/conversations to see all threads.

export async function GET(
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
  if (listing.sellerId === user.id) {
    return NextResponse.json(
      { error: "Sellers should use the conversations list for this listing" },
      { status: 400 }
    );
  }

  const conversation = await db.conversation.findUnique({
    where: { listingId_buyerId: { listingId: id, buyerId: user.id } },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) {
    return NextResponse.json({ conversation: null, messages: [] });
  }

  return NextResponse.json({
    conversation: { id: conversation.id },
    messages: conversation.messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      fromMe: m.senderId === user.id,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isFullyVerified(user)) {
    return NextResponse.json(
      { error: "Verify your email and phone number before messaging a seller" },
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
      { error: "You can't message yourself about your own listing" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const contactInfoError = checkListingFieldsForContactInfo({
    message: parsed.data.body,
  });
  if (contactInfoError) {
    return NextResponse.json({ error: contactInfoError }, { status: 400 });
  }

  const conversation = await db.conversation.upsert({
    where: { listingId_buyerId: { listingId: id, buyerId: user.id } },
    create: { listingId: id, buyerId: user.id },
    update: {},
  });

  const message = await db.message.create({
    data: {
      conversationId: conversation.id,
      senderId: user.id,
      body: parsed.data.body,
    },
  });

  return NextResponse.json(
    {
      conversation: { id: conversation.id },
      message: {
        id: message.id,
        body: message.body,
        createdAt: message.createdAt,
        fromMe: true,
      },
    },
    { status: 201 }
  );
}
