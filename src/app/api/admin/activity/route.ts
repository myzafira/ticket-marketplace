import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  // The log spans every admin permission (including role/permission
  // changes), so there's no single dedicated permission for it — gate on
  // VIEW_STATS, the closest existing "read-only platform oversight"
  // permission, rather than leaving it open to any admin tier regardless of
  // what they've actually been granted.
  if (!user.permissions.includes("VIEW_STATS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const entries = await db.adminActionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { admin: { select: { name: true } } },
  });

  return NextResponse.json({ entries });
}
