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
  if (!admin.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const user = await db.user.update({
    where: { id },
    data: { identityVerifiedAt: new Date() },
  });
  await logAdminAction(admin.id, "USER_VERIFIED", user.name);

  return NextResponse.json({ identityVerifiedAt: user.identityVerifiedAt });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!admin.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const user = await db.user.update({
    where: { id },
    data: { identityVerifiedAt: null },
  });
  await logAdminAction(admin.id, "USER_UNVERIFIED", user.name);

  return NextResponse.json({ identityVerifiedAt: null });
}
