import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toPublicHandle } from "@/lib/identity";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const buyRequests = await db.buyRequest.findMany({
    where: { buyerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      // Only surface listings a buyer could still act on.
      fulfillingListings: {
        where: { status: "ACTIVE" },
        select: { id: true, priceCents: true },
      },
    },
  });

  return NextResponse.json({
    buyRequests: buyRequests.map((r) => ({
      ...r,
      buyer: { handle: toPublicHandle(user.id) },
    })),
  });
}
