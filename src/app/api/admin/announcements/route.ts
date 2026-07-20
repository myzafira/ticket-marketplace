import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";

const announcementSchema = z
  .object({
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(2000),
    linkUrl: z.string().url().max(500).optional().or(z.literal("")),
    linkLabel: z.string().max(100).optional().or(z.literal("")),
    priority: z.enum(["CRITICAL", "GENERAL"]),
    audience: z.enum(["USERS", "ADMINS"]),
    isActive: z.boolean().default(true),
    publishAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "Invalid publish date",
    }),
    expiresAt: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid expiry date" })
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => !data.expiresAt || new Date(data.expiresAt) > new Date(data.publishAt),
    { message: "Expiry date must be after the publish date", path: ["expiresAt"] }
  );

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.permissions.includes("MANAGE_ANNOUNCEMENTS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const announcements = await db.announcement.findMany({
    orderBy: [{ audience: "asc" }, { priority: "asc" }, { publishAt: "desc" }],
  });

  return NextResponse.json({ announcements });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.permissions.includes("MANAGE_ANNOUNCEMENTS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { title, body: content, linkUrl, linkLabel, priority, audience, isActive, publishAt, expiresAt } =
    parsed.data;

  const announcement = await db.announcement.create({
    data: {
      title,
      body: content,
      linkUrl: linkUrl || null,
      linkLabel: linkLabel || null,
      priority,
      audience,
      isActive,
      publishAt: new Date(publishAt),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });
  await logAdminAction(user.id, "ANNOUNCEMENT_CREATED", title);

  return NextResponse.json({ announcement }, { status: 201 });
}
