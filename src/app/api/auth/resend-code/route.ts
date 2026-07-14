import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  codeExpiry,
  generateVerificationCode,
  sendVerificationEmail,
} from "@/lib/verification";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const code = generateVerificationCode();
  const expiresAt = codeExpiry();

  await db.user.update({
    where: { id: user.id },
    data: { emailVerifyCode: code, emailVerifyExpiresAt: expiresAt },
  });

  const { sent } = await sendVerificationEmail(user.email, code);

  return NextResponse.json({ devCode: sent ? undefined : code });
}
