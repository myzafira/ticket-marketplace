import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isCodeValid } from "@/lib/verification";

const schema = z.object({ code: z.string().min(1) });

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

  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { emailVerifyCode: true, emailVerifyExpiresAt: true },
  });

  if (!isCodeValid(record?.emailVerifyCode ?? null, record?.emailVerifyExpiresAt ?? null, parsed.data.code)) {
    return NextResponse.json(
      { error: "That code is incorrect or has expired" },
      { status: 400 }
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyCode: null, emailVerifyExpiresAt: null },
  });

  return NextResponse.json({ ok: true });
}
