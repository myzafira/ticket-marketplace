import { db } from "@/lib/db";

// Recipients for operational admin-notification emails (new match, new
// report, etc.) — every account currently in an admin-tier role, not just
// FULL_ADMIN, so staff/executive admins doing day-to-day ops see them too.
export async function getAdminEmails(): Promise<string[]> {
  const admins = await db.user.findMany({
    where: { role: { in: ["FULL_ADMIN", "EXECUTIVE_ADMIN", "STAFF"] } },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}

export async function getPlatformSettings() {
  // Upsert instead of find-then-create: two concurrent first-ever calls
  // racing to create the singleton row would otherwise throw an unhandled
  // unique-constraint error on the loser.
  return db.platformSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}
