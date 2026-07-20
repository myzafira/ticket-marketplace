import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";

const schema = z.object({
  role: z.enum(["FULL_ADMIN", "EXECUTIVE_ADMIN", "STAFF", "VIP_USER", "GENERAL_USER"]),
});

// Assigning roles (including promoting someone to any admin tier) is
// FULL_ADMIN-only and deliberately not part of the configurable permission
// matrix — granting it to a lower tier would let that tier promote itself.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!admin.isFullAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (id === admin.id && parsed.data.role !== "FULL_ADMIN") {
    return NextResponse.json(
      { error: "You cannot change your own role away from Full Admin" },
      { status: 400 }
    );
  }

  const user = await db.user.update({
    where: { id },
    data: { role: parsed.data.role },
  });
  await logAdminAction(admin.id, "USER_ROLE_CHANGED", `${user.name} → ${parsed.data.role}`);

  return NextResponse.json({ role: user.role });
}
