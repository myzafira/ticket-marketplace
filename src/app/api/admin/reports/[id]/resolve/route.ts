import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.permissions.includes("RESOLVE_REPORTS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const report = await db.orderReport.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date() },
    include: { order: { include: { listing: { select: { eventName: true } } } } },
  });
  await logAdminAction(user.id, "ORDER_REPORT_RESOLVED", report.order.listing.eventName);

  return NextResponse.json({ report });
}
