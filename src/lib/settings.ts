import { db } from "@/lib/db";

export async function getPlatformSettings() {
  const existing = await db.platformSettings.findUnique({
    where: { id: "singleton" },
  });
  if (existing) return existing;

  return db.platformSettings.create({
    data: {
      id: "singleton",
      adminEmails: process.env.ADMIN_EMAIL ?? "",
    },
  });
}

export function parseAdminEmails(adminEmails: string) {
  return adminEmails
    .split(/[,\n]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
