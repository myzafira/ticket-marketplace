import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requiredImageUrlSchema } from "@/lib/imageUrl";

const ticketProofSchema = z.object({
  imageUrl: requiredImageUrlSchema,
  code: z.string().max(500).optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = ticketProofSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const order = await db.order.findUnique({
    where: { id },
    include: { listing: { select: { sellerId: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.listing.sellerId !== user.id) {
    return NextResponse.json(
      { error: "Only the seller can upload the ticket for this order" },
      { status: 403 }
    );
  }
  if (order.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "This order is no longer active" },
      { status: 409 }
    );
  }

  const updated = await db.order.update({
    where: { id },
    data: {
      ticketProofUrl: parsed.data.imageUrl,
      ticketProofCode: parsed.data.code ?? null,
    },
  });

  return NextResponse.json({
    ticketProofUrl: updated.ticketProofUrl,
    ticketProofCode: updated.ticketProofCode,
  });
}
