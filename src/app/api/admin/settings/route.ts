import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/adminLog";

const settingsSchema = z
  .object({
    tier1MaxBaht: z.number().int().positive(),
    tier1Rate: z.number().min(0).max(1),
    tier2MaxBaht: z.number().int().positive(),
    tier2Rate: z.number().min(0).max(1),
    tier3Rate: z.number().min(0).max(1),
    maxResaleMarkupPercent: z.number().int().min(100).max(1000),
    trustedSellerMinSales: z.number().int().min(0).max(1000),
    trustedSellerFeeDiscountPercent: z.number().int().min(0).max(100),
    pointsEarnRatePercent: z.number().int().min(0).max(100),
    sellerReportWarningThreshold: z.number().int().min(1).max(1000),
    lineId: z.string().max(100).optional().nullable(),
    instagramId: z.string().max(100).optional().nullable(),
    phoneNumber: z.string().max(30).optional().nullable(),
  })
  .refine((data) => data.tier2MaxBaht > data.tier1MaxBaht, {
    message: "The second threshold must be greater than the first",
    path: ["tier2MaxBaht"],
  });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.permissions.includes("MANAGE_SETTINGS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getPlatformSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.permissions.includes("MANAGE_SETTINGS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  await getPlatformSettings();
  const settings = await db.platformSettings.update({
    where: { id: "singleton" },
    data: {
      tier1MaxBaht: parsed.data.tier1MaxBaht,
      tier1Rate: parsed.data.tier1Rate,
      tier2MaxBaht: parsed.data.tier2MaxBaht,
      tier2Rate: parsed.data.tier2Rate,
      tier3Rate: parsed.data.tier3Rate,
      maxResaleMarkupPercent: parsed.data.maxResaleMarkupPercent,
      trustedSellerMinSales: parsed.data.trustedSellerMinSales,
      trustedSellerFeeDiscountPercent: parsed.data.trustedSellerFeeDiscountPercent,
      pointsEarnRatePercent: parsed.data.pointsEarnRatePercent,
      sellerReportWarningThreshold: parsed.data.sellerReportWarningThreshold,
      lineId: parsed.data.lineId?.trim() || null,
      instagramId: parsed.data.instagramId?.trim() || null,
      phoneNumber: parsed.data.phoneNumber?.trim() || null,
    },
  });
  await logAdminAction(user.id, "SETTINGS_UPDATED");

  return NextResponse.json({ settings });
}
