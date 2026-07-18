import { db } from "@/lib/db";
import type { AdminActionType } from "@prisma/client";

export async function logAdminAction(
  adminId: string,
  action: AdminActionType,
  targetLabel?: string
) {
  await db.adminActionLog.create({
    data: { adminId, action, targetLabel },
  });
}
