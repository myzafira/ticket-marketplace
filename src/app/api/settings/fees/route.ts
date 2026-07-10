import { NextResponse } from "next/server";
import { buildFeeTiers } from "@/lib/fees";
import { getPlatformSettings } from "@/lib/settings";

export async function GET() {
  const settings = await getPlatformSettings();
  const tiers = buildFeeTiers(settings).map((t) => ({
    label: t.label,
    ratePercent: Math.round(t.rate * 1000) / 10,
  }));
  return NextResponse.json({ tiers });
}
