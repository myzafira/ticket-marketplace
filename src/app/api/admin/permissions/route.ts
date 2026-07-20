import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import { ALL_ADMIN_PERMISSIONS } from "@/lib/permissions";

const CONFIGURABLE_ROLES = ["EXECUTIVE_ADMIN", "STAFF"] as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.isFullAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db.rolePermission.findMany({
    where: { role: { in: [...CONFIGURABLE_ROLES] } },
  });

  const matrix = CONFIGURABLE_ROLES.map((role) => ({
    role,
    permissions: ALL_ADMIN_PERMISSIONS.map((permission) => ({
      permission,
      granted: rows.some(
        (r) => r.role === role && r.permission === permission && r.granted
      ),
    })),
  }));

  return NextResponse.json({ matrix });
}

const schema = z.object({
  role: z.enum(CONFIGURABLE_ROLES),
  permission: z.enum([
    "MANAGE_USERS",
    "RESOLVE_REPORTS",
    "MARK_MATCHES_CALLED",
    "MANAGE_ANNOUNCEMENTS",
    "MANAGE_SETTINGS",
    "VIEW_STATS",
  ]),
  granted: z.boolean(),
});

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.isFullAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { role, permission, granted } = parsed.data;

  await db.rolePermission.upsert({
    where: { role_permission: { role, permission } },
    update: { granted },
    create: { role, permission, granted },
  });
  await logAdminAction(
    user.id,
    "PERMISSIONS_UPDATED",
    `${role}: ${permission} → ${granted ? "granted" : "revoked"}`
  );

  return NextResponse.json({ ok: true });
}
