import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, isFullyVerified } from "@/lib/auth";
import { checkListingFieldsForContactInfo } from "@/lib/moderation";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

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
      { error: "Verify your email and phone number before leaving a review" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { rating, comment } = parsed.data;

  const contactInfoError = checkListingFieldsForContactInfo({ comment });
  if (contactInfoError) {
    return NextResponse.json({ error: contactInfoError }, { status: 400 });
  }

  const order = await db.order.findUnique({
    where: { id },
    include: { listing: { select: { sellerId: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Only completed orders can be reviewed" },
      { status: 409 }
    );
  }

  let revieweeId: string;
  if (order.buyerId === user.id) {
    revieweeId = order.listing.sellerId;
  } else if (order.listing.sellerId === user.id) {
    revieweeId = order.buyerId;
  } else {
    return NextResponse.json(
      { error: "You weren't part of this order" },
      { status: 403 }
    );
  }

  const existing = await db.review.findUnique({
    where: { orderId_reviewerId: { orderId: id, reviewerId: user.id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already reviewed this order" },
      { status: 409 }
    );
  }

  const review = await db.review.create({
    data: {
      orderId: id,
      reviewerId: user.id,
      revieweeId,
      rating,
      comment,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
