import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  codeExpiry,
  generateVerificationCode,
  secondsUntilResendAllowed,
  sendVerificationEmail,
} from "@/lib/verification";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const existing = await db.user.findUnique({
    where: { id: user.id },
    select: { emailVerifyExpiresAt: true },
  });
  const wait = secondsUntilResendAllowed(existing?.emailVerifyExpiresAt ?? null);
  if (wait > 0) {
    return NextResponse.json(
      { error: "Please wait before requesting another code" },
      { status: 429 }
    );
  }

  const code = generateVerificationCode();
  const expiresAt = codeExpiry();

  await db.user.update({
    where: { id: user.id },
    data: { emailVerifyCode: code, emailVerifyExpiresAt: expiresAt, emailVerifyAttempts: 0 },
  });

  const { sent } = await sendVerificationEmail(user.email, code);

  return NextResponse.json({ devCode: sent ? undefined : code });
}
