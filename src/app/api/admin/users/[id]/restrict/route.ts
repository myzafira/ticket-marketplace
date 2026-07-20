import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!admin.permissions.includes("MANAGE_USERS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const user = await db.user.update({
    where: { id },
    data: { listingRestrictedAt: new Date() },
  });
  await logAdminAction(admin.id, "SELLER_RESTRICTED", user.name);

  return NextResponse.json({ listingRestrictedAt: user.listingRestrictedAt });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!admin.permissions.includes("MANAGE_USERS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const user = await db.user.update({
    where: { id },
    data: { listingRestrictedAt: null },
  });
  await logAdminAction(admin.id, "SELLER_UNRESTRICTED", user.name);

  return NextResponse.json({ listingRestrictedAt: null });
}
