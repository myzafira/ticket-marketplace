import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getListingReportCounts } from "@/lib/sellerStats";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.permissions.includes("MANAGE_USERS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ users: [] });
  }

  const users = await db.user.findMany({
    where: {
      OR: [{ email: { contains: q } }, { name: { contains: q } }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      nickname: true,
      identityVerifiedAt: true,
      listingRestrictedAt: true,
      createdAt: true,
      role: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const reportCounts = await getListingReportCounts(users.map((u) => u.id));

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      listingReportCount: reportCounts.get(u.id) ?? 0,
    })),
  });
}
