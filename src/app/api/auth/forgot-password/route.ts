import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  codeExpiry,
  generateVerificationCode,
  secondsUntilResendAllowed,
  sendPasswordResetEmail,
} from "@/lib/verification";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Always return the same response whether or not the email is registered
  // (or is mid-cooldown), so this endpoint can't be used to check which
  // emails have accounts.
  let devCode: string | undefined;
  if (user && secondsUntilResendAllowed(user.passwordResetExpiresAt) === 0) {
    const code = generateVerificationCode();
    const expiresAt = codeExpiry();
    await db.user.update({
      where: { id: user.id },
      data: { passwordResetCode: code, passwordResetExpiresAt: expiresAt, passwordResetAttempts: 0 },
    });
    const { sent } = await sendPasswordResetEmail(user.email, code);
    devCode = sent ? undefined : code;
  }

  return NextResponse.json({ ok: true, devCode });
}
