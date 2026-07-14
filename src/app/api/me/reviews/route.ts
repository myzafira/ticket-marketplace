import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toPublicHandle } from "@/lib/identity";
import { getRatingSummary } from "@/lib/ratings";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [reviews, summary] = await Promise.all([
    db.review.findMany({
      where: { revieweeId: user.id },
      orderBy: { createdAt: "desc" },
      include: { reviewer: { select: { id: true } } },
    }),
    getRatingSummary(user.id),
  ]);

  return NextResponse.json({
    summary,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      reviewer: { handle: toPublicHandle(r.reviewer.id) },
    })),
  });
}
