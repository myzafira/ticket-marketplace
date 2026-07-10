import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { codeExpiry, generateVerificationCode } from "@/lib/verification";

const schema = z.object({ channel: z.enum(["email", "phone"]) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const code = generateVerificationCode();
  const expiresAt = codeExpiry();

  if (parsed.data.channel === "email") {
    await db.user.update({
      where: { id: user.id },
      data: { emailVerifyCode: code, emailVerifyExpiresAt: expiresAt },
    });
  } else {
    await db.user.update({
      where: { id: user.id },
      data: { phoneVerifyCode: code, phoneVerifyExpiresAt: expiresAt },
    });
  }

  // Stubbed: return the code instead of sending it via a real provider.
  return NextResponse.json({ devCode: code });
}
