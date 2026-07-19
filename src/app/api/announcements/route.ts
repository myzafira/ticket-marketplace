import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { AnnouncementAudience } from "@prisma/client";

async function getVisible(audience: AnnouncementAudience) {
  const now = new Date();
  const baseWhere = {
    audience,
    isActive: true,
    publishAt: { lte: now },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };

  const [critical, general] = await Promise.all([
    db.announcement.findFirst({
      where: { ...baseWhere, priority: "CRITICAL" as const },
      orderBy: { publishAt: "desc" },
    }),
    db.announcement.findMany({
      where: { ...baseWhere, priority: "GENERAL" as const },
      orderBy: { publishAt: "desc" },
      take: 5,
    }),
  ]);

  return { critical, general };
}

export async function GET() {
  const user = await getCurrentUser();

  const [users, admins] = await Promise.all([
    getVisible("USERS"),
    user?.isAdmin ? getVisible("ADMINS") : Promise.resolve(null),
  ]);

  return NextResponse.json({ users, admins });
}
