import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { isCodeValid, MAX_CODE_ATTEMPTS } from "@/lib/verification";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email, code, newPassword } = parsed.data;

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!existing) {
    return NextResponse.json(
      { error: "That code is incorrect or has expired" },
      { status: 400 }
    );
  }

  // Same atomic-claim-before-check pattern as verify-email — see the
  // comment there for why the increment must happen before the code is
  // compared, not after.
  const claimed = await db.user.updateMany({
    where: { id: existing.id, passwordResetAttempts: { lt: MAX_CODE_ATTEMPTS } },
    data: { passwordResetAttempts: { increment: 1 } },
  });
  if (claimed.count === 0) {
    return NextResponse.json(
      { error: "Too many attempts — request a new code" },
      { status: 429 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: existing.id },
    select: { id: true, passwordResetCode: true, passwordResetExpiresAt: true },
  });

  if (!user || !isCodeValid(user.passwordResetCode, user.passwordResetExpiresAt, code)) {
    return NextResponse.json(
      { error: "That code is incorrect or has expired" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetCode: null,
      passwordResetExpiresAt: null,
      passwordResetAttempts: 0,
    },
  });

  return NextResponse.json({ ok: true });
}
