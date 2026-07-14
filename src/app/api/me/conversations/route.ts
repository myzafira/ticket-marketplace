import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toPublicHandle } from "@/lib/identity";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ buyerId: user.id }, { listing: { sellerId: user.id } }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          eventName: true,
          seller: { select: { id: true, nickname: true } },
        },
      },
      buyer: { select: { id: true, nickname: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({
    conversations: conversations.map((c) => {
      const iAmBuyer = c.buyerId === user.id;
      const otherParty = iAmBuyer ? c.listing.seller : c.buyer;
      return {
        id: c.id,
        role: iAmBuyer ? ("buyer" as const) : ("seller" as const),
        listing: { id: c.listing.id, eventName: c.listing.eventName },
        otherParty: { handle: toPublicHandle(otherParty) },
        lastMessage: c.messages[0]?.body ?? null,
        updatedAt: c.updatedAt,
      };
    }),
  });
}
