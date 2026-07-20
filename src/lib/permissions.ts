import { db } from "@/lib/db";
import type { AdminPermission, UserRole } from "@prisma/client";

// The full set of configurable admin capabilities. FULL_ADMIN always has
// every one of these regardless of the RolePermission table — it never
// queries the table at all, so a misconfigured matrix can't lock out the
// top tier. MANAGE_ROLES (assigning roles to other users) is deliberately
// not in this list: it's FULL_ADMIN-only and not configurable, since
// granting it to a lower tier would let that tier promote itself.
export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  "MANAGE_USERS",
  "RESOLVE_REPORTS",
  "MARK_MATCHES_CALLED",
  "MANAGE_ANNOUNCEMENTS",
  "MANAGE_SETTINGS",
  "VIEW_STATS",
];

const ADMIN_ROLES: UserRole[] = ["FULL_ADMIN", "EXECUTIVE_ADMIN", "STAFF"];

export function isAdminRole(role: UserRole) {
  return ADMIN_ROLES.includes(role);
}

export async function getPermissionsForRole(role: UserRole): Promise<AdminPermission[]> {
  if (role === "FULL_ADMIN") return ALL_ADMIN_PERMISSIONS;
  if (!isAdminRole(role)) return [];

  const rows = await db.rolePermission.findMany({
    where: { role, granted: true },
    select: { permission: true },
  });
  return rows.map((r) => r.permission);
}
