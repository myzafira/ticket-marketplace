import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, isFullyVerified } from "@/lib/auth";
import { toPublicHandle } from "@/lib/identity";
import { checkListingFieldsForContactInfo } from "@/lib/moderation";

const messageSchema = z.object({
  body: z.string().min(1).max(1000),
});

async function loadConversationForParticipant(id: string, userId: string) {
  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      listing: {
        select: {
          id: true,
          eventName: true,
          sellerId: true,
          seller: { select: { id: true, nickname: true } },
        },
      },
      buyer: { select: { id: true, nickname: true } },
    },
  });
  if (!conversation) return { error: "not_found" as const };
  if (conversation.buyerId !== userId && conversation.listing.sellerId !== userId) {
    return { error: "forbidden" as const };
  }
  return { conversation };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const result = await loadConversationForParticipant(id, user.id);
  if (result.error === "not_found") {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  if (result.error === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { conversation } = result;

  const messages = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });

  const otherParty =
    conversation.buyerId === user.id
      ? conversation.listing.seller
      : conversation.buyer;

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      listing: { id: conversation.listing.id, eventName: conversation.listing.eventName },
      otherParty: { handle: toPublicHandle(otherParty) },
    },
    messages: messages.map((m) => ({
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
      { error: "Verify your email and phone number before sending a message" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const result = await loadConversationForParticipant(id, user.id);
  if (result.error === "not_found") {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  if (result.error === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const [message] = await db.$transaction([
    db.message.create({
      data: { conversationId: id, senderId: user.id, body: parsed.data.body },
    }),
    db.conversation.update({ where: { id }, data: { updatedAt: new Date() } }),
  ]);

  return NextResponse.json(
    {
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
