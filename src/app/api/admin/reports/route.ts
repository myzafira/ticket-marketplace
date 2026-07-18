import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reports = await db.orderReport.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      reporter: { select: { name: true, email: true, phoneNumber: true } },
      order: {
        select: {
          id: true,
          totalCents: true,
          buyer: { select: { name: true, email: true, phoneNumber: true } },
          listing: {
            select: {
              id: true,
              eventName: true,
              seller: { select: { name: true, email: true, phoneNumber: true } },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ reports });
}
